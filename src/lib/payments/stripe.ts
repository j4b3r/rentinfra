import Stripe from 'stripe'
import { getSecret } from '@/lib/settings'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Stripe client.
 *
 * Every Stripe example constructs the client at module scope from
 * process.env. This project keeps the key in `settings` so it can be managed
 * from the admin panel, which means the client has to be built per request
 * from an async read. Clients are cached by key so rotating the key in the
 * admin panel takes effect without a redeploy.
 */

const clients = new Map<string, Stripe>()

export async function getStripe(): Promise<Stripe | null> {
  const key = await getSecret('stripe_secret_key')
  if (!key) return null

  const cached = clients.get(key)
  if (cached) return cached

  // No apiVersion pin: the installed SDK already defaults to the version it
  // was built against, and pinning an older one here breaks its types.
  const stripe = new Stripe(key)
  clients.set(key, stripe)
  return stripe
}

/** The webhook signing secret, needed to verify Stripe's requests. */
export function getWebhookSecret(): Promise<string | null> {
  return getSecret('stripe_webhook_secret')
}

/**
 * True when a key is stored and payments are switched on.
 *
 * Everything payment-related checks this first, so a deployment with no keys
 * behaves exactly as it did before Stripe existed: bookings are recorded as
 * unpaid and nobody is asked to pay.
 */
export async function isPaymentsEnabled(): Promise<boolean> {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['payments_enabled', 'stripe_secret_key'])

  const map = Object.fromEntries((data || []).map(s => [s.key, (s.value || '').trim()]))
  return map.payments_enabled === 'true' && Boolean(map.stripe_secret_key)
}

/**
 * How much to charge up front.
 *
 * `deposit_percentage` is a booking part-payment (it sits with tax and fees in
 * Rental Rules). 100 or 0 means take the full amount at checkout. The security
 * deposit is a separate, counter-side matter recorded in
 * `bookings.payment_method_deposit`, and is deliberately not charged here.
 */
export async function getUpfrontAmount(total: number): Promise<{
  amount: number
  isPartial: boolean
  percentage: number
}> {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'deposit_percentage')
    .single()

  const pct = Number(data?.value ?? 0)

  if (!pct || pct >= 100) {
    return { amount: round2(total), isPartial: false, percentage: 100 }
  }

  return { amount: round2((total * pct) / 100), isPartial: true, percentage: pct }
}

/** Stripe works in minor units; euros with fractional cents are rejected. */
export function toMinorUnits(amount: number): number {
  return Math.round(amount * 100)
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
