import type { SupabaseClient } from '@supabase/supabase-js'
import { getConflictingBookings, rangesOverlap } from '@/lib/availability'
import { getActivePriceList } from '@/lib/pricing'

/**
 * Per-car, per-day availability and rate — the feed a channel manager pulls
 * to know what it can sell and at what price.
 *
 * Goes through getConflictingBookings() (a single call over the whole
 * range, no carId filter), which is backed by get_car_availability() — the
 * same SECURITY DEFINER RPC the public fleet listing and booking API use.
 * That RPC already UNIONs maintenance_blocks with blocking bookings, so a
 * car in the workshop is correctly reported as unavailable here too,
 * without this module needing to know maintenance_blocks exists.
 */

export interface OtaDayAvailability {
  date: string
  available: boolean
  rate: number | null
}

export interface OtaCarAvailability {
  carId: string
  slug: string
  make: string
  model: string
  days: OtaDayAvailability[]
}

export async function getOtaAvailabilityFeed(
  supabase: SupabaseClient,
  startDate: string,
  endDate: string
): Promise<OtaCarAvailability[]> {
  const { data: cars } = await supabase
    .from('cars')
    .select('id, slug, make, model, price_lists(*)')
    .eq('is_active', true)

  if (!cars || cars.length === 0) return []

  // One call for the whole fleet over the whole range — the same shape the
  // public fleet listing uses for a single date pair, just wider.
  const conflicts = await getConflictingBookings(supabase, startDate, endDate)
  const conflictsByCarId = new Map<string, { pickup_date: string; dropoff_date: string }[]>()
  for (const c of conflicts) {
    const list = conflictsByCarId.get(c.car_id) || []
    list.push(c)
    conflictsByCarId.set(c.car_id, list)
  }

  const dates = enumerateDates(startDate, endDate)

  return cars.map(car => {
    const carConflicts = conflictsByCarId.get(car.id) || []
    const priceLists = car.price_lists || []

    const days: OtaDayAvailability[] = dates.map(date => {
      const nextDay = addDays(date, 1)
      const occupied = carConflicts.some(c => rangesOverlap(date, nextDay, c.pickup_date, c.dropoff_date))
      const priceList = getActivePriceList(priceLists, date)

      return {
        date,
        available: !occupied,
        rate: priceList?.daily_rate ?? null,
      }
    })

    return { carId: car.id, slug: car.slug, make: car.make, model: car.model, days }
  })
}

function enumerateDates(start: string, end: string): string[] {
  const dates: string[] = []
  let current = start
  // Cap at 366 days so a malformed range can't produce an unbounded loop.
  for (let i = 0; i < 366 && current < end; i++) {
    dates.push(current)
    current = addDays(current, 1)
  }
  return dates
}

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}
