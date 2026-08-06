import { createClient } from '@/lib/supabase/server'

/**
 * Admin authorisation for API routes.
 *
 * The middleware protects `/admin` *pages*, but it never covered `/api/admin/*`,
 * and those routes use the service-role client, which bypasses RLS entirely.
 * That left every admin endpoint open: anyone could read bookings, rewrite
 * settings or pull a rental contract containing passport numbers.
 *
 * Every route under /api/admin must call requireAdmin() before touching data.
 */
export async function isAdminRequest(): Promise<boolean> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  return profile?.is_admin === true
}

/**
 * Returns a 403 Response when the caller is not an admin, or null when the
 * request may proceed:
 *
 *   const denied = await requireAdmin()
 *   if (denied) return denied
 */
export async function requireAdmin(): Promise<Response | null> {
  if (await isAdminRequest()) return null

  return new Response(JSON.stringify({ error: 'Not authorised' }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' },
  })
}
