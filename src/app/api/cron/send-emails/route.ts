import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-guard'
import { processEmailQueue } from '@/lib/email/send'
import { processMessageQueue } from '@/lib/twilio/send'

/**
 * Sends queued emails, WhatsApp and SMS messages.
 *
 * Two ways in: the Vercel cron (Bearer CRON_SECRET) and an admin pressing
 * "Send now" in the admin panel, which matters because Hobby plans only run
 * crons once a day and nobody wants to wait until 03:00 for a confirmation.
 *
 * WhatsApp/SMS share this cron slot rather than getting their own — the
 * Hobby plan caps daily crons, and the queue-drain here is only the
 * backstop anyway; flushEmailQueueInBackground()/flushMessageQueueInBackground()
 * already send immediately when a booking is created or updated.
 */
async function handle(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  const isCron = secret && request.headers.get('authorization') === `Bearer ${secret}`

  if (!isCron) {
    const denied = await requireAdmin()
    if (denied) return denied
  }

  const [email, messages] = await Promise.all([processEmailQueue(), processMessageQueue()])

  if (email.sent || email.failed) {
    console.log(
      `[cron/send-emails] sent=${email.sent} failed=${email.failed} skipped=${email.skipped}`
    )
  }
  if (messages.sent || messages.failed) {
    console.log(
      `[cron/send-emails] whatsapp/sms sent=${messages.sent} failed=${messages.failed} skipped=${messages.skipped}`
    )
  }

  return NextResponse.json({ email, messages })
}

export async function GET(request: NextRequest) {
  return handle(request)
}

export async function POST(request: NextRequest) {
  return handle(request)
}
