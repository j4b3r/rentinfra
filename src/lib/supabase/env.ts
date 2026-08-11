// Reconciles Supabase env var names between the "manual Supabase project" flow
// (NEXT_PUBLIC_SUPABASE_ANON_KEY, per .env.example / the classic Supabase dashboard)
// and the Vercel Marketplace Supabase integration, which injects the anon key under
// its newer "publishable key" name instead. Both flows are supported side by side —
// see DEPLOY.md.
export function supabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL!
}

export function supabaseAnonKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}

export function supabaseServiceRoleKey() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY!
  )
}
