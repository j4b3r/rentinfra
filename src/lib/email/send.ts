import { waitUntil } from '@vercel/functions'
import { createAdminClient } from '@/lib/supabase/server'
import { getSecret } from '@/lib/settings'
import { renderTemplate, TemplateContext } from './templates'
import { SITE_URL } from '@/lib/site'

/**
 * Email delivery.
 *
 * Everything goes through `notifications_queue`: callers enqueue and return,
 * and a worker sends. That means a Resend outage delays a booking email
 * instead of failing the booking, and every attempt is recorded.
 *
 * Resend's REST API is called directly — one fetch, no SDK dependency.
 */

const MAX_ATTEMPTS = 3

interface QueueRow {
  id: string
  booking_id: string | null
  recipient: string
  template_key: string
  payload: Record<string, unknown> | null
  attempts: number
}

/** Adds an email to the queue. Never throws — enqueuing must not break a booking. */
export async function enqueueEmail(params: {
  bookingId?: string | null
  recipient: string
  templateKey: string
  payload?: Record<string, unknown>
}): Promise<void> {
  try {
    const supabase = await createAdminClient()
    await supabase.from('notifications_queue').insert({
      booking_id: params.bookingId ?? null,
      type: 'email',
      recipient: params.recipient,
      template_key: params.templateKey,
      payload: params.payload ?? {},
      status: 'pending',
    })
  } catch (e) {
    console.error('[email] could not enqueue:', e)
  }
}

/**
 * Drains the queue without making the caller wait.
 *
 * Booking confirmations should arrive in seconds, but the cron only runs daily
 * on Vercel's Hobby plan. So the booking route kicks off a send immediately and
 * returns; the customer's response is never delayed by SMTP, and the scheduled
 * run remains the backstop for anything this misses.
 */
export function flushEmailQueueInBackground(): void {
  const work = processEmailQueue().catch(e =>
    console.error('[email] background flush failed:', e)
  )

  // waitUntil keeps the function alive after the response is sent. Without it
  // Vercel can freeze the instance mid-send.
  try {
    waitUntil(work)
  } catch {
    // Outside the Vercel runtime (local `next start`) there is nothing to
    // register with — the promise runs to completion on its own.
    void work
  }
}

/** True when a key, a sender address and the toggle are all in place. */
export async function isEmailConfigured(): Promise<boolean> {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['resend_api_key', 'email_from_address', 'email_enabled'])

  const map = Object.fromEntries((data || []).map(s => [s.key, (s.value || '').trim()]))
  return Boolean(map.resend_api_key && map.email_from_address && map.email_enabled === 'true')
}

async function sendViaResend(args: {
  apiKey: string
  from: string
  to: string
  subject: string
  html: string
  text: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: args.from,
      to: [args.to],
      subject: args.subject,
      html: args.html,
      text: args.text,
    }),
  })

  if (res.ok) return { ok: true }

  const body = await res.text()
  return { ok: false, error: `Resend ${res.status}: ${body.slice(0, 300)}` }
}

/**
 * Sends queued emails.
 *
 * Returns counts rather than throwing, so the cron route can report what
 * happened. A row that fails is retried on the next run until MAX_ATTEMPTS,
 * then marked failed and left alone for someone to inspect.
 */
export async function processEmailQueue(limit = 25): Promise<{
  sent: number
  failed: number
  skipped: number
  reason?: string
}> {
  const supabase = await createAdminClient()

  const { data: settingsRows } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', [
      'resend_api_key',
      'email_from_address',
      'email_enabled',
      'company_name',
      'company_phone',
      'company_email',
      'notify_admin_email',
      'cancellation_policy_en',
    ])

  const s = Object.fromEntries((settingsRows || []).map(r => [r.key, (r.value || '').trim()]))

  if (s.email_enabled !== 'true') {
    return { sent: 0, failed: 0, skipped: 0, reason: 'Email is switched off in Settings → Integrations.' }
  }
  const apiKey = await getSecret('resend_api_key')
  if (!apiKey || !s.email_from_address) {
    return { sent: 0, failed: 0, skipped: 0, reason: 'Resend API key or sender address is missing.' }
  }

  const { data: queued } = await supabase
    .from('notifications_queue')
    .select('id, booking_id, recipient, template_key, payload, attempts')
    .eq('status', 'pending')
    .eq('type', 'email')
    .lt('attempts', MAX_ATTEMPTS)
    .order('created_at', { ascending: true })
    .limit(limit)

  const rows = (queued || []) as QueueRow[]
  if (rows.length === 0) return { sent: 0, failed: 0, skipped: 0 }

  const siteUrl = SITE_URL
  let sent = 0
  let failed = 0
  let skipped = 0

  for (const row of rows) {
    const payload = (row.payload || {}) as Record<string, unknown>

    const ctx: TemplateContext = {
      reference: String(payload.reference ?? ''),
      name: String(payload.name ?? 'there'),
      companyName: s.company_name || 'RentInfra',
      companyPhone: s.company_phone,
      companyEmail: s.company_email,
      siteUrl,
      carName: payload.carName ? String(payload.carName) : undefined,
      pickupDate: payload.pickupDate ? String(payload.pickupDate) : undefined,
      dropoffDate: payload.dropoffDate ? String(payload.dropoffDate) : undefined,
      totalAmount: typeof payload.totalAmount === 'number' ? payload.totalAmount : undefined,
      cancellationPolicy: s.cancellation_policy_en || undefined,
    }

    const email = renderTemplate(row.template_key, ctx)

    if (!email) {
      // Unknown template: no amount of retrying will fix it.
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

    const result = await sendViaResend({
      apiKey,
      from: s.email_from_address,
      to: row.recipient,
      subject: email.subject,
      html: email.html,
      text: email.text,
    })

    const attempts = row.attempts + 1

    if (result.ok) {
      await supabase
        .from('notifications_queue')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          subject: email.subject,
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
          // Keep it pending until we run out of attempts, so transient
          // failures recover on the next run.
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
