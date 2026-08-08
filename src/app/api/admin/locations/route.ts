import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-guard'
import { validateLocation } from '@/lib/validation/location'

export async function POST(req: NextRequest) {
  const denied = await requireAdmin()
  if (denied) return denied

  const body = await req.json().catch(() => ({}))
  const payload = validateLocation(body)
  if ('error' in payload) return NextResponse.json({ error: payload.error }, { status: 400 })

  const supabase = await createAdminClient()
  const { data: location, error } = await supabase.from('locations').insert(payload).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ location })
}
