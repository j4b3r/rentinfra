import { createClient } from '@/lib/supabase/server'
import type { Setting } from '@/types'

/**
 * Fetches all rows from the `settings` table and returns them as a flat
 * key -> value map. Server-side only (uses the server Supabase client).
 */
export async function getSettingsMap(): Promise<Record<string, string>> {
  const supabase = await createClient()
  const { data } = await supabase.from('settings').select('*')
  return Object.fromEntries(((data || []) as Setting[]).map(s => [s.key, s.value]))
}
