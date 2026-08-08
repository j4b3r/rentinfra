import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-guard'
import { validateAddon } from '@/lib/validation/addon'

export async function POST(req: NextRequest) {
  const denied = await requireAdmin()
  if (denied) return denied

  const body = await req.json().catch(() => ({}))
  const payload = validateAddon(body)
  if ('error' in payload) return NextResponse.json({ error: payload.error }, { status: 400 })

  const supabase = await createAdminClient()
  const { data: addon, error } = await supabase.from('addons').insert(payload).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ addon })
}
