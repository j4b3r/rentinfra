import { createAdminClient } from '@/lib/supabase/server'
import { getSecret } from '@/lib/settings'
import { renderMessage, MessageContext } from './templates'
import { waitUntil } from '@vercel/functions'

/**
 * WhatsApp and SMS delivery via Twilio.
 *
 * Mirrors lib/email/send.ts exactly: everything goes through
 * `notifications_queue` (type 'whatsapp' or 'sms', both already allowed by
 * the CHECK constraint from the original schema), callers enqueue and
 * return, a worker sends with retry. Twilio's REST API is called directly
 * with fetch — no SDK dependency, same choice as Resend/Stripe.
 *
 * Credentials are admin-managed settings, not env vars — same pattern as
 * every other integration in this project: entered and activated from
 * Settings → Integrations, is_secret rows, never exposed to the client.
 */

const MAX_ATTEMPTS = 3

type ChannelType = 'whatsapp' | 'sms'

interface QueueRow {
  id: string
  booking_id: string | null
  recipient: string
  template_key: string
  payload: Record<string, unknown> | null
  attempts: number
  type: ChannelType
}

/** Adds a WhatsApp or SMS message to the queue. Never throws. */
export async function enqueueMessage(params: {
  channel: ChannelType
  bookingId?: string | null
  recipient: string
  templateKey: string
  payload?: Record<string, unknown>
}): Promise<void> {
  try {
    const supabase = await createAdminClient()
    await supabase.from('notifications_queue').insert({
      booking_id: params.bookingId ?? null,
      type: params.channel,
      recipient: params.recipient,
      template_key: params.templateKey,
      payload: params.payload ?? {},
      status: 'pending',
    })
  } catch (e) {
    console.error(`[${params.channel}] could not enqueue:`, e)
  }
}

/** Same reasoning as flushEmailQueueInBackground(): send now, cron is the backstop. */
export function flushMessageQueueInBackground(): void {
  const work = processMessageQueue().catch(e =>
    console.error('[twilio] background flush failed:', e)
  )
  try {
    waitUntil(work)
  } catch {
    void work
  }
}

/** True when the account credentials, a WhatsApp sender and the toggle are all set. */
export async function isWhatsAppConfigured(): Promise<boolean> {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['twilio_account_sid', 'twilio_auth_token', 'twilio_whatsapp_from', 'whatsapp_enabled'])

  const map = Object.fromEntries((data || []).map(s => [s.key, (s.value || '').trim()]))
  return Boolean(
    map.twilio_account_sid && map.twilio_auth_token && map.twilio_whatsapp_from && map.whatsapp_enabled === 'true'
  )
}

/** Same, for SMS. Same account credentials, a different sender number and toggle. */
export async function isSmsConfigured(): Promise<boolean> {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['twilio_account_sid', 'twilio_auth_token', 'twilio_sms_from', 'sms_enabled'])

  const map = Object.fromEntries((data || []).map(s => [s.key, (s.value || '').trim()]))
  return Boolean(
    map.twilio_account_sid && map.twilio_auth_token && map.twilio_sms_from && map.sms_enabled === 'true'
  )
}

async function sendViaTwilio(args: {
  accountSid: string
  authToken: string
  from: string
  to: string
  body: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${args.accountSid}/Messages.json`
  const basicAuth = Buffer.from(`${args.accountSid}:${args.authToken}`).toString('base64')

  const form = new URLSearchParams({ From: args.from, To: args.to, Body: args.body })

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
  })

  if (res.ok) return { ok: true }

  const body = await res.text()
  return { ok: false, error: `Twilio ${res.status}: ${body.slice(0, 300)}` }
}

/**
 * Twilio expects WhatsApp numbers prefixed `whatsapp:`. The sender setting
 * is stored with the prefix already on it (matches Twilio's own docs, and
 * what the sandbox number looks like), but a recipient's plain phone number
 * from a booking never has it — add it here rather than asking every caller
 * to remember to.
 */
function toWhatsAppAddress(phone: string): string {
  return phone.startsWith('whatsapp:') ? phone : `whatsapp:${phone}`
}

/**
 * Sends queued WhatsApp/SMS messages. Returns counts rather than throwing,
 * mirroring processEmailQueue() so the cron route reports the same shape
 * for every channel.
 */
export async function processMessageQueue(limit = 25): Promise<{
  sent: number
  failed: number
  skipped: number
  reason?: string
}> {
  const supabase = await createAdminClient()

  const [{ data: settingsRows }, accountSid, authToken] = await Promise.all([
    supabase
      .from('settings')
      .select('key, value')
      .in('key', [
        'whatsapp_enabled',
        'sms_enabled',
        'twilio_whatsapp_from',
        'twilio_sms_from',
        'company_name',
        'company_phone',
        'company_email',
      ]),
    getSecret('twilio_account_sid'),
    getSecret('twilio_auth_token'),
  ])

  const s = Object.fromEntries((settingsRows || []).map(r => [r.key, (r.value || '').trim()]))

  if (!accountSid || !authToken) {
    return { sent: 0, failed: 0, skipped: 0, reason: 'Twilio credentials are missing in Settings → Integrations.' }
  }

  const whatsappOn = s.whatsapp_enabled === 'true' && Boolean(s.twilio_whatsapp_from)
  const smsOn = s.sms_enabled === 'true' && Boolean(s.twilio_sms_from)

  if (!whatsappOn && !smsOn) {
    return { sent: 0, failed: 0, skipped: 0, reason: 'WhatsApp and SMS are both switched off in Settings → Integrations.' }
  }

  const channels: ChannelType[] = [...(whatsappOn ? (['whatsapp'] as const) : []), ...(smsOn ? (['sms'] as const) : [])]

  const { data: queued } = await supabase
    .from('notifications_queue')
    .select('id, booking_id, recipient, template_key, payload, attempts, type')
    .eq('status', 'pending')
    .in('type', channels)
    .lt('attempts', MAX_ATTEMPTS)
    .order('created_at', { ascending: true })
    .limit(limit)

  const rows = (queued || []) as QueueRow[]
  if (rows.length === 0) return { sent: 0, failed: 0, skipped: 0 }

  let sent = 0
  let failed = 0
  let skipped = 0

  for (const row of rows) {
    const channel = row.type
    const payload = (row.payload || {}) as Record<string, unknown>
    const ctx: MessageContext = {
      reference: String(payload.reference ?? ''),
      name: String(payload.name ?? 'there'),
      companyName: s.company_name || 'RentInfra',
      companyPhone: s.company_phone,
      carName: payload.carName ? String(payload.carName) : undefined,
      pickupDate: payload.pickupDate ? String(payload.pickupDate) : undefined,
      dropoffDate: payload.dropoffDate ? String(payload.dropoffDate) : undefined,
      totalAmount: typeof payload.totalAmount === 'number' ? payload.totalAmount : undefined,
    }

    const body = renderMessage(row.template_key, ctx)

    if (!body) {
      await supabase
        .from('notifications_queue')
        .update({
          status: 'failed',
          error: `No template named "${row.template_key}"`,
          attempts: row.attempts + 1,
          last_attempt: new Date().toISOString(),
        })
        .eq('id', row.id)
      skipped++
      continue
    }

    const from = channel === 'whatsapp' ? toWhatsAppAddress(s.twilio_whatsapp_from) : s.twilio_sms_from
    const to = channel === 'whatsapp' ? toWhatsAppAddress(row.recipient) : row.recipient

    const result = await sendViaTwilio({ accountSid, authToken, from, to, body })
    const attempts = row.attempts + 1

    if (result.ok) {
      await supabase
        .from('notifications_queue')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          attempts,
          last_attempt: new Date().toISOString(),
          error: null,
        })
        .eq('id', row.id)
      sent++
    } else {
      await supabase
        .from('notifications_queue')
        .update({
          status: attempts >= MAX_ATTEMPTS ? 'failed' : 'pending',
          error: result.error,
          attempts,
          last_attempt: new Date().toISOString(),
        })
        .eq('id', row.id)
      failed++
    }
  }

  return { sent, failed, skipped }
}
