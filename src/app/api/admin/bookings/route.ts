import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createAdminClient()
  const body = await req.json()

  const {
    carId, bookingType,
    pickupDate, pickupTime, dropoffDate, dropoffTime,
    pickupLocationId, dropoffLocationId, hotelName, hotelAddress,
    guestName, guestEmail, guestPhone, guestLicense,
    guestNiePassport, guestAddress, guestAddressSpain, driverAge,
    selectedAddons, totalDays, pricing,
    status, paymentStatus, paymentMethod, paymentMethodDeposit,
    kmAtPickup, fuelLevelPickup, notes,
  } = body

  if (!carId || !guestName || !pricing) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      booking_type: bookingType || 'offline',
      status: status || 'confirmed',
      user_id: null,
      car_id: carId,
      guest_name: guestName,
      guest_email: guestEmail || null,
      guest_phone: guestPhone || null,
      guest_license: guestLicense || null,
      guest_nie_passport: guestNiePassport || null,
      guest_address: guestAddress || null,
      guest_address_spain: guestAddressSpain || null,
      driver_age: driverAge || null,
      pickup_date: pickupDate,
      pickup_time: pickupTime,
      dropoff_date: dropoffDate,
      dropoff_time: dropoffTime,
      total_days: totalDays,
      pickup_location_id: pickupLocationId || null,
      dropoff_location_id: dropoffLocationId || null,
      hotel_name: hotelName || null,
      hotel_address: hotelAddress || null,
      daily_rate_snapshot: pricing.dailyRate,
      discount_applied_pct: pricing.discountPct || 0,
      addons_total: pricing.addonsTotal || 0,
      location_fee: pricing.locationFee || 0,
      young_driver_fee: pricing.youngDriverFee || 0,
      subtotal: pricing.subtotal,
      tax_amount: pricing.taxAmount,
      total_amount: pricing.total,
      payment_status: paymentStatus || 'unpaid',
      payment_method: paymentMethod || null,
      payment_method_deposit: paymentMethodDeposit || null,
      deposit_amount: pricing.total * (0.2), // 20% default deposit
      km_at_pickup: kmAtPickup || null,
      fuel_level_pickup: fuelLevelPickup || 'full',
      notes: notes || null,
      confirmed_at: (status === 'confirmed' || status === 'active') ? new Date().toISOString() : null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Insert addons
  if (selectedAddons && selectedAddons.length > 0) {
    const rows = selectedAddons.map(({ addon, quantity }: { addon: { id: string; name_en: string; pricing_type: string; price: number }; quantity: number }) => ({
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
    await supabase.from('booking_addons').insert(rows)
  }

  return NextResponse.json({ id: booking.id, reference: booking.reference })
}
