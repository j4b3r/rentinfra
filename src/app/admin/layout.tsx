import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, full_name')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/')

  return (
    <div className="flex h-screen bg-[#F4F6F9]">
      <AdminSidebar userName={profile.full_name || user.email || 'Admin'} />
      <main className="flex-1 overflow-auto">
        <div className="p-7 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
