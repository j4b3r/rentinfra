import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth-guard'
import { getStripe, toMinorUnits } from '@/lib/payments/stripe'

/**
 * Refunds a Stripe payment, in full or in part.
 *
 * Deliberately admin-initiated rather than automatic: `cancellation_policy_en`
 * is free prose with no machine-readable window, so nothing here can decide
 * what a customer is owed. Staff make that call and this carries it out.
 *
 * The webhook (charge.refunded) is what writes the final payment_status, so a
 * refund issued directly in the Stripe dashboard is reflected too.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params
  const body = await req.json().catch(() => ({}))

  const stripe = await getStripe()
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 400 })
  }

  const supabase = await createAdminClient()
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, reference, stripe_payment_intent_id, amount_paid, refunded_amount')
    .eq('id', id)
    .single()

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }
  if (!booking.stripe_payment_intent_id) {
    return NextResponse.json(
      { error: 'This booking has no Stripe payment to refund' },
      { status: 400 }
    )
  }

  const paid = Number(booking.amount_paid || 0)
  const alreadyRefunded = Number(booking.refunded_amount || 0)
  const refundable = paid - alreadyRefunded

  if (refundable <= 0) {
    return NextResponse.json({ error: 'Nothing left to refund' }, { status: 400 })
  }

  // Omit the amount to refund everything still outstanding.
  const requested = body.amount != null ? Number(body.amount) : refundable

  if (!Number.isFinite(requested) || requested <= 0) {
    return NextResponse.json({ error: 'Enter a valid refund amount' }, { status: 400 })
  }
  if (requested > refundable) {
    return NextResponse.json(
      { error: `You can refund at most ${refundable.toFixed(2)}` },
      { status: 400 }
    )
  }

  try {
    const refund = await stripe.refunds.create({
      payment_intent: booking.stripe_payment_intent_id,
      amount: toMinorUnits(requested),
      reason: 'requested_by_customer',
    })

    // The webhook normally writes these, but update now so the admin sees the
    // result immediately rather than waiting for the event.
    const totalRefunded = alreadyRefunded + requested
    await supabase
      .from('bookings')
      .update({
        refunded_amount: totalRefunded,
        refunded_at: new Date().toISOString(),
        payment_status: totalRefunded >= paid ? 'refunded' : 'partial_refund',
        updated_at: new Date().toISOString(),
      })
      .eq('id', booking.id)

    return NextResponse.json({ ok: true, refundId: refund.id, refunded: requested })
  } catch (e) {
    console.error('[admin/refund]', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Refund failed' },
      { status: 500 }
    )
  }
}
