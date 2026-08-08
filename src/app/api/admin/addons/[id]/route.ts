import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-guard'
import { validateAddon } from '@/lib/validation/addon'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const payload = validateAddon(body)
  if ('error' in payload) return NextResponse.json({ error: payload.error }, { status: 400 })

  const supabase = await createAdminClient()
  const { data: addon, error } = await supabase
    .from('addons')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ addon })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params
  const supabase = await createAdminClient()

  // An addon referenced by a past booking (booking_addons snapshots the
  // name/price at time of booking, so it doesn't need the addon row to
  // survive) can still be deleted safely — but check car_addons links
  // first since those would silently break per-car scoping.
  const { count } = await supabase
    .from('car_addons')
    .select('*', { count: 'exact', head: true })
    .eq('addon_id', id)

  if (count && count > 0) {
    return NextResponse.json(
      { error: 'This addon is assigned to specific cars. Deactivate it instead of deleting.' },
      { status: 409 }
    )
  }

  const { error } = await supabase.from('addons').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
