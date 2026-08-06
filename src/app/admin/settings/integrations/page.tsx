import { createAdminClient } from '@/lib/supabase/server'
import { maskSecret } from '@/lib/settings'
import IntegrationsForm, { IntegrationGroup } from '@/components/admin/IntegrationsForm'
import type { Setting } from '@/types'

const SECRET_KEYS = ['resend_api_key', 'stripe_secret_key', 'stripe_webhook_secret']

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
        <h1 className="text-2xl font-bold text-[#0A1F44]">Integrations</h1>
        <p className="mt-1 text-sm text-gray-500">
          Connect the outside services RentInfra uses. Keys are stored encrypted, are never sent to
          the public site, and cannot be read back once saved.
        </p>
      </div>

      <IntegrationsForm groups={GROUPS} values={values} configured={configured} />
    </div>
  )
}
