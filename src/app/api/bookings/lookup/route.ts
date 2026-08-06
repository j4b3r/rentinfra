import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const reference = searchParams.get('reference')
  const email = searchParams.get('email')

  if (!reference || !email) {
    return NextResponse.json({ error: 'Missing reference or email' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      *,
      car:cars(*),
      pickup_location:locations!bookings_pickup_location_id_fkey(*),
      dropoff_location:locations!bookings_dropoff_location_id_fkey(*),
      booking_addons(*)
    `)
    .eq('reference', reference.toUpperCase())
    .eq('guest_email', email.toLowerCase())
    .single()

  if (!booking) {
    return NextResponse.json({ booking: null }, { status: 200 })
  }

  return NextResponse.json({ booking })
}
