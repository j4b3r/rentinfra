import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { Plus, Edit } from 'lucide-react'

export default async function AdminAddons() {
  const supabase = await createClient()
  const { data: addons } = await supabase.from('addons').select('*').order('created_at')

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--ink)]">Addons &amp; Extras</h1>
        <Link href="/admin/addons/new"
          className="btn-signal flex items-center gap-2 px-4 py-2 text-sm font-bold">
          <Plus size={16} /> Add Addon
        </Link>
      </div>

      <div className="op-panel overflow-hidden">
        <table className="op-table w-full text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-[var(--ink-soft)]">
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Pricing</th>
              <th className="px-4 py-3 text-left">Price</th>
              <th className="px-4 py-3 text-left">Scope</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {addons?.map((a: { id: string; name_en: string; name_es: string; pricing_type: string; price: number; is_global: boolean; is_active: boolean }) => (
              <tr key={a.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-[var(--ink)]">{a.name_en}</p>
                  <p className="text-xs text-[var(--ink-soft)]">{a.name_es}</p>
                </td>
                <td className="px-4 py-3 capitalize text-[var(--ink-soft)]">{a.pricing_type.replace('_', ' ')}</td>
                <td className="px-4 py-3 font-semibold text-[var(--ink)]">{formatCurrency(a.price)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${a.is_global ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                    {a.is_global ? 'All Cars' : 'Per Car'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${a.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {a.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/addons/${a.id}`}
                    className="btn-frame flex w-fit items-center gap-1 px-2 py-1 text-xs">
                    <Edit size={12} /> Edit
                  </Link>
                </td>
              </tr>
            ))}
            {!addons?.length && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--ink-soft)]">No addons yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
