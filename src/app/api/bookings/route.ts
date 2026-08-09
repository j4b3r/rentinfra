import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getConflictingBookings, nextFreeDate } from '@/lib/availability'
import { enqueueEmail, flushEmailQueueInBackground } from '@/lib/email/send'
import { enqueueMessage, flushMessageQueueInBackground } from '@/lib/twilio/send'
import { isPaymentsEnabled, getUpfrontAmount } from '@/lib/payments/stripe'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = await createAdminClient()

    const {
      carId, userId,
      pickupDate, pickupTime, dropoffDate, dropoffTime,
      pickupLocationId, dropoffLocationId,
      hotelName, hotelAddress,
      selectedAddons,
      guestName, guestEmail, guestPhone, guestLicense, guestNiePassport, guestAddress, guestAddressSpain, driverAge,
      totalDays, pricing,
    } = body

    // An unconfirmed booking holds the car for a limited time, so an abandoned
    // checkout cannot keep a vehicle off sale indefinitely. Staff clear the
    // expiry when they confirm.
    const { data: holdSettings } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['booking_hold_enabled', 'booking_hold_minutes'])

    const holdMap = Object.fromEntries((holdSettings || []).map(s => [s.key, s.value]))
    const holdMinutes = Number(holdMap.booking_hold_minutes) || 1440
    const holdExpiresAt =
      holdMap.booking_hold_enabled === 'false'
        ? null
        : new Date(Date.now() + holdMinutes * 60_000).toISOString()

    // Availability is decided by lib/availability.ts so this route, the fleet
    // listing and the car detail page always agree.
    const conflicts = await getConflictingBookings(supabase, pickupDate, dropoffDate, carId)

    if (conflicts.length > 0) {
      return NextResponse.json(
        {
          error: 'Car is not available for selected dates',
          nextAvailableDate: nextFreeDate(conflicts),
        },
        { status: 409 }
      )
    }

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        booking_type: 'online',
        status: 'pending',
        user_id: userId || null,
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone,
        guest_license: guestLicense || null,
        guest_nie_passport: guestNiePassport || null,
        guest_address: guestAddress || null,
        guest_address_spain: guestAddressSpain || null,
        car_id: carId,
        pickup_date: pickupDate,
        pickup_time: pickupTime,
        dropoff_date: dropoffDate,
        dropoff_time: dropoffTime,
        total_days: totalDays,
        pickup_location_id: pickupLocationId || null,
        dropoff_location_id: dropoffLocationId || null,
        hotel_name: hotelName || null,
        hotel_address: hotelAddress || null,
        daily_rate_snapshot: pricing?.dailyRate || 0,
        discount_applied_pct: pricing?.discountPct || 0,
        addons_total: pricing?.addonsTotal || 0,
        location_fee: pricing?.locationFee || 0,
        young_driver_fee: pricing?.youngDriverFee || 0,
        subtotal: pricing?.subtotal || 0,
        tax_amount: pricing?.taxAmount || 0,
        total_amount: pricing?.total || 0,
        payment_status: 'unpaid',
        driver_age: driverAge ? parseInt(driverAge) : null,
        hold_expires_at: holdExpiresAt,
      })
      .select()
      .single()

    if (bookingError) {
      // 23P01 = exclusion constraint violation. Another request booked this car
      // for overlapping dates between our availability check and this insert,
      // so the database rejected it. Report it as a conflict, not a failure.
      if (bookingError.code === '23P01') {
        const latest = await getConflictingBookings(supabase, pickupDate, dropoffDate, carId)
        return NextResponse.json(
          {
            error: 'Car is not available for selected dates',
            nextAvailableDate: nextFreeDate(latest),
          },
          { status: 409 }
        )
      }
      console.error('Booking error:', bookingError)
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
    }

    // Insert booking addons
    if (selectedAddons && selectedAddons.length > 0) {
      const addonRows = selectedAddons.map(({ addon, quantity }: { addon: { id: string; name_en: string; pricing_type: string; price: number }, quantity: number }) => ({
        booking_id: booking.id,
        addon_id: addon.id,
        addon_name_snapshot: addon.name_en,
        pricing_type_snapshot: addon.pricing_type,
        price_snapshot: addon.price,
        quantity,
        subtotal: addon.pricing_type === 'per_day'
          ? addon.price * totalDays * quantity
          : addon.price * quantity,
      }))

      await supabase.from('booking_addons').insert(addonRows)
    }

    // Queue the customer receipt and the internal alert. Both are sent by the
    // email worker, so a mail outage delays the notification instead of
    // failing the booking. Carries enough detail for the templates to render
    // the vehicle, dates and total.
    const { data: carRow } = await supabase
      .from('cars')
      .select('make, model')
      .eq('id', carId)
      .single()

    const emailPayload = {
      reference: booking.reference,
      name: guestName,
      carName: carRow ? `${carRow.make} ${carRow.model}` : undefined,
      pickupDate,
      dropoffDate,
      totalAmount: pricing?.total ?? null,
    }

    const { data: notifySettings } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', [
        'notify_new_booking', 'notify_admin_email', 'notify_booking_confirm',
        'notify_whatsapp_enabled', 'notify_sms_enabled',
      ])

    const notify = Object.fromEntries(
      (notifySettings || []).map(s => [s.key, (s.value || '').trim()])
    )

    if (notify.notify_booking_confirm !== 'false') {
      await enqueueEmail({
        bookingId: booking.id,
        recipient: guestEmail,
        templateKey: 'booking_confirmation',
        payload: emailPayload,
      })
    }

    if (notify.notify_new_booking !== 'false' && notify.notify_admin_email) {
      await enqueueEmail({
        bookingId: booking.id,
        recipient: notify.notify_admin_email,
        templateKey: 'admin_new_booking',
        payload: emailPayload,
      })
    }

    // WhatsApp/SMS toggles are separate from email's — a deployment can run
    // either, both, or neither. processMessageQueue() checks the account-
    // level whatsapp_enabled/sms_enabled switches too, so a row queued here
    // with the per-notification toggle on but the channel off overall just
    // sits pending rather than sending; harmless, but worth knowing.
    if (notify.notify_whatsapp_enabled === 'true' && guestPhone) {
      await enqueueMessage({
        channel: 'whatsapp',
        bookingId: booking.id,
        recipient: guestPhone,
        templateKey: 'booking_confirmation',
        payload: emailPayload,
      })
    }
    if (notify.notify_sms_enabled === 'true' && guestPhone) {
      await enqueueMessage({
        channel: 'sms',
        bookingId: booking.id,
        recipient: guestPhone,
        templateKey: 'booking_confirmation',
        payload: emailPayload,
      })
    }

    // Send now rather than waiting for the nightly cron; does not block the
    // response the customer is waiting on.
    flushEmailQueueInBackground()
    flushMessageQueueInBackground()

    // Tell the client whether to offer payment. When payments are off this is
    // all false/null and the flow is exactly as it was before Stripe existed.
    let payment: { enabled: boolean; amountDue: number | null; isPartial: boolean } = {
      enabled: false,
      amountDue: null,
      isPartial: false,
    }

    if (await isPaymentsEnabled()) {
      const { amount, isPartial } = await getUpfrontAmount(Number(pricing?.total || 0))
      payment = { enabled: true, amountDue: amount, isPartial }
    }

    return NextResponse.json({ reference: booking.reference, id: booking.id, payment })
  } catch (e) {
    console.error('API error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
