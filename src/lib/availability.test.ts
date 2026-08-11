import { describe, it, expect } from 'vitest'
import { rangesOverlap, nextFreeDate, type BookedRange } from './availability'

describe('rangesOverlap', () => {
  // This is the function whose inverted logic (OR where an AND belonged)
  // caused a real production bug: a single booking made a car unbookable on
  // every future date. See the file's own header comment.

  it('returns true for fully overlapping ranges', () => {
    expect(rangesOverlap('2026-06-01', '2026-06-10', '2026-06-05', '2026-06-15')).toBe(true)
  })

  it('returns false for fully disjoint ranges', () => {
    expect(rangesOverlap('2026-06-01', '2026-06-05', '2026-06-10', '2026-06-15')).toBe(false)
  })

  it('treats same-day turnaround as NOT overlapping (A ends when B starts)', () => {
    expect(rangesOverlap('2026-06-01', '2026-06-10', '2026-06-10', '2026-06-15')).toBe(false)
  })

  it('treats same-day turnaround as NOT overlapping (B ends when A starts)', () => {
    expect(rangesOverlap('2026-06-10', '2026-06-15', '2026-06-01', '2026-06-10')).toBe(false)
  })

  it('returns true when one range fully contains the other', () => {
    expect(rangesOverlap('2026-06-01', '2026-06-30', '2026-06-10', '2026-06-15')).toBe(true)
  })

  it('returns true for identical ranges', () => {
    expect(rangesOverlap('2026-06-01', '2026-06-10', '2026-06-01', '2026-06-10')).toBe(true)
  })

  it('is symmetric regardless of argument order', () => {
    const a = rangesOverlap('2026-06-01', '2026-06-10', '2026-06-05', '2026-06-15')
    const b = rangesOverlap('2026-06-05', '2026-06-15', '2026-06-01', '2026-06-10')
    expect(a).toBe(b)
  })
})

describe('nextFreeDate', () => {
  it('returns null for an empty conflicts list', () => {
    expect(nextFreeDate([])).toBeNull()
  })

  it('returns the dropoff date for a single booking', () => {
    const conflicts: BookedRange[] = [{ car_id: 'c1', pickup_date: '2026-06-01', dropoff_date: '2026-06-05' }]
    expect(nextFreeDate(conflicts)).toBe('2026-06-05')
  })

  it('walks back-to-back bookings and returns the end of the last run', () => {
    const conflicts: BookedRange[] = [
      { car_id: 'c1', pickup_date: '2026-06-01', dropoff_date: '2026-06-05' },
      { car_id: 'c1', pickup_date: '2026-06-05', dropoff_date: '2026-06-10' },
    ]
    expect(nextFreeDate(conflicts)).toBe('2026-06-10')
  })

  it('stops at the first gap and returns the free date before it', () => {
    const conflicts: BookedRange[] = [
      { car_id: 'c1', pickup_date: '2026-06-01', dropoff_date: '2026-06-05' },
      { car_id: 'c1', pickup_date: '2026-06-12', dropoff_date: '2026-06-20' },
    ]
    // The second booking starts after the first run's free date (a gap), so
    // the car is free starting right after the first booking ends.
    expect(nextFreeDate(conflicts)).toBe('2026-06-05')
  })

  it('produces the same result regardless of input order (sorts internally)', () => {
    const sorted: BookedRange[] = [
      { car_id: 'c1', pickup_date: '2026-06-01', dropoff_date: '2026-06-05' },
      { car_id: 'c1', pickup_date: '2026-06-05', dropoff_date: '2026-06-10' },
    ]
    const reversed = [...sorted].reverse()
    expect(nextFreeDate(reversed)).toBe(nextFreeDate(sorted))
  })
})
