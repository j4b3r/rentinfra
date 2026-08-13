import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { Plus, Edit } from 'lucide-react'

export default async function AdminLocations() {
  const supabase = await createClient()
  const { data: locations } = await supabase.from('locations').select('*').order('type')

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--ink)]">Locations</h1>
        <Link href="/admin/locations/new"
          className="btn-signal flex items-center gap-2 px-4 py-2 text-sm font-bold">
          <Plus size={16} /> Add Location
        </Link>
      </div>

      <div className="op-panel overflow-hidden">
        <table className="op-table w-full text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-[var(--ink-soft)]">
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Extra Fee</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {locations?.map((l: { id: string; name_en: string; name_es: string; type: string; extra_fee: number; is_active: boolean }) => (
              <tr key={l.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-[var(--ink)]">{l.name_en}</p>
                  <p className="text-xs text-[var(--ink-soft)]">{l.name_es}</p>
                </td>
                <td className="px-4 py-3 capitalize text-[var(--ink-soft)]">{l.type.replace('_', ' ')}</td>
                <td className="px-4 py-3 font-semibold text-[var(--ink)]">{l.extra_fee > 0 ? formatCurrency(l.extra_fee) : 'Free'}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${l.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {l.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/locations/${l.id}`}
                    className="btn-frame flex w-fit items-center gap-1 px-2 py-1 text-xs">
                    <Edit size={12} /> Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
