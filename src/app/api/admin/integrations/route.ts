import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-guard'

/**
 * Saves integration settings, including credentials.
 *
 * Secrets are write-only from the browser's point of view: the form shows a
 * masked placeholder for an existing key, and submitting that placeholder
 * unchanged leaves the stored value alone. A key is only overwritten when
 * someone actually types a new one.
 */

const SECRET_KEYS = ['resend_api_key', 'stripe_secret_key', 'stripe_webhook_secret', 'twilio_account_sid', 'twilio_auth_token']

/** The form sends this back when the field was not edited. */
const UNCHANGED = '__UNCHANGED__'

export async function POST(req: NextRequest) {
  const denied = await requireAdmin()
  if (denied) return denied

  const supabase = await createAdminClient()
  const body: Record<string, string> = await req.json()

  const entries = Object.entries(body).filter(([key, value]) => {
    // Skip secrets the admin did not retype.
    if (SECRET_KEYS.includes(key) && value === UNCHANGED) return false
    return true
  })

  for (const [key, value] of entries) {
    const { error } = await supabase
      .from('settings')
      .update({ value: value ?? '', updated_at: new Date().toISOString() })
      .eq('key', key)

    if (error) {
      return NextResponse.json({ error: `Could not save ${key}: ${error.message}` }, { status: 400 })
    }
  }

  return NextResponse.json({ success: true })
}
