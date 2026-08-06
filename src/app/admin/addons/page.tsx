import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { Plus, Edit } from 'lucide-react'

export default async function AdminAddons() {
  const supabase = await createClient()
  const { data: addons } = await supabase.from('addons').select('*').order('created_at')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#0A1F44]">Addons & Extras</h1>
        <Link href="/admin/addons/new"
          className="flex items-center gap-2 bg-[#C9A84C] text-[#0A1F44] px-4 py-2 rounded-lg font-semibold text-sm hover:bg-yellow-400 transition-colors">
          <Plus size={16} /> Add Addon
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Pricing</th>
              <th className="text-left px-4 py-3">Price</th>
              <th className="text-left px-4 py-3">Scope</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {addons?.map((a: { id: string; name_en: string; name_es: string; pricing_type: string; price: number; is_global: boolean; is_active: boolean }) => (
              <tr key={a.id} className="border-t border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-[#0A1F44]">{a.name_en}</p>
                  <p className="text-xs text-gray-400">{a.name_es}</p>
                </td>
                <td className="px-4 py-3 capitalize text-gray-600">{a.pricing_type.replace('_', ' ')}</td>
                <td className="px-4 py-3 font-semibold">{formatCurrency(a.price)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${a.is_global ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                    {a.is_global ? 'All Cars' : 'Per Car'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${a.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {a.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/addons/${a.id}`}
                    className="flex items-center gap-1 text-xs text-[#0A1F44] border border-[#0A1F44] px-2 py-1 rounded hover:bg-[#0A1F44] hover:text-white transition-colors">
                    <Edit size={12} /> Edit
                  </Link>
                </td>
              </tr>
            ))}
            {!addons?.length && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No addons yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
