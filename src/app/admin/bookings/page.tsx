import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { Plus, ArrowUpRight } from 'lucide-react'

const statusColor: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  active: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-red-100 text-red-600',
}

const paymentColor: Record<string, string> = {
  unpaid: 'bg-red-100 text-red-600',
  deposit_paid: 'bg-amber-100 text-amber-700',
  paid: 'bg-emerald-100 text-emerald-700',
  refunded: 'bg-gray-100 text-gray-500',
  partial_refund: 'bg-orange-100 text-orange-700',
}

export default async function AdminBookings({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string }>
}) {
  const { status, type } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('bookings')
    .select('*, car:cars(make,model), pickup_location:locations!bookings_pickup_location_id_fkey(name_en)')
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (type) query = query.eq('booking_type', type)

  const { data: bookings } = await query.limit(100)

  const statuses = ['all', 'pending', 'confirmed', 'active', 'completed', 'cancelled']
  const current = status || 'all'

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0A1F44]">Bookings</h1>
          <p className="text-gray-400 text-sm mt-0.5">{bookings?.length || 0} bookings found</p>
        </div>
        <Link href="/admin/bookings/new"
          className="flex items-center gap-2 bg-[#C9A84C] hover:bg-yellow-400 text-[#0A1F44] px-4 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm">
          <Plus size={15} /> New Offline Booking
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center gap-2 flex-wrap">
          {statuses.map(s => (
            <a key={s}
              href={s === 'all' ? '/admin/bookings' : `/admin/bookings?status=${s}`}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                current === s && !type
                  ? 'bg-[#0A1F44] text-white shadow-sm'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}>
              {s}
            </a>
          ))}
          <div className="w-px h-4 bg-gray-200 mx-1" />
          <a href="/admin/bookings?type=offline"
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              type === 'offline' ? 'bg-[#0A1F44] text-white shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}>
            Offline Only
          </a>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <th className="text-left px-5 py-3.5 font-semibold">Reference</th>
                <th className="text-left px-5 py-3.5 font-semibold">Guest</th>
                <th className="text-left px-5 py-3.5 font-semibold">Car</th>
                <th className="text-left px-5 py-3.5 font-semibold">Pickup</th>
                <th className="text-left px-5 py-3.5 font-semibold">Return</th>
                <th className="text-left px-5 py-3.5 font-semibold">Status</th>
                <th className="text-left px-5 py-3.5 font-semibold">Payment</th>
                <th className="text-right px-5 py-3.5 font-semibold">Total</th>
                <th className="px-5 py-3.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bookings?.map((b: {
                id: string; reference: string; booking_type: string; guest_name?: string; guest_phone?: string;
                pickup_date: string; dropoff_date: string; status: string; payment_status: string; total_amount?: number;
                car?: { make: string; model: string }; pickup_location?: { name_en: string }
              }) => (
                <tr key={b.id} className="hover:bg-gray-50/60 transition-colors group">
                  <td className="px-5 py-3.5">
                    <Link href={`/admin/bookings/${b.id}`}
                      className="font-bold text-[#0A1F44] hover:text-[#C9A84C] transition-colors text-xs">
                      {b.reference}
                    </Link>
                    {b.booking_type === 'offline' && (
                      <span className="ml-1.5 text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded font-medium">offline</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-gray-700 font-medium">{b.guest_name || '—'}</p>
                    {b.guest_phone && <p className="text-xs text-gray-400">{b.guest_phone}</p>}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">{b.car?.make} {b.car?.model}</td>
                  <td className="px-5 py-3.5 text-xs text-gray-500">{b.pickup_date}</td>
                  <td className="px-5 py-3.5 text-xs text-gray-500">{b.dropoff_date}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusColor[b.status]}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${paymentColor[b.payment_status] || 'bg-gray-100 text-gray-500'}`}>
                      {b.payment_status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-bold text-[#0A1F44]">
                    {b.total_amount ? formatCurrency(b.total_amount) : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <Link href={`/admin/bookings/${b.id}`}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#C9A84C] font-semibold transition-colors opacity-0 group-hover:opacity-100">
                      View <ArrowUpRight size={11} />
                    </Link>
                  </td>
                </tr>
              ))}
              {!bookings?.length && (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-gray-400">No bookings found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
