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
    { label: 'Total Bookings', value: String(totalBookings || 0), icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Active Now', value: String(activeBookings || 0), icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Active Fleet', value: String(totalCars || 0), icon: Car, color: 'text-[#C9A84C]', bg: 'bg-amber-50' },
    { label: 'Revenue This Month', value: formatCurrency(monthRevenue), icon: DollarSign, color: 'text-purple-500', bg: 'bg-purple-50' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0A1F44]">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Link href="/admin/bookings/new"
          className="flex items-center gap-2 bg-[#C9A84C] hover:bg-yellow-400 text-[#0A1F44] px-4 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm">
          <Plus size={15} /> New Booking
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={18} className={color} />
            </div>
            <p className="text-2xl font-extrabold text-[#0A1F44]">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Today panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pickups */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
                <Clock size={14} className="text-emerald-500" />
              </div>
              <h3 className="font-bold text-[#0A1F44] text-sm">Today&apos;s Pickups</h3>
            </div>
            <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
              {todayPickups?.length || 0}
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {todayPickups && todayPickups.length > 0 ? todayPickups.map((b: {
              id: string; guest_name?: string; pickup_time: string; car?: { make: string; model: string }
            }) => (
              <Link key={b.id} href={`/admin/bookings/${b.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors group">
                <div>
                  <p className="text-sm font-semibold text-[#0A1F44]">{b.guest_name || '—'}</p>
                  <p className="text-xs text-gray-400">{b.car?.make} {b.car?.model}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-medium">{b.pickup_time}</span>
                  <ArrowUpRight size={13} className="text-gray-300 group-hover:text-[#C9A84C] transition-colors" />
                </div>
              </Link>
            )) : (
              <p className="px-5 py-4 text-sm text-gray-400">No pickups today</p>
            )}
          </div>
        </div>

        {/* Returns */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                <RotateCcw size={14} className="text-blue-500" />
              </div>
              <h3 className="font-bold text-[#0A1F44] text-sm">Today&apos;s Returns</h3>
            </div>
            <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              {todayDropoffs?.length || 0}
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {todayDropoffs && todayDropoffs.length > 0 ? todayDropoffs.map((b: {
              id: string; guest_name?: string; dropoff_time: string; car?: { make: string; model: string }
            }) => (
              <Link key={b.id} href={`/admin/bookings/${b.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors group">
                <div>
                  <p className="text-sm font-semibold text-[#0A1F44]">{b.guest_name || '—'}</p>
                  <p className="text-xs text-gray-400">{b.car?.make} {b.car?.model}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-medium">{b.dropoff_time}</span>
                  <ArrowUpRight size={13} className="text-gray-300 group-hover:text-[#C9A84C] transition-colors" />
                </div>
              </Link>
            )) : (
              <p className="px-5 py-4 text-sm text-gray-400">No returns today</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent bookings table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-[#0A1F44]">Recent Bookings</h3>
          <Link href="/admin/bookings" className="flex items-center gap-1 text-xs text-[#C9A84C] font-semibold hover:text-yellow-600 transition-colors">
            View all <ArrowUpRight size={12} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 text-xs text-gray-400 uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-semibold">Reference</th>
                <th className="text-left px-5 py-3 font-semibold">Guest</th>
                <th className="text-left px-5 py-3 font-semibold">Car</th>
                <th className="text-left px-5 py-3 font-semibold">Dates</th>
                <th className="text-left px-5 py-3 font-semibold">Status</th>
                <th className="text-right px-5 py-3 font-semibold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentBookings?.map((b: {
                id: string; reference: string; booking_type: string; guest_name?: string;
                pickup_date: string; dropoff_date: string; status: string; total_amount?: number;
                car?: { make: string; model: string }
              }) => (
                <tr key={b.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <Link href={`/admin/bookings/${b.id}`}
                      className="font-bold text-[#0A1F44] hover:text-[#C9A84C] transition-colors text-xs">
                      {b.reference}
                    </Link>
                    {b.booking_type === 'offline' && (
                      <span className="ml-1.5 text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded font-medium">offline</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 text-sm">{b.guest_name || '—'}</td>
                  <td className="px-5 py-3.5 text-gray-500 text-sm">{b.car?.make} {b.car?.model}</td>
                  <td className="px-5 py-3.5 text-xs text-gray-400">
                    {b.pickup_date} <span className="text-gray-300 mx-1">→</span> {b.dropoff_date}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusColor[b.status]}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-bold text-[#0A1F44] text-sm">
                    {b.total_amount ? formatCurrency(b.total_amount) : '—'}
                  </td>
                </tr>
              ))}
              {!recentBookings?.length && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-400 text-sm">No bookings yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
