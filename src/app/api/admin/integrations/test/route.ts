import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-guard'
import { getSecret } from '@/lib/settings'

/**
 * Verifies a stored credential against the provider before anyone switches the
 * feature on, so a typo surfaces here rather than as silently undelivered mail
 * or a failed checkout.
 *
 * Only ever reports whether the key works — the key itself is never returned.
 */
export async function POST(req: NextRequest) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { provider } = await req.json()

  try {
    if (provider === 'resend') {
      const key = await getSecret('resend_api_key')
      if (!key) {
        return NextResponse.json({ ok: false, message: 'No Resend API key saved yet.' })
      }

      // Listing domains is a cheap authenticated call that sends no email.
      const res = await fetch('https://api.resend.com/domains', {
        headers: { Authorization: `Bearer ${key}` },
      })

      if (res.status === 401 || res.status === 403) {
        return NextResponse.json({ ok: false, message: 'Resend rejected this API key.' })
      }
      if (!res.ok) {
        return NextResponse.json({ ok: false, message: `Resend returned ${res.status}.` })
      }

      const body = await res.json()
      const domains: { name: string; status: string }[] = body.data || []
      const verified = domains.filter(d => d.status === 'verified').map(d => d.name)

      return NextResponse.json({
        ok: true,
        message: verified.length
          ? `Connected. Verified domains: ${verified.join(', ')}.`
          : 'Connected, but no verified sending domain yet. Verify one in Resend before enabling email.',
      })
    }

    if (provider === 'stripe') {
      const key = await getSecret('stripe_secret_key')
      if (!key) {
        return NextResponse.json({ ok: false, message: 'No Stripe secret key saved yet.' })
      }

      const res = await fetch('https://api.stripe.com/v1/account', {
        headers: { Authorization: `Bearer ${key}` },
      })

      if (!res.ok) {
        return NextResponse.json({ ok: false, message: 'Stripe rejected this secret key.' })
      }

      const account = await res.json()
      const mode = key.startsWith('sk_live_') ? 'live' : 'test'
      return NextResponse.json({
        ok: true,
        message: `Connected to ${account.business_profile?.name || account.email || 'your Stripe account'} in ${mode} mode.`,
      })
    }

    if (provider === 'twilio') {
      const [accountSid, authToken] = await Promise.all([
        getSecret('twilio_account_sid'),
        getSecret('twilio_auth_token'),
      ])
      if (!accountSid || !authToken) {
        return NextResponse.json({ ok: false, message: 'No Twilio Account SID or Auth Token saved yet.' })
      }

      // Fetching the account itself is a cheap authenticated call that sends
      // no message.
      const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString('base64')
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`, {
        headers: { Authorization: `Basic ${basicAuth}` },
      })

      if (res.status === 401) {
        return NextResponse.json({ ok: false, message: 'Twilio rejected this Account SID / Auth Token.' })
      }
      if (!res.ok) {
        return NextResponse.json({ ok: false, message: `Twilio returned ${res.status}.` })
      }

      const account = await res.json()
      return NextResponse.json({
        ok: true,
        message: `Connected to ${account.friendly_name || accountSid} (${account.status}).`,
      })
    }

    return NextResponse.json({ ok: false, message: 'Unknown provider.' }, { status: 400 })
  } catch (e) {
    return NextResponse.json({
      ok: false,
      message: e instanceof Error ? e.message : 'Could not reach the provider.',
    })
  }
}
