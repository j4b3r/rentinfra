import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-guard'

/**
 * A damage claim is a record staff raise from condition photos — description,
 * amount, which photos support it. It does not move money: there is no saved
 * card to charge (Stripe Checkout here runs one-off, no `customer`), and the
 * security deposit is already a counter-side matter. Staff act on the claim
 * against the deposit or by invoicing separately; this just documents it.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id: bookingId } = await params
  const supabase = await createAdminClient()

  const { data: claims, error } = await supabase
    .from('booking_damage_claims')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ claims })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id: bookingId } = await params
  const body = await req.json().catch(() => ({}))

  const description = (body.description || '').trim()
  const amount = Number(body.amount)
  const photoIds = Array.isArray(body.photoIds) ? body.photoIds : []

  if (!description) return NextResponse.json({ error: 'Describe the damage' }, { status: 400 })
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Enter a valid amount' }, { status: 400 })
  }

  const supabase = await createAdminClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: claim, error } = await supabase
    .from('booking_damage_claims')
    .insert({
      booking_id: bookingId,
      description,
      amount,
      photo_ids: photoIds,
      created_by: user?.id ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ claim })
}
