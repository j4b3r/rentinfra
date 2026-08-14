import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { Calendar, Car, TrendingUp, DollarSign, Plus, ArrowUpRight, Clock, RotateCcw } from 'lucide-react'

const statusColor: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  active: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-red-100 text-red-600',
}

export default async function AdminDashboard() {
  const supabase = await createClient()

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const today = now.toISOString().split('T')[0]

  const [
    { count: totalBookings },
    { count: activeBookings },
    { count: totalCars },
    { data: monthBookings },
    { data: recentBookings },
    { data: todayPickups },
    { data: todayDropoffs },
  ] = await Promise.all([
    supabase.from('bookings').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).in('status', ['confirmed', 'active']),
    supabase.from('cars').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('bookings').select('total_amount').gte('created_at', monthStart).in('status', ['confirmed', 'active', 'completed']),
    supabase.from('bookings')
      .select('*, car:cars(make,model)')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase.from('bookings').select('*, car:cars(make,model)').eq('pickup_date', today).in('status', ['confirmed', 'active']),
    supabase.from('bookings').select('*, car:cars(make,model)').eq('dropoff_date', today).in('status', ['active']),
  ])

  const monthRevenue = monthBookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0

  const stats = [
    { label: 'Total Bookings', value: String(totalBookings || 0), icon: Calendar },
    { label: 'Active Now', value: String(activeBookings || 0), icon: TrendingUp },
    { label: 'Active Fleet', value: String(totalCars || 0), icon: Car },
    { label: 'Revenue This Month', value: formatCurrency(monthRevenue), icon: DollarSign },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--ink)]">Dashboard</h1>
          <p className="mt-0.5 text-sm text-[var(--ink-soft)]">
            {now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Link
          href="/admin/bookings/new"
          className="btn-signal flex items-center gap-2 px-4 py-2.5 text-sm font-bold"
        >
          <Plus size={15} /> New Booking
        </Link>
      </div>

      {/* Stats grid — each pane a lit signal on its icon only, restrained overall */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="op-stat p-5">
            <Icon size={18} className="text-[var(--pane-signal)]" />
            <p className="mt-3 text-2xl font-bold tabular-nums text-[var(--ink)]">{value}</p>
            <p className="mt-0.5 text-xs font-medium text-[var(--ink-soft)]">{label}</p>
          </div>
        ))}
      </div>

      {/* Today panels */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* Pickups */}
        <div className="op-panel overflow-hidden">
          <div className="op-panel-header flex items-center justify-between px-5 py-3.5">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-[var(--pane-signal)]" />
              <h3 className="text-sm font-bold text-[var(--ink)]">Today&apos;s Pickups</h3>
            </div>
            <span className="bg-[var(--glass-seeded)] px-2 py-0.5 text-xs font-bold tabular-nums text-[var(--ink)]">
              {todayPickups?.length || 0}
            </span>
          </div>
          <div className="divide-y divide-gray-100">
            {todayPickups && todayPickups.length > 0 ? todayPickups.map((b: {
              id: string; guest_name?: string; pickup_time: string; car?: { make: string; model: string }
            }) => (
              <Link key={b.id} href={`/admin/bookings/${b.id}`}
                className="group flex items-center justify-between px-5 py-3 transition-colors hover:bg-[var(--glass-paper)]">
                <div>
                  <p className="text-sm font-semibold text-[var(--ink)]">{b.guest_name || '—'}</p>
                  <p className="text-xs text-[var(--ink-soft)]">{b.car?.make} {b.car?.model}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[var(--ink-soft)] tabular-nums">{b.pickup_time}</span>
                  <ArrowUpRight size={13} className="text-gray-300 transition-colors group-hover:text-[var(--pane-signal)]" />
                </div>
              </Link>
            )) : (
              <p className="px-5 py-4 text-sm text-[var(--ink-soft)]">No pickups today</p>
            )}
          </div>
        </div>

        {/* Returns */}
        <div className="op-panel overflow-hidden">
          <div className="op-panel-header flex items-center justify-between px-5 py-3.5">
            <div className="flex items-center gap-2">
              <RotateCcw size={14} className="text-[var(--pane-signal)]" />
              <h3 className="text-sm font-bold text-[var(--ink)]">Today&apos;s Returns</h3>
            </div>
            <span className="bg-[var(--glass-seeded)] px-2 py-0.5 text-xs font-bold tabular-nums text-[var(--ink)]">
              {todayDropoffs?.length || 0}
            </span>
          </div>
          <div className="divide-y divide-gray-100">
            {todayDropoffs && todayDropoffs.length > 0 ? todayDropoffs.map((b: {
              id: string; guest_name?: string; dropoff_time: string; car?: { make: string; model: string }
            }) => (
              <Link key={b.id} href={`/admin/bookings/${b.id}`}
                className="group flex items-center justify-between px-5 py-3 transition-colors hover:bg-[var(--glass-paper)]">
                <div>
                  <p className="text-sm font-semibold text-[var(--ink)]">{b.guest_name || '—'}</p>
                  <p className="text-xs text-[var(--ink-soft)]">{b.car?.make} {b.car?.model}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[var(--ink-soft)] tabular-nums">{b.dropoff_time}</span>
                  <ArrowUpRight size={13} className="text-gray-300 transition-colors group-hover:text-[var(--pane-signal)]" />
                </div>
              </Link>
            )) : (
              <p className="px-5 py-4 text-sm text-[var(--ink-soft)]">No returns today</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent bookings table */}
      <div className="op-panel overflow-hidden">
        <div className="op-panel-header flex items-center justify-between px-5 py-3.5">
          <h3 className="text-sm font-bold text-[var(--ink)]">Recent Bookings</h3>
          <Link href="/admin/bookings" className="flex items-center gap-1 text-xs font-semibold text-[var(--pane-signal)] hover:underline">
            View all <ArrowUpRight size={12} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="op-table w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-[var(--ink-soft)]">
                <th className="px-5 py-3 text-left font-semibold">Reference</th>
                <th className="px-5 py-3 text-left font-semibold">Guest</th>
                <th className="px-5 py-3 text-left font-semibold">Car</th>
                <th className="px-5 py-3 text-left font-semibold">Dates</th>
                <th className="px-5 py-3 text-left font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings?.map((b: {
                id: string; reference: string; booking_type: string; guest_name?: string;
                pickup_date: string; dropoff_date: string; status: string; total_amount?: number;
                car?: { make: string; model: string }
              }) => (
                <tr key={b.id}>
                  <td className="px-5 py-3.5">
                    <Link href={`/admin/bookings/${b.id}`}
                      className="text-xs font-bold text-[var(--ink)] transition-colors hover:text-[var(--pane-signal)]">
                      {b.reference}
                    </Link>
                    {b.booking_type === 'offline' && (
                      <span className="ml-1.5 bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">offline</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-[var(--ink-soft)]">{b.guest_name || '—'}</td>
                  <td className="px-5 py-3.5 text-sm text-[var(--ink-soft)]">{b.car?.make} {b.car?.model}</td>
                  <td className="px-5 py-3.5 text-xs text-[var(--ink-soft)]">
                    {b.pickup_date} <span className="mx-1 text-gray-300">&rarr;</span> {b.dropoff_date}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusColor[b.status]}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right text-sm font-bold tabular-nums text-[var(--ink)]">
                    {b.total_amount ? formatCurrency(b.total_amount) : '—'}
                  </td>
                </tr>
              ))}
              {!recentBookings?.length && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-[var(--ink-soft)]">No bookings yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
