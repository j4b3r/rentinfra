import { createClient } from '@/lib/supabase/server'

export default async function AdminUsers() {
  const supabase = await createClient()
  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0A1F44] mb-6">Users</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Phone</th>
              <th className="text-left px-4 py-3">Language</th>
              <th className="text-left px-4 py-3">Role</th>
              <th className="text-left px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((u: { id: string; full_name?: string; phone?: string; preferred_language: string; is_admin: boolean; created_at: string }) => (
              <tr key={u.id} className="border-t border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-[#0A1F44]">{u.full_name || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{u.phone || '—'}</td>
                <td className="px-4 py-3 uppercase text-gray-500">{u.preferred_language}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${u.is_admin ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                    {u.is_admin ? 'Admin' : 'Customer'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {new Date(u.created_at).toLocaleDateString('en-GB')}
                </td>
              </tr>
            ))}
            {!users?.length && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No users yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
