import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Availability rules, in one place.
 *
 * The fleet list, the car detail page and the booking API all need the same
 * answer to "is this car free?". When that logic was inlined in the API route
 * it drifted: an OR where an AND belonged meant a single booking made a car
 * unbookable forever. Everything overlap-related lives here now so the three
 * call sites cannot disagree again.
 */

/** Statuses that hold a car. Cancelled and completed rentals free it up. */
export const BLOCKING_STATUSES = ['pending', 'confirmed', 'active'] as const

export interface BookedRange {
  car_id: string
  pickup_date: string
  dropoff_date: string
}

/**
 * Two date ranges overlap when each starts before the other ends.
 *
 * The comparisons are strict, so a car returned on the 14th can be picked up
 * again on the 14th. Same-day turnaround is normal in rental — the handover
 * is sequenced by pickup/return times at the counter, not by blocking the day.
 */
export function rangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  return aStart < bEnd && aEnd > bStart
}

/**
 * Fetches every blocking booking that overlaps the requested window.
 * Pass a car id to check one car, or omit it to check the whole fleet at once
 * (one query for a fleet listing rather than one per card).
 */
export async function getConflictingBookings(
  supabase: SupabaseClient,
  pickupDate: string,
  dropoffDate: string,
  carId?: string
): Promise<BookedRange[]> {
  // Goes through get_car_availability() rather than selecting `bookings`
  // directly. RLS restricts that table to a user's own rows — correct, since
  // it holds guest names and phone numbers — which would make every car look
  // free to an anonymous visitor. The function is SECURITY DEFINER and returns
  // only car_id plus the occupied dates.
  const { data, error } = await supabase.rpc('get_car_availability', {
    start_date: pickupDate,
    end_date: dropoffDate,
  })

  if (error) {
    // Fail closed would block every booking; fail open matches the previous
    // behaviour and the DB exclusion constraint is the real backstop.
    console.error('[availability] get_car_availability failed:', error.message)
    return []
  }

  const rows = (data || []) as BookedRange[]
  return carId ? rows.filter(r => r.car_id === carId) : rows
}

/** True when the car has no blocking booking overlapping the window. */
export async function isCarAvailable(
  supabase: SupabaseClient,
  carId: string,
  pickupDate: string,
  dropoffDate: string
): Promise<boolean> {
  const conflicts = await getConflictingBookings(supabase, pickupDate, dropoffDate, carId)
  return conflicts.length === 0
}

/**
 * Set of car ids that are unavailable for the window — the shape the fleet
 * list wants, from a single round trip.
 */
export async function getUnavailableCarIds(
  supabase: SupabaseClient,
  pickupDate: string,
  dropoffDate: string
): Promise<Set<string>> {
  const conflicts = await getConflictingBookings(supabase, pickupDate, dropoffDate)
  return new Set(conflicts.map(c => c.car_id))
}

/**
 * The first date a car is free again, given the bookings that blocked it.
 *
 * Walks consecutive bookings so a car booked back-to-back reports the end of
 * the last run, not the end of the first booking. Returns null when nothing
 * blocks it.
 */
export function nextFreeDate(conflicts: BookedRange[]): string | null {
  if (conflicts.length === 0) return null

  const sorted = [...conflicts].sort((a, b) => a.pickup_date.localeCompare(b.pickup_date))
  let free = sorted[0].dropoff_date

  for (const booking of sorted.slice(1)) {
    // A gap means the car is free from the end of the previous run. Otherwise
    // the booking continues the run and pushes the free date out.
    if (booking.pickup_date > free) break
    if (booking.dropoff_date > free) free = booking.dropoff_date
  }

  return free
}

/**
 * Availability for every car in one window: which are taken, and when each
 * frees up. Used by the fleet listing to grey out cars with a useful date.
 */
export async function getFleetAvailability(
  supabase: SupabaseClient,
  pickupDate: string,
  dropoffDate: string
): Promise<Map<string, { available: false; nextFree: string | null }>> {
  const conflicts = await getConflictingBookings(supabase, pickupDate, dropoffDate)

  const byCar = new Map<string, BookedRange[]>()
  for (const c of conflicts) {
    const list = byCar.get(c.car_id) || []
    list.push(c)
    byCar.set(c.car_id, list)
  }

  const result = new Map<string, { available: false; nextFree: string | null }>()
  for (const [carId, ranges] of byCar) {
    result.set(carId, { available: false, nextFree: nextFreeDate(ranges) })
  }
  return result
}
