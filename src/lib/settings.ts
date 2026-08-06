import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { Setting } from '@/types'

/**
 * Public settings as a flat key -> value map.
 *
 * The result of this function is passed into client components (the navbar and
 * footer both take it), so it must never contain credentials. Rows flagged
 * `is_secret` are excluded here and RLS withholds them from non-admins as
 * well — belt and braces, because leaking an API key to every visitor is not
 * a recoverable mistake.
 *
 * Use getSecret() for credentials, in server-side code only.
 */
export async function getSettingsMap(): Promise<Record<string, string>> {
  const supabase = await createClient()
  const { data } = await supabase.from('settings').select('*').eq('is_secret', false)
  return Object.fromEntries(((data || []) as Setting[]).map(s => [s.key, s.value]))
}

/**
 * Reads one secret setting using the service-role client.
 *
 * NEVER call this from a client component, and never return its result in a
 * server-component prop or an API response. Returns null when unset so callers
 * can treat "no key configured" as "feature disabled".
 */
export async function getSecret(key: string): Promise<string | null> {
  const supabase = await createAdminClient()
  const { data } = await supabase.from('settings').select('value').eq('key', key).single()
  const value = data?.value?.trim()
  return value ? value : null
}

/** Several secrets at once, same rules as getSecret(). */
export async function getSecrets(keys: string[]): Promise<Record<string, string | null>> {
  const supabase = await createAdminClient()
  const { data } = await supabase.from('settings').select('key, value').in('key', keys)
  const map = Object.fromEntries(((data || []) as Setting[]).map(s => [s.key, s.value?.trim() || null]))
  return Object.fromEntries(keys.map(k => [k, map[k] ?? null]))
}

/** Masks a credential for display: sk_live_abcd…4242 -> sk_live_…4242 */
export function maskSecret(value: string | null): string {
  if (!value) return ''
  if (value.length <= 8) return '••••'
  const prefix = value.slice(0, value.indexOf('_') + 1) || ''
  return `${prefix}••••${value.slice(-4)}`
}
