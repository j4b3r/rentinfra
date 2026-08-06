import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Releases cars held by unconfirmed bookings.
 *
 * A `pending` booking blocks its car, so an abandoned checkout would keep a
 * vehicle off sale forever. This cancels holds past `hold_expires_at`.
 *
 * Scheduled hourly by vercel.json. Vercel signs cron requests with
 * CRON_SECRET; when that variable is set the header must match, so the
 * endpoint cannot be triggered by anyone who finds the URL.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET

  if (secret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const supabase = await createAdminClient()
  const { data, error } = await supabase.rpc('expire_stale_booking_holds')

  if (error) {
    console.error('[cron/expire-holds]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const released = (data as number) ?? 0
  if (released > 0) {
    console.log(`[cron/expire-holds] released ${released} booking(s)`)
  }

  return NextResponse.json({ released })
}
