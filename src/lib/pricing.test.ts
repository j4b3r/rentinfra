import { describe, it, expect } from 'vitest'
import { calculateDays, getActivePriceList, getDiscountForDays, calculateBookingPrice } from './pricing'
import type { PriceList, PriceListDiscount, Addon, Location } from '@/types'

function makePriceList(overrides: Partial<PriceList> = {}): PriceList {
  return {
    id: 'pl-1',
    car_id: 'car-1',
    name: 'Standard',
    daily_rate: 50,
    season_start: null,
    season_end: null,
    is_active: true,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    ...overrides,
  }
}

function makeDiscount(overrides: Partial<PriceListDiscount> = {}): PriceListDiscount {
  return {
    id: 'd-1',
    price_list_id: 'pl-1',
    min_days: 3,
    max_days: null,
    discount_type: 'percentage',
    discount_value: 10,
    label_en: '3+ days',
    label_es: '3+ días',
    created_at: '2026-01-01',
    ...overrides,
  }
}

function makeAddon(overrides: Partial<Addon> = {}): Addon {
  return {
    id: 'addon-1',
    name_en: 'GPS',
    name_es: 'GPS',
    description_en: null,
    description_es: null,
    icon: null,
    pricing_type: 'flat',
    price: 10,
    is_global: true,
    is_active: true,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    ...overrides,
  }
}

function makeLocation(overrides: Partial<Location> = {}): Location {
  return {
    id: 'loc-1',
    name_en: 'Airport',
    name_es: 'Aeropuerto',
    type: 'airport',
    address: null,
    extra_fee: 15,
    notes_en: null,
    notes_es: null,
    is_active: true,
    created_at: '2026-01-01',
    ...overrides,
  }
}

describe('calculateDays', () => {
  it('returns the calendar day difference for a normal range', () => {
    expect(calculateDays('2026-06-01', '2026-06-05')).toBe(4)
  })

  it('floors to 1 for a same-day pickup/dropoff', () => {
    expect(calculateDays('2026-06-01', '2026-06-01')).toBe(1)
  })

  it('floors to 1 when dropoff is before pickup', () => {
    expect(calculateDays('2026-06-05', '2026-06-01')).toBe(1)
  })
})

describe('getActivePriceList', () => {
  it('returns null for an empty or missing list', () => {
    expect(getActivePriceList([], '2026-06-01')).toBeNull()
    expect(getActivePriceList(undefined as unknown as PriceList[], '2026-06-01')).toBeNull()
  })

  it('prefers an active seasonal list that contains the pickup date', () => {
    const standard = makePriceList({ id: 'standard', daily_rate: 50 })
    const seasonal = makePriceList({
      id: 'summer',
      daily_rate: 80,
      season_start: '2026-06-01',
      season_end: '2026-08-31',
    })
    const result = getActivePriceList([standard, seasonal], '2026-07-15')
    expect(result?.id).toBe('summer')
  })

  it('falls back to the active standard list when no season matches', () => {
    const standard = makePriceList({ id: 'standard' })
    const seasonal = makePriceList({
      id: 'summer',
      season_start: '2026-06-01',
      season_end: '2026-08-31',
    })
    const result = getActivePriceList([standard, seasonal], '2026-01-15')
    expect(result?.id).toBe('standard')
  })

  it('falls back to priceLists[0] even when it is inactive, if nothing else matches', () => {
    // Locks in current behavior: the final fallback is not gated on is_active.
    const inactiveFirst = makePriceList({ id: 'inactive', is_active: false })
    const result = getActivePriceList([inactiveFirst], '2026-01-15')
    expect(result?.id).toBe('inactive')
  })
})

describe('getDiscountForDays', () => {
  it('returns 0% with no discounts configured', () => {
    const pl = makePriceList({ price_list_discounts: [] })
    expect(getDiscountForDays(pl, 5)).toEqual({ pct: 0, label: '' })
  })

  it('matches a tier by inclusive min/max boundaries', () => {
    const pl = makePriceList({
      price_list_discounts: [makeDiscount({ min_days: 3, max_days: 6, discount_value: 10 })],
    })
    expect(getDiscountForDays(pl, 3).pct).toBe(10)
    expect(getDiscountForDays(pl, 6).pct).toBe(10)
    expect(getDiscountForDays(pl, 2).pct).toBe(0)
    expect(getDiscountForDays(pl, 7).pct).toBe(0)
  })

  it('matches an open-ended tier (max_days null) for any day count above min_days', () => {
    const pl = makePriceList({
      price_list_discounts: [makeDiscount({ min_days: 7, max_days: null, discount_value: 20 })],
    })
    expect(getDiscountForDays(pl, 30).pct).toBe(20)
  })

  it('KNOWN ISSUE: a matching discount_type "fixed" tier returns 0%, not its discount_value', () => {
    // getDiscountForDays only applies discount_value when discount_type is
    // 'percentage' — a 'fixed' tier matches the day-range check but its value
    // is silently dropped, so a fixed-amount discount configured in the admin
    // panel does nothing today. Documenting current behavior, not fixing it
    // here — see CLAUDE.md Testing section.
    const pl = makePriceList({
      price_list_discounts: [
        makeDiscount({ min_days: 3, max_days: null, discount_type: 'fixed', discount_value: 25, label_en: 'Fixed €25 off' }),
      ],
    })
    const result = getDiscountForDays(pl, 5)
    expect(result.pct).toBe(0)
    // The label still surfaces even though pct is wrongly 0 — confirms the
    // matched-tier path was taken, not the "no discount found" early return.
    expect(result.label).toBe('Fixed €25 off')
  })
})

describe('calculateBookingPrice', () => {
  const settings = { min_driver_age: '21', young_driver_surcharge_per_day: '10', tax_rate: '10' }

  it('computes the full breakdown with a percentage discount, addons and both location fees', () => {
    const pl = makePriceList({
      daily_rate: 100,
      price_list_discounts: [makeDiscount({ min_days: 3, max_days: null, discount_value: 10 })],
    })
    const perDayAddon = makeAddon({ id: 'gps', pricing_type: 'per_day', price: 5 })
    const flatAddon = makeAddon({ id: 'child-seat', pricing_type: 'flat', price: 20 })
    const pickup = makeLocation({ id: 'pickup', extra_fee: 15 })
    const dropoff = makeLocation({ id: 'dropoff', extra_fee: 25 })

    const result = calculateBookingPrice(
      pl,
      4,
      [{ addon: perDayAddon, quantity: 1 }, { addon: flatAddon, quantity: 2 }],
      pickup,
      dropoff,
      30,
      settings
    )

    expect(result.dailyRate).toBe(100)
    expect(result.totalDays).toBe(4)
    expect(result.discountPct).toBe(10)
    expect(result.discountAmount).toBe(40) // 10% of (100*4)
    expect(result.addonsTotal).toBe(60) // (5*4*1) + (20*2)
    expect(result.locationFee).toBe(40) // 15 + 25
    expect(result.youngDriverFee).toBe(0) // driver 30, not young
    expect(result.subtotal).toBe(360 + 60 + 40) // discountedBase 360 + addons 60 + fee 40
    expect(result.taxAmount).toBeCloseTo(46, 5) // 10% of subtotal
    expect(result.total).toBeCloseTo(506, 5)
  })

  it('is null-safe when both locations are null', () => {
    const pl = makePriceList({ daily_rate: 50 })
    const result = calculateBookingPrice(pl, 2, [], null, null, null, settings)
    expect(result.locationFee).toBe(0)
  })

  it('applies the young-driver fee when age is within [min_driver_age, 25)', () => {
    const pl = makePriceList({ daily_rate: 50, price_list_discounts: [] })
    const atMin = calculateBookingPrice(pl, 3, [], null, null, 21, settings)
    expect(atMin.youngDriverFee).toBe(30) // 10/day * 3 days

    const justBelowCutoff = calculateBookingPrice(pl, 3, [], null, null, 24, settings)
    expect(justBelowCutoff.youngDriverFee).toBe(30)
  })

  it('does not apply the young-driver fee exactly at the 25 boundary (strict <)', () => {
    const pl = makePriceList({ daily_rate: 50, price_list_discounts: [] })
    const atCutoff = calculateBookingPrice(pl, 3, [], null, null, 25, settings)
    expect(atCutoff.youngDriverFee).toBe(0)
  })

  it('does not apply the young-driver fee for driverAge null', () => {
    const pl = makePriceList({ daily_rate: 50, price_list_discounts: [] })
    const result = calculateBookingPrice(pl, 3, [], null, null, null, settings)
    expect(result.youngDriverFee).toBe(0)
  })

  it('KNOWN EDGE CASE: driverAge 0 is falsy and skips the young-driver fee', () => {
    // `driverAge &&  ...` short-circuits on 0, same as null/undefined, even
    // though 0 is numerically below min_driver_age and would otherwise not
    // match either — defensive in effect but worth locking in explicitly
    // since age 0 is not a realistic input in practice. Not fixed here.
    const pl = makePriceList({ daily_rate: 50, price_list_discounts: [] })
    const result = calculateBookingPrice(pl, 3, [], null, null, 0, settings)
    expect(result.youngDriverFee).toBe(0)
  })

  it('uses default settings values when the settings map is empty', () => {
    const pl = makePriceList({ daily_rate: 100, price_list_discounts: [] })
    const result = calculateBookingPrice(pl, 2, [], null, null, null, {})
    // tax_rate defaults to '0' -> no tax
    expect(result.taxAmount).toBe(0)
    expect(result.total).toBe(result.subtotal)
  })
})
