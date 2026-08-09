import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSecret } from '@/lib/settings'
import { getOtaAvailabilityFeed } from '@/lib/ota/availability'
import { timingSafeEqual } from 'crypto'

/**
 * Outbound availability feed for a channel manager to pull.
 *
 * This is NOT /api/admin/* — a channel manager has no admin session, so
 * requireAdmin() cannot gate it. Its own bearer-token check against
 * ota_api_key stands in for that, same purpose as the payments webhook's
 * Stripe-signature check: a public endpoint that authenticates itself
 * rather than relying on the caller being logged in.
 *
 * No inbound booking ingestion here or anywhere else in the codebase — see
 * ROADMAP.md for why. This route only ever reads.
 */
export async function GET(req: NextRequest) {
  const supabase = await createAdminClient()

  const { data: settingsRows } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['ota_enabled'])
  const enabled = (settingsRows || []).find(s => s.key === 'ota_enabled')?.value === 'true'

  if (!enabled) {
    return NextResponse.json({ error: 'The OTA feed is switched off' }, { status: 404 })
  }

  const configuredKey = await getSecret('ota_api_key')
  if (!configuredKey) {
    return NextResponse.json({ error: 'No OTA API key configured' }, { status: 404 })
  }

  const auth = req.headers.get('authorization') || ''
  const presented = auth.startsWith('Bearer ') ? auth.slice(7) : ''

  if (!presented || !constantTimeEquals(presented, configuredKey)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const start = searchParams.get('start') || new Date().toISOString().slice(0, 10)
  const end = searchParams.get('end') || addDays(start, 90)

  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end) || start >= end) {
    return NextResponse.json({ error: 'start/end must be YYYY-MM-DD with start before end' }, { status: 400 })
  }

  const feed = await getOtaAvailabilityFeed(supabase, start, end)

  return NextResponse.json({ start, end, cars: feed })
}

/** Same-length, timing-safe comparison — a naive === leaks the key one byte at a time via response latency. */
function constantTimeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}
