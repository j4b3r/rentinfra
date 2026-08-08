import { rangesOverlap } from '@/lib/availability'

/**
 * Business KPIs, computed from data that already exists — no new columns.
 *
 * These are pure functions: rows in, numbers out. The admin reports page
 * fetches from Supabase and hands the rows here, so the definitions below
 * are testable and only live in one place.
 *
 * Every metric below is a deliberate choice among several plausible ones.
 * The choice is stated in each function's comment and mirrored in the UI —
 * a KPI computed one reasonable way and labeled with a standard industry
 * name is worse than no KPI, because someone will act on it.
 */

export interface ReportingBooking {
  id: string
  car_id: string
  status: string
  pickup_date: string
  dropoff_date: string
  total_days: number
  daily_rate_snapshot: number | null
  total_amount: number | null
  refunded_amount: number | null
  created_at: string
  cancelled_at: string | null
  cancellation_reason: string | null
}

export interface ReportingCar {
  id: string
  vehicle_type: string
  category: string
  make: string
  model: string
  created_at: string
  is_active: boolean
}

export interface ReportingAddonAttach {
  booking_id: string
}

const RENTED_STATUSES = ['active', 'completed']

/**
 * Net revenue in the period: total_amount minus whatever was refunded.
 * Uses `created_at` to place a booking in the period — the day the sale
 * happened, not the rental dates. A booking made in March for an August
 * rental counts as March revenue, which matches how the admin dashboard's
 * "Revenue This Month" already works.
 */
export function netRevenue(bookings: ReportingBooking[]): number {
  return bookings.reduce((sum, b) => {
    const gross = Number(b.total_amount || 0)
    const refunded = Number(b.refunded_amount || 0)
    return sum + Math.max(0, gross - refunded)
  }, 0)
}

/**
 * Utilization = rented days ÷ available days, restricted to `vehicle_type
 * === 'car'`. Bicycles and motorbikes can rent by the hour
 * (`price_lists.rate_unit`), and averaging an hourly rental into a
 * days-based figure would distort it — they get their own count, not a
 * blended utilization number.
 *
 * Rented days only count `active`/`completed` bookings, clamped to the
 * reporting period (a booking that starts before the period or ends after
 * it only contributes its overlapping days). `confirmed`/`pending`
 * bookings are excluded deliberately — those are booked, not yet rented.
 *
 * Available days = (days in period) × (cars active for the whole period),
 * clamped by each car's `created_at` so a car added mid-period isn't
 * treated as available before it existed.
 */
export function utilization(
  bookings: ReportingBooking[],
  cars: ReportingCar[],
  periodStart: string,
  periodEnd: string
): { rentedDays: number; availableDays: number; rate: number } {
  const fleetCars = cars.filter(c => c.vehicle_type === 'car')

  let availableDays = 0
  for (const car of fleetCars) {
    const carStart = maxDate(periodStart, car.created_at.slice(0, 10))
    availableDays += daysBetween(carStart, periodEnd)
  }

  const carIds = new Set(fleetCars.map(c => c.id))
  let rentedDays = 0
  for (const b of bookings) {
    if (!RENTED_STATUSES.includes(b.status)) continue
    if (!carIds.has(b.car_id)) continue
    if (!rangesOverlap(b.pickup_date, b.dropoff_date, periodStart, periodEnd)) continue

    const overlapStart = maxDate(b.pickup_date, periodStart)
    const overlapEnd = minDate(b.dropoff_date, periodEnd)
    rentedDays += daysBetween(overlapStart, overlapEnd)
  }

  return {
    rentedDays,
    availableDays,
    rate: availableDays > 0 ? rentedDays / availableDays : 0,
  }
}

/**
 * RevPAV — revenue per available vehicle day. Net revenue (see netRevenue)
 * from car bookings only, divided by the same available-days denominator
 * as utilization, so the two figures are always consistent with each other.
 */
export function revPAV(
  bookings: ReportingBooking[],
  cars: ReportingCar[],
  periodStart: string,
  periodEnd: string
): number {
  const carIds = new Set(cars.filter(c => c.vehicle_type === 'car').map(c => c.id))
  const carBookings = bookings.filter(b => carIds.has(b.car_id))
  const { availableDays } = utilization(bookings, cars, periodStart, periodEnd)
  if (availableDays === 0) return 0
  return netRevenue(carBookings) / availableDays
}

/**
 * Achieved ADR — the average daily_rate_snapshot actually charged, across
 * rented bookings. Deliberately not compared against list price: a car can
 * have more than one active price list (seasonal vs standard), and
 * averaging them would be arbitrary. Achieved ADR alone is accurate and
 * still useful — a falling ADR month over month means discounting, even
 * without a baseline to compare it to.
 */
export function achievedADR(bookings: ReportingBooking[]): number {
  const rented = bookings.filter(b => RENTED_STATUSES.includes(b.status) && b.daily_rate_snapshot != null)
  if (rented.length === 0) return 0
  const sum = rented.reduce((s, b) => s + Number(b.daily_rate_snapshot), 0)
  return sum / rented.length
}

/** Average rental length in days, across rented bookings. */
export function averageRentalLength(bookings: ReportingBooking[]): number {
  const rented = bookings.filter(b => RENTED_STATUSES.includes(b.status))
  if (rented.length === 0) return 0
  return rented.reduce((s, b) => s + b.total_days, 0) / rented.length
}

/**
 * Cancellation rate, customer-initiated only. Bookings cancelled by the
 * hold-expiry sweep (cancellation_reason = 'Hold expired before
 * confirmation') are abandoned carts, not customer cancellations — lumping
 * them in would make the rate meaningless on any site with real traffic,
 * since most abandonment isn't a cancellation decision at all.
 */
export function cancellationRate(bookings: ReportingBooking[]): {
  customerCancelled: number
  expiredHolds: number
  total: number
  rate: number
} {
  const cancelled = bookings.filter(b => b.status === 'cancelled')
  const expiredHolds = cancelled.filter(b => b.cancellation_reason === 'Hold expired before confirmation').length
  const customerCancelled = cancelled.length - expiredHolds

  return {
    customerCancelled,
    expiredHolds,
    total: bookings.length,
    rate: bookings.length > 0 ? customerCancelled / bookings.length : 0,
  }
}

/** Share of bookings with at least one addon attached. */
export function addonAttachRate(bookings: ReportingBooking[], addonBookingIds: Set<string>): number {
  if (bookings.length === 0) return 0
  const withAddon = bookings.filter(b => addonBookingIds.has(b.id)).length
  return withAddon / bookings.length
}

/** Net revenue and rented-booking count grouped by month, oldest first. */
export function revenueByMonth(
  bookings: ReportingBooking[]
): { month: string; revenue: number; bookings: number }[] {
  const map = new Map<string, { revenue: number; bookings: number }>()

  for (const b of bookings) {
    const month = b.created_at.slice(0, 7) // YYYY-MM
    const entry = map.get(month) || { revenue: 0, bookings: 0 }
    entry.revenue += Math.max(0, Number(b.total_amount || 0) - Number(b.refunded_amount || 0))
    entry.bookings += 1
    map.set(month, entry)
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({ month, ...v }))
}

/** Net revenue and rented-day count grouped by car category. */
export function utilizationByCategory(
  bookings: ReportingBooking[],
  cars: ReportingCar[],
  periodStart: string,
  periodEnd: string
): { category: string; rentedDays: number; availableDays: number; rate: number }[] {
  const categories = Array.from(new Set(cars.filter(c => c.vehicle_type === 'car').map(c => c.category)))

  return categories.map(category => {
    const catCars = cars.filter(c => c.vehicle_type === 'car' && c.category === category)
    const result = utilization(bookings, catCars, periodStart, periodEnd)
    return { category, ...result }
  })
}

function daysBetween(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime()
  return Math.max(0, Math.round(ms / 86_400_000))
}

function maxDate(a: string, b: string): string {
  return a > b ? a : b
}

function minDate(a: string, b: string): string {
  return a < b ? a : b
}
