import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { Plus, Edit } from 'lucide-react'

export default async function AdminLocations() {
  const supabase = await createClient()
  const { data: locations } = await supabase.from('locations').select('*').order('type')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#0A1F44]">Locations</h1>
        <Link href="/admin/locations/new"
          className="flex items-center gap-2 bg-[#C9A84C] text-[#0A1F44] px-4 py-2 rounded-lg font-semibold text-sm hover:bg-yellow-400 transition-colors">
          <Plus size={16} /> Add Location
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Type</th>
              <th className="text-left px-4 py-3">Extra Fee</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {locations?.map((l: { id: string; name_en: string; name_es: string; type: string; extra_fee: number; is_active: boolean }) => (
              <tr key={l.id} className="border-t border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-[#0A1F44]">{l.name_en}</p>
                  <p className="text-xs text-gray-400">{l.name_es}</p>
                </td>
                <td className="px-4 py-3 capitalize text-gray-600">{l.type.replace('_', ' ')}</td>
                <td className="px-4 py-3 font-semibold">{l.extra_fee > 0 ? formatCurrency(l.extra_fee) : 'Free'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${l.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {l.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/locations/${l.id}`}
                    className="flex items-center gap-1 text-xs text-[#0A1F44] border border-[#0A1F44] px-2 py-1 rounded hover:bg-[#0A1F44] hover:text-white transition-colors">
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
