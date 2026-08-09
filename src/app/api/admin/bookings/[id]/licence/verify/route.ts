import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-guard'

/**
 * Staff-only verification decision. Lives on `bookings`, not on the photo
 * rows — "verified" is a fact about the booking's driver after a visual
 * check, not a property either individual JPEG can carry independently.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id: bookingId } = await params
  const body = await req.json().catch(() => ({}))
  const action = body.action

  const supabase = await createAdminClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (action === 'verify') {
    const { error } = await supabase
      .from('bookings')
      .update({
        licence_verified_at: new Date().toISOString(),
        licence_verified_by: user?.id ?? null,
        licence_rejection_reason: null,
      })
      .eq('id', bookingId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === 'reject') {
    const reason = (body.reason || '').trim()
    if (!reason) return NextResponse.json({ error: 'Give a reason for rejecting' }, { status: 400 })

    const { error } = await supabase
      .from('bookings')
      .update({
        licence_verified_at: null,
        licence_verified_by: user?.id ?? null,
        licence_rejection_reason: reason,
      })
      .eq('id', bookingId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'action must be verify or reject' }, { status: 400 })
}
