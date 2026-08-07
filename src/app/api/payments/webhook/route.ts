import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/server'
import { getStripe, getWebhookSecret } from '@/lib/payments/stripe'
import { enqueueEmail, flushEmailQueueInBackground } from '@/lib/email/send'

/**
 * Stripe webhook.
 *
 * This is a public endpoint — Stripe has no session, so requireAdmin() cannot
 * apply. Its authentication is the signature: the request body is verified
 * against the signing secret, and anything unsigned or mis-signed is rejected
 * before a single row is touched. Without a configured secret the endpoint
 * refuses everything rather than trusting the payload.
 *
 * Stripe retries on any non-2xx, so the handler is idempotent: it acts on a
 * state transition (unpaid -> paid) rather than on receiving an event, which
 * is what stops a retry from sending a second confirmation email.
 */
export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const secret = await getWebhookSecret()
  if (!secret) {
    console.error('[payments/webhook] no signing secret configured; rejecting')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 400 })
  }

  const stripe = await getStripe()
  if (!stripe) {
    return NextResponse.json({ error: 'Payments not configured' }, { status: 400 })
  }

  // Must be the raw body: parsing it first would change the bytes the
  // signature was computed over.
  const raw = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(raw, signature, secret)
  } catch (e) {
    console.error('[payments/webhook] signature verification failed:', e)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.payment_status !== 'paid') break

        const bookingId = session.metadata?.booking_id
        if (!bookingId) {
          console.error('[payments/webhook] session without booking_id', session.id)
          break
        }

        const { data: booking } = await supabase
          .from('bookings')
          .select('id, reference, guest_email, guest_name, payment_status, total_amount, car_id, pickup_date, dropoff_date')
          .eq('id', bookingId)
          .single()

        if (!booking) break

        // Idempotency: a retry finds the booking already paid and stops here,
        // so no duplicate email goes out.
        if (booking.payment_status === 'paid' || booking.payment_status === 'deposit_paid') {
          break
        }

        const paid = (session.amount_total ?? 0) / 100
        const isPartial = session.metadata?.is_partial === 'true'

        await supabase
          .from('bookings')
          .update({
            payment_status: isPartial ? 'deposit_paid' : 'paid',
            payment_method: 'stripe',
            amount_paid: paid,
            paid_at: new Date().toISOString(),
            stripe_payment_intent_id:
              typeof session.payment_intent === 'string' ? session.payment_intent : null,
            // A paid booking is no longer a provisional hold. The sweep also
            // checks payment_status, but clearing this keeps the data honest.
            hold_expires_at: null,
            status: 'confirmed',
            confirmed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', booking.id)

        if (booking.guest_email) {
          const { data: car } = booking.car_id
            ? await supabase.from('cars').select('make, model').eq('id', booking.car_id).single()
            : { data: null }

          await enqueueEmail({
            bookingId: booking.id,
            recipient: booking.guest_email,
            templateKey: 'booking_confirmed',
            payload: {
              reference: booking.reference,
              name: booking.guest_name || 'there',
              carName: car ? `${car.make} ${car.model}` : undefined,
              pickupDate: booking.pickup_date,
              dropoffDate: booking.dropoff_date,
              totalAmount: booking.total_amount ? Number(booking.total_amount) : null,
            },
          })
          flushEmailQueueInBackground()
        }
        break
      }

      case 'checkout.session.expired': {
        // The customer abandoned checkout. The booking stays as it was and the
        // normal hold-expiry sweep will release it, so there is nothing to do
        // beyond dropping the stale session id.
        const session = event.data.object as Stripe.Checkout.Session
        if (session.metadata?.booking_id) {
          await supabase
            .from('bookings')
            .update({ stripe_session_id: null })
            .eq('id', session.metadata.booking_id)
            .eq('stripe_session_id', session.id)
        }
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        const intentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : null
        if (!intentId) break

        const refunded = (charge.amount_refunded ?? 0) / 100
        const fullyRefunded = charge.amount_refunded >= charge.amount

        await supabase
          .from('bookings')
          .update({
            payment_status: fullyRefunded ? 'refunded' : 'partial_refund',
            refunded_amount: refunded,
            refunded_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_payment_intent_id', intentId)
        break
      }

      default:
        // Unhandled event types are acknowledged so Stripe stops retrying.
        break
    }
  } catch (e) {
    console.error('[payments/webhook] handler error:', e)
    // 500 makes Stripe retry, which is what we want for a transient failure.
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
