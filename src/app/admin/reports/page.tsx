import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import {
  netRevenue,
  utilization,
  revPAV,
  achievedADR,
  averageRentalLength,
  cancellationRate,
  addonAttachRate,
  revenueByMonth,
  utilizationByCategory,
  type ReportingBooking,
  type ReportingCar,
} from '@/lib/reporting'
import { TrendingUp, Percent, DollarSign, Gauge, Calendar, XCircle, Package } from 'lucide-react'

type Period = 'this_month' | 'last_month' | 'this_year' | 'last_12_months'

const PERIOD_LABEL: Record<Period, string> = {
  this_month: 'This month',
  last_month: 'Last month',
  this_year: 'This year',
  last_12_months: 'Last 12 months',
}

function periodRange(period: Period): { start: string; end: string } {
  const now = new Date()
  const iso = (d: Date) => d.toISOString().slice(0, 10)

  switch (period) {
    case 'last_month': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 1)
      return { start: iso(start), end: iso(end) }
    }
    case 'this_year': {
      const start = new Date(now.getFullYear(), 0, 1)
      return { start: iso(start), end: iso(now) }
    }
    case 'last_12_months': {
      const start = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate())
      return { start: iso(start), end: iso(now) }
    }
    case 'this_month':
    default: {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      return { start: iso(start), end: iso(now) }
    }
  }
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="op-stat p-5">
      <Icon size={18} className="text-[var(--pane-signal)]" />
      <p className="mt-3 text-2xl font-bold tabular-nums text-[var(--ink)]">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-[var(--ink-soft)]">{label}</p>
      {sub && <p className="mt-1 text-[11px] text-[var(--ink-soft)]">{sub}</p>}
    </div>
  )
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const { period: periodParam } = await searchParams
  const period: Period =
    periodParam === 'last_month' || periodParam === 'this_year' || periodParam === 'last_12_months'
      ? periodParam
      : 'this_month'

  const { start, end } = periodRange(period)
  const supabase = await createClient()

  const [{ data: bookingsData }, { data: carsData }, { data: addonRows }] = await Promise.all([
    supabase
      .from('bookings')
      .select(
        'id, car_id, status, pickup_date, dropoff_date, total_days, daily_rate_snapshot, total_amount, refunded_amount, created_at, cancelled_at, cancellation_reason'
      )
      .gte('created_at', start)
      .lt('created_at', `${end}T23:59:59`),
    supabase.from('cars').select('id, vehicle_type, category, make, model, created_at, is_active'),
    supabase.from('booking_addons').select('booking_id'),
  ])

  const bookings = (bookingsData || []) as ReportingBooking[]
  const cars = (carsData || []) as ReportingCar[]
  const addonBookingIds = new Set((addonRows || []).map(r => r.booking_id))

  const revenue = netRevenue(bookings)
  const util = utilization(bookings, cars, start, end)
  const rpav = revPAV(bookings, cars, start, end)
  const adr = achievedADR(bookings)
  const avgLength = averageRentalLength(bookings)
  const cancellations = cancellationRate(bookings)
  const attachRate = addonAttachRate(bookings, addonBookingIds)
  const byMonth = revenueByMonth(bookings)
  const byCategory = utilizationByCategory(bookings, cars, start, end)

  const maxMonthRevenue = Math.max(1, ...byMonth.map(m => m.revenue))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--ink)]">Reports</h1>
          <p className="mt-0.5 text-sm text-[var(--ink-soft)]">Business performance, computed from bookings — no separate reporting store.</p>
        </div>
        <div className="op-panel flex p-1 text-xs font-semibold">
          {(Object.keys(PERIOD_LABEL) as Period[]).map(p => (
            <Link
              key={p}
              href={`/admin/reports?period=${p}`}
              className={`px-3 py-1.5 transition-colors ${
                p === period ? 'bg-[var(--bar)] text-white' : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
              }`}
            >
              {PERIOD_LABEL[p]}
            </Link>
          ))}
        </div>
      </div>

      {/* Headline stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={DollarSign} label="Net revenue" value={formatCurrency(revenue)} sub="Total charged minus refunds, by sale date" />
        <StatCard
          icon={Percent}
          label="Fleet utilization"
          value={`${(util.rate * 100).toFixed(0)}%`}
          sub={`${util.rentedDays} of ${util.availableDays} car-days · active/completed only`}
        />
        <StatCard icon={TrendingUp} label="RevPAV" value={formatCurrency(rpav)} sub="Revenue per available vehicle day" />
        <StatCard icon={Gauge} label="Achieved ADR" value={formatCurrency(adr)} sub="Average daily rate actually charged" />
        <StatCard icon={Calendar} label="Avg. rental length" value={`${avgLength.toFixed(1)} days`} />
        <StatCard
          icon={XCircle}
          label="Cancellation rate"
          value={`${(cancellations.rate * 100).toFixed(0)}%`}
          sub={`${cancellations.customerCancelled} customer-cancelled · ${cancellations.expiredHolds} expired holds (excluded)`}
        />
        <StatCard icon={Package} label="Addon attach rate" value={`${(attachRate * 100).toFixed(0)}%`} sub="Bookings with at least one extra" />
        <StatCard icon={Calendar} label="Bookings in period" value={String(bookings.length)} sub="By date created, not rental dates" />
      </div>

      {/* Revenue by month */}
      <div className="op-panel p-5">
        <h2 className="mb-4 text-sm font-bold text-[var(--ink)]">Revenue by month</h2>
        {byMonth.length === 0 ? (
          <p className="text-sm text-[var(--ink-soft)]">No bookings in this period.</p>
        ) : (
          <div className="space-y-2">
            {byMonth.map(m => (
              <div key={m.month} className="flex items-center gap-3">
                <span className="w-16 shrink-0 text-xs text-[var(--ink-soft)]">{m.month}</span>
                <div className="h-6 flex-1 overflow-hidden bg-[var(--glass-paper)]">
                  <div
                    className="h-full bg-[var(--pane-signal)]"
                    style={{ width: `${Math.max(2, (m.revenue / maxMonthRevenue) * 100)}%` }}
                  />
                </div>
                <span className="w-24 shrink-0 text-right text-xs font-semibold tabular-nums text-[var(--ink)]">
                  {formatCurrency(m.revenue)}
                </span>
                <span className="w-16 shrink-0 text-right text-[11px] text-[var(--ink-soft)]">{m.bookings} bkgs</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Utilization by category */}
      <div className="op-panel p-5">
        <h2 className="mb-1 text-sm font-bold text-[var(--ink)]">Utilization by category</h2>
        <p className="mb-4 text-xs text-[var(--ink-soft)]">Cars only — motorbikes and bicycles can rent hourly, which doesn&apos;t compare to a days-based rate.</p>
        {byCategory.length === 0 ? (
          <p className="text-sm text-[var(--ink-soft)]">No cars in the fleet.</p>
        ) : (
          <div className="space-y-2">
            {byCategory.map(c => (
              <div key={c.category} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-xs capitalize text-[var(--ink-soft)]">{c.category}</span>
                <div className="h-6 flex-1 overflow-hidden bg-[var(--glass-paper)]">
                  <div
                    className="h-full bg-[var(--bar)]"
                    style={{ width: `${Math.max(2, c.rate * 100)}%` }}
                  />
                </div>
                <span className="w-12 shrink-0 text-right text-xs font-semibold tabular-nums text-[var(--ink)]">
                  {(c.rate * 100).toFixed(0)}%
                </span>
                <span className="w-24 shrink-0 text-right text-[11px] text-[var(--ink-soft)]">
                  {c.rentedDays}/{c.availableDays}d
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
