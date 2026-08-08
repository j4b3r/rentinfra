import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-guard'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; claimId: string }> }
) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { claimId } = await params
  const body = await req.json().catch(() => ({}))
  const status = body.status

  if (!['open', 'resolved', 'waived'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const supabase = await createAdminClient()
  const { error } = await supabase
    .from('booking_damage_claims')
    .update({
      status,
      resolved_at: status === 'open' ? null : new Date().toISOString(),
    })
    .eq('id', claimId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; claimId: string }> }
) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { claimId } = await params
  const supabase = await createAdminClient()
  const { error } = await supabase.from('booking_damage_claims').delete().eq('id', claimId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
