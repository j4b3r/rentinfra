import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createAdminClient()
  const body: Record<string, string> = await req.json()

  const updates = Object.entries(body).map(([key, value]) =>
    supabase.from('settings').update({ value, updated_at: new Date().toISOString() }).eq('key', key)
  )

  await Promise.all(updates)
  return NextResponse.json({ success: true })
}
