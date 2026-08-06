import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-guard'
import { processEmailQueue } from '@/lib/email/send'

/**
 * Sends queued emails.
 *
 * Two ways in: the Vercel cron (Bearer CRON_SECRET) and an admin pressing
 * "Send now" in the admin panel, which matters because Hobby plans only run
 * crons once a day and nobody wants to wait until 03:00 for a confirmation.
 */
async function handle(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  const isCron = secret && request.headers.get('authorization') === `Bearer ${secret}`

  if (!isCron) {
    const denied = await requireAdmin()
    if (denied) return denied
  }

  const result = await processEmailQueue()

  if (result.sent || result.failed) {
    console.log(
      `[cron/send-emails] sent=${result.sent} failed=${result.failed} skipped=${result.skipped}`
    )
  }

  return NextResponse.json(result)
}

export async function GET(request: NextRequest) {
  return handle(request)
}

export async function POST(request: NextRequest) {
  return handle(request)
}
