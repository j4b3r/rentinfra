import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-guard'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params
  const supabase = await createAdminClient()
  const body = await req.json()

  const allowed = ['status', 'payment_status', 'notes', 'km_at_pickup', 'km_at_return', 'fuel_level_pickup', 'fuel_level_return', 'payment_method_deposit']
  const update: Record<string, string | null> = {}
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  // Set timestamps based on status transition
  if (update.status === 'confirmed') update.confirmed_at = new Date().toISOString()
  if (update.status === 'cancelled') update.cancelled_at = new Date().toISOString()

  // Once a booking leaves `pending` it is no longer a provisional hold, so it
  // must not be swept by the expiry job.
  if (update.status && update.status !== 'pending') update.hold_expires_at = null

  const { data, error } = await supabase
    .from('bookings')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ booking: data })
}
