import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getConflictingBookings, nextFreeDate } from '@/lib/availability'

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

    // Queue notification (for future use)
    await supabase.from('notifications_queue').insert({
      booking_id: booking.id,
      type: 'email',
      recipient: guestEmail,
      template_key: 'booking_confirmation',
      payload: { reference: booking.reference, name: guestName },
      status: 'pending',
    })

    return NextResponse.json({ reference: booking.reference, id: booking.id })
  } catch (e) {
    console.error('API error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
