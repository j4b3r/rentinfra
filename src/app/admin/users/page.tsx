import { createClient } from '@/lib/supabase/server'

export default async function AdminUsers() {
  const supabase = await createClient()
  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-[var(--ink)]">Users</h1>

      <div className="op-panel overflow-hidden">
        <table className="op-table w-full text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-[var(--ink-soft)]">
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Phone</th>
              <th className="px-4 py-3 text-left">Language</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((u: { id: string; full_name?: string; phone?: string; preferred_language: string; is_admin: boolean; created_at: string }) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium text-[var(--ink)]">{u.full_name || '—'}</td>
                <td className="px-4 py-3 text-[var(--ink-soft)]">{u.phone || '—'}</td>
                <td className="px-4 py-3 uppercase text-[var(--ink-soft)]">{u.preferred_language}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${u.is_admin ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                    {u.is_admin ? 'Admin' : 'Customer'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-[var(--ink-soft)]">
                  {new Date(u.created_at).toLocaleDateString('en-GB')}
                </td>
              </tr>
            ))}
            {!users?.length && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--ink-soft)]">No users yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
