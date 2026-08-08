import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-guard'
import { rangesOverlap } from '@/lib/availability'

const REASONS = ['service', 'repair', 'cleaning', 'other']

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id: carId } = await params
  const supabase = await createAdminClient()

  const { data: blocks, error } = await supabase
    .from('maintenance_blocks')
    .select('*')
    .eq('car_id', carId)
    .order('start_date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ blocks })
}

/**
 * `maintenance_blocks_no_overlap` stops two blocks colliding, but that
 * constraint is scoped to this table only — it says nothing about a block
 * landing on top of an existing booking. Checked here instead of extending
 * bookings_no_overlap, since scheduling maintenance isn't concurrent-user
 * traffic the way booking creation is; a read-then-write check is an
 * acceptable trade for not touching a constraint that belongs to bookings.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id: carId } = await params
  const body = await req.json().catch(() => ({}))

  const startDate = body.startDate
  const endDate = body.endDate
  const reason = body.reason
  const notes = (body.notes || '').trim() || null

  if (!startDate || !endDate || startDate >= endDate) {
    return NextResponse.json({ error: 'Enter a valid date range' }, { status: 400 })
  }
  if (!REASONS.includes(reason)) {
    return NextResponse.json({ error: 'Invalid reason' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  const { data: conflicting } = await supabase
    .from('bookings')
    .select('pickup_date, dropoff_date')
    .eq('car_id', carId)
    .in('status', ['pending', 'confirmed', 'active'])

  const overlapsBooking = (conflicting || []).some(b =>
    rangesOverlap(startDate, endDate, b.pickup_date, b.dropoff_date)
  )
  if (overlapsBooking) {
    return NextResponse.json(
      { error: 'This car has a booking during that date range' },
      { status: 409 }
    )
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: block, error } = await supabase
    .from('maintenance_blocks')
    .insert({
      car_id: carId,
      start_date: startDate,
      end_date: endDate,
      reason,
      notes,
      created_by: user?.id ?? null,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23P01') {
      return NextResponse.json(
        { error: 'This overlaps another maintenance block on the same car' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ block })
}
