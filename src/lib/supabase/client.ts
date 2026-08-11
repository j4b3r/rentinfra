import { createBrowserClient } from '@supabase/ssr'
import { supabaseUrl, supabaseAnonKey } from './env'

export function createClient() {
  return createBrowserClient(supabaseUrl(), supabaseAnonKey())
}
