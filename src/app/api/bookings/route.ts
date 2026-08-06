import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

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

    // Check car availability (no overlapping confirmed/active bookings).
    // Two ranges overlap when the existing booking starts before the new one
    // ends AND ends after the new one starts. The inequalities are strict so a
    // car returned on the 14th can be picked up again on the 14th — same-day
    // turnaround is normal in rental and the times are handled at the counter.
    // Chained filters are ANDed by PostgREST; an .or() here would treat almost
    // any existing booking as a conflict and lock the car out permanently.
    const { data: conflicts } = await supabase
      .from('bookings')
      .select('id')
      .eq('car_id', carId)
      .in('status', ['confirmed', 'active', 'pending'])
      .lt('pickup_date', dropoffDate)
      .gt('dropoff_date', pickupDate)

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json({ error: 'Car is not available for selected dates' }, { status: 409 })
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
