import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-guard'
import { validateLocation } from '@/lib/validation/location'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const payload = validateLocation(body)
  if ('error' in payload) return NextResponse.json({ error: payload.error }, { status: 400 })

  const supabase = await createAdminClient()
  const { data: location, error } = await supabase
    .from('locations')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ location })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params
  const supabase = await createAdminClient()
  const { error } = await supabase.from('locations').delete().eq('id', id)

  if (error) {
    // No ON DELETE clause on bookings.pickup_location_id/dropoff_location_id
    // means Postgres rejects this with a foreign key violation (23503) when
    // a booking still references it — surface that as the real reason
    // rather than a generic 500.
    if (error.code === '23503') {
      return NextResponse.json(
        { error: 'This location is used by existing bookings. Deactivate it instead of deleting.' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
