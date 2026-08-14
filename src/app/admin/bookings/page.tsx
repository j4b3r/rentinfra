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
          <h1 className="text-xl font-bold text-[var(--ink)]">Bookings</h1>
          <p className="mt-0.5 text-sm text-[var(--ink-soft)]">{bookings?.length || 0} bookings found</p>
        </div>
        <Link
          href="/admin/bookings/new"
          className="btn-signal flex items-center gap-2 px-4 py-2.5 text-sm font-bold"
        >
          <Plus size={15} /> New Offline Booking
        </Link>
      </div>

      {/* Filters */}
      <div className="op-panel p-4">
        <div className="flex flex-wrap items-center gap-2">
          {statuses.map((s) => (
            <Link
              key={s}
              href={s === 'all' ? '/admin/bookings' : `/admin/bookings?status=${s}`}
              className={`px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors ${
                current === s && !type
                  ? 'bg-[var(--bar)] text-white'
                  : 'bg-[var(--glass-paper)] text-[var(--ink-soft)] hover:bg-[var(--glass-seeded)]'
              }`}
            >
              {s}
            </Link>
          ))}
          <div className="mx-1 h-4 w-px bg-gray-300" />
          <Link
            href="/admin/bookings?type=offline"
            className={`px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              type === 'offline'
                ? 'bg-[var(--bar)] text-white'
                : 'bg-[var(--glass-paper)] text-[var(--ink-soft)] hover:bg-[var(--glass-seeded)]'
            }`}
          >
            Offline Only
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="op-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="op-table w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-[var(--ink-soft)]">
                <th className="px-5 py-3.5 text-left font-semibold">Reference</th>
                <th className="px-5 py-3.5 text-left font-semibold">Guest</th>
                <th className="px-5 py-3.5 text-left font-semibold">Car</th>
                <th className="px-5 py-3.5 text-left font-semibold">Pickup</th>
                <th className="px-5 py-3.5 text-left font-semibold">Return</th>
                <th className="px-5 py-3.5 text-left font-semibold">Status</th>
                <th className="px-5 py-3.5 text-left font-semibold">Payment</th>
                <th className="px-5 py-3.5 text-right font-semibold">Total</th>
                <th className="px-5 py-3.5"></th>
              </tr>
            </thead>
            <tbody>
              {bookings?.map((b: {
                id: string; reference: string; booking_type: string; guest_name?: string; guest_phone?: string;
                pickup_date: string; dropoff_date: string; status: string; payment_status: string; total_amount?: number;
                car?: { make: string; model: string }; pickup_location?: { name_en: string }
              }) => (
                <tr key={b.id} className="group">
                  <td className="px-5 py-3.5">
                    <Link href={`/admin/bookings/${b.id}`}
                      className="text-xs font-bold text-[var(--ink)] transition-colors hover:text-[var(--pane-signal)]">
                      {b.reference}
                    </Link>
                    {b.booking_type === 'offline' && (
                      <span className="ml-1.5 bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">offline</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-[var(--ink)]">{b.guest_name || '—'}</p>
                    {b.guest_phone && <p className="text-xs text-[var(--ink-soft)]">{b.guest_phone}</p>}
                  </td>
                  <td className="px-5 py-3.5 text-[var(--ink-soft)]">{b.car?.make} {b.car?.model}</td>
                  <td className="px-5 py-3.5 text-xs text-[var(--ink-soft)]">{b.pickup_date}</td>
                  <td className="px-5 py-3.5 text-xs text-[var(--ink-soft)]">{b.dropoff_date}</td>
                  <td className="px-5 py-3.5">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusColor[b.status]}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${paymentColor[b.payment_status] || 'bg-gray-100 text-gray-500'}`}>
                      {b.payment_status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-bold text-[var(--ink)]">
                    {b.total_amount ? formatCurrency(b.total_amount) : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <Link href={`/admin/bookings/${b.id}`}
                      className="flex items-center gap-1 text-xs font-semibold text-[var(--ink-soft)] opacity-0 transition-opacity hover:text-[var(--pane-signal)] group-hover:opacity-100">
                      View <ArrowUpRight size={11} />
                    </Link>
                  </td>
                </tr>
              ))}
              {!bookings?.length && (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-[var(--ink-soft)]">No bookings found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
