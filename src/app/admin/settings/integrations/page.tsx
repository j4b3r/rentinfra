import { createAdminClient } from '@/lib/supabase/server'
import { maskSecret } from '@/lib/settings'
import IntegrationsForm, { IntegrationGroup } from '@/components/admin/IntegrationsForm'
import type { Setting } from '@/types'

const SECRET_KEYS = ['resend_api_key', 'stripe_secret_key', 'stripe_webhook_secret', 'twilio_account_sid', 'twilio_auth_token', 'ota_api_key']

const GROUPS: IntegrationGroup[] = [
  {
    provider: 'resend',
    title: 'Email (Resend)',
    blurb:
      'Sends booking confirmations to customers and new-booking alerts to you. Until this is connected, no email leaves the system.',
    docsUrl: 'https://resend.com/api-keys',
    fields: [
      {
        key: 'resend_api_key',
        label: 'API key',
        secret: true,
        placeholder: 're_…',
        description: 'From resend.com → API Keys. Stored encrypted and never shown again in full.',
      },
      {
        key: 'email_from_address',
        label: 'Send from',
        placeholder: 'bookings@your-domain.com',
        description: 'Must be on a domain you have verified in Resend, or delivery will fail.',
      },
      {
        key: 'email_enabled',
        label: 'Enable email',
        type: 'toggle',
        description: 'Send booking emails. Test the connection first.',
      },
    ],
  },
  {
    provider: 'stripe',
    title: 'Payments (Stripe)',
    blurb:
      'Collects the rental payment and places the security deposit hold. Bookings still work without it — they are simply recorded as unpaid.',
    docsUrl: 'https://dashboard.stripe.com/apikeys',
    fields: [
      {
        key: 'stripe_secret_key',
        label: 'Secret key',
        secret: true,
        placeholder: 'sk_test_… or sk_live_…',
        description: 'Start with a test key. Swap to the live key when you are ready to charge.',
      },
      {
        key: 'stripe_publishable_key',
        label: 'Publishable key',
        placeholder: 'pk_test_… or pk_live_…',
        description: 'Safe to expose — used by the checkout page in the browser.',
      },
      {
        key: 'stripe_webhook_secret',
        label: 'Webhook signing secret',
        secret: true,
        placeholder: 'whsec_…',
        description:
          'From the webhook endpoint you add in Stripe. Without it, payment confirmations cannot be trusted and will be rejected.',
      },
      {
        key: 'payments_enabled',
        label: 'Enable payments',
        type: 'toggle',
        description: 'Ask customers to pay during booking. Test the connection first.',
      },
    ],
  },
  {
    provider: 'twilio',
    title: 'WhatsApp & SMS (Twilio)',
    blurb:
      'Sends booking updates to customers over WhatsApp or SMS, alongside email. One Twilio account covers both — each channel has its own sender number and on/off switch below.',
    docsUrl: 'https://console.twilio.com',
    fields: [
      {
        key: 'twilio_account_sid',
        label: 'Account SID',
        secret: true,
        placeholder: 'AC…',
        description: 'From the Twilio Console dashboard.',
      },
      {
        key: 'twilio_auth_token',
        label: 'Auth Token',
        secret: true,
        placeholder: '••••••••',
        description: 'Also on the Console dashboard — click "show" to reveal it there.',
      },
      {
        key: 'twilio_whatsapp_from',
        label: 'WhatsApp sender number',
        placeholder: 'whatsapp:+14155238886',
        description: 'Twilio\'s WhatsApp sandbox number while testing, or your approved WhatsApp Business sender once live. Include the "whatsapp:" prefix.',
      },
      {
        key: 'whatsapp_enabled',
        label: 'Enable WhatsApp',
        type: 'toggle',
        description: 'Turns the channel on. Also requires the WhatsApp toggle in Settings → Notifications for a specific message to be sent.',
      },
      {
        key: 'twilio_sms_from',
        label: 'SMS sender number',
        placeholder: '+14155238886',
        description: 'A Twilio phone number capable of sending SMS.',
      },
      {
        key: 'sms_enabled',
        label: 'Enable SMS',
        type: 'toggle',
        description: 'Turns the channel on. Also requires the SMS toggle in Settings → Notifications.',
      },
    ],
  },
  {
    provider: 'ota',
    title: 'Channel Manager / OTA',
    blurb:
      'Exposes a read-only availability + rate feed at /api/ota/availability for a channel manager (Booking.com Connectivity, SiteMinder, Channex, or similar) to pull. This is one-way: it publishes availability out, it does not import bookings from the OTA. No specific provider is wired in — set any bearer token below and give the same value to whichever channel manager you connect.',
    docsUrl: '/api/ota/availability',
    docsLabel: 'View feed →',
    fields: [
      {
        key: 'ota_provider',
        label: 'Channel manager name',
        placeholder: 'e.g. SiteMinder',
        description: 'Display only, so you remember which one this is set up for.',
      },
      {
        key: 'ota_api_key',
        label: 'API key',
        secret: true,
        placeholder: 'Any value you choose',
        description: 'Generate a long random string and give the same value to your channel manager as its bearer token — this app does not issue it for you.',
      },
      {
        key: 'ota_property_id',
        label: 'Property ID',
        placeholder: 'Optional — only if your channel manager needs one',
      },
      {
        key: 'ota_enabled',
        label: 'Enable feed',
        type: 'toggle',
        description: 'Serves the feed once on. Off returns 404 to any request, key or no key.',
      },
    ],
  },
]

export default async function IntegrationsSettings() {
  // Service-role client: this page must read secret rows to report which are
  // configured. Only masked previews are ever sent to the browser.
  const supabase = await createAdminClient()
  const keys = GROUPS.flatMap(g => g.fields.map(f => f.key))
  const { data } = await supabase.from('settings').select('key, value').in('key', keys)

  const raw = Object.fromEntries(((data || []) as Setting[]).map(s => [s.key, s.value || '']))

  const values: Record<string, string> = {}
  const configured: Record<string, boolean> = {}

  for (const key of keys) {
    const value = raw[key] || ''
    if (SECRET_KEYS.includes(key)) {
      configured[key] = value.trim().length > 0
      values[key] = maskSecret(value) // never the real key
    } else {
      values[key] = value
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[var(--ink)]">Integrations</h1>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">
          Connect the outside services RentInfra uses. Keys are stored encrypted, are never sent to
          the public site, and cannot be read back once saved.
        </p>
      </div>

      <IntegrationsForm groups={GROUPS} values={values} configured={configured} />
    </div>
  )
}
