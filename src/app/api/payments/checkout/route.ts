import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getStripe, isPaymentsEnabled, getUpfrontAmount, toMinorUnits } from '@/lib/payments/stripe'
import { SITE_URL } from '@/lib/site'

/**
 * Starts a Stripe Checkout session for an existing booking.
 *
 * The booking is created first and always exists regardless of payment, so an
 * abandoned checkout leaves a normal unpaid booking that the hold-expiry sweep
 * cleans up — rather than losing the reservation entirely.
 *
 * Takes a booking reference and email rather than an amount: the price is read
 * from the stored booking, so a caller cannot choose what to pay.
 */
export async function POST(req: NextRequest) {
  if (!(await isPaymentsEnabled())) {
    return NextResponse.json({ error: 'Payments are not enabled' }, { status: 400 })
  }

  const stripe = await getStripe()
  if (!stripe) {
    return NextResponse.json({ error: 'Payments are not configured' }, { status: 400 })
  }

  const { reference, email } = await req.json()
  if (!reference || !email) {
    return NextResponse.json({ error: 'Booking reference and email are required' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  // Reference plus email, so knowing a reference alone is not enough to pull
  // up someone else's booking.
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, reference, guest_email, guest_name, total_amount, payment_status, status, car_id')
    .eq('reference', reference)
    .ilike('guest_email', email)
    .single()

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }
  if (booking.status === 'cancelled') {
    return NextResponse.json({ error: 'This booking has been cancelled' }, { status: 409 })
  }
  if (booking.payment_status === 'paid') {
    return NextResponse.json({ error: 'This booking is already paid' }, { status: 409 })
  }

  const total = Number(booking.total_amount || 0)
  if (total <= 0) {
    return NextResponse.json({ error: 'This booking has no amount to pay' }, { status: 400 })
  }

  const { amount, isPartial, percentage } = await getUpfrontAmount(total)

  const { data: car } = await supabase
    .from('cars')
    .select('make, model')
    .eq('id', booking.car_id)
    .single()

  const vehicle = car ? `${car.make} ${car.model}` : 'Vehicle rental'
  const { data: currencyRow } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'currency')
    .single()
  const currency = (currencyRow?.value || 'EUR').toLowerCase()

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: booking.guest_email ?? undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: toMinorUnits(amount),
            product_data: {
              name: vehicle,
              description: isPartial
                ? `Booking ${booking.reference} — ${percentage}% deposit. Balance due at pick-up.`
                : `Booking ${booking.reference} — full payment`,
            },
          },
        },
      ],
      // The webhook is the source of truth; metadata lets it find the booking.
      metadata: {
        booking_id: booking.id,
        booking_reference: booking.reference,
        is_partial: String(isPartial),
      },
      success_url: `${SITE_URL}/booking/success?ref=${booking.reference}`,
      cancel_url: `${SITE_URL}/my-booking?ref=${booking.reference}&payment=cancelled`,
    })

    await supabase
      .from('bookings')
      .update({ stripe_session_id: session.id })
      .eq('id', booking.id)

    return NextResponse.json({ url: session.url, amount, isPartial })
  } catch (e) {
    console.error('[payments/checkout]', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Could not start checkout' },
      { status: 500 }
    )
  }
}
