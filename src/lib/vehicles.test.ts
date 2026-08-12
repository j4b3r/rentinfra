import { describe, it, expect } from 'vitest'
import { categoryLabel, placeholderFor, specsFor, needsDriverDetails, VEHICLE_PLACEHOLDER } from './vehicles'
import type { Car } from '@/types'

function makeCar(overrides: Partial<Car> = {}): Car {
  return {
    id: 'car-1',
    slug: 'test-car',
    make: 'Test',
    model: 'Model',
    year: 2026,
    vehicle_type: 'car',
    category: 'economy',
    transmission: 'auto',
    fuel_type: 'petrol',
    seats: 5,
    doors: 4,
    luggage_small: 2,
    luggage_large: 1,
    engine_cc: null,
    frame_size: null,
    gears: null,
    helmet_included: false,
    requires_license: true,
    min_rider_age: null,
    ac: true,
    bluetooth: true,
    gps_builtin: false,
    license_plate: null,
    home_location_id: null,
    ev_range_km: null,
    ev_charging_connector: null,
    ev_charging_time_hours: null,
    description_en: null,
    description_es: null,
    is_available: true,
    is_active: true,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    ...overrides,
  }
}

describe('categoryLabel', () => {
  it('returns the label for a known category', () => {
    expect(categoryLabel('car', 'suv')).toBe('SUV')
  })

  it('falls back to the raw category string for an unknown category', () => {
    expect(categoryLabel('car', 'spaceship')).toBe('spaceship')
  })
})

describe('placeholderFor', () => {
  it('returns the mapped URL for a known category', () => {
    expect(placeholderFor({ vehicle_type: 'motorbike', category: 'scooter' })).toBe(VEHICLE_PLACEHOLDER.scooter)
  })

  it('falls back to the economy placeholder for an unknown category', () => {
    // Deliberately outside the VehicleCategory union — exercises the runtime
    // fallback for a value that could arrive from the DB without a matching
    // TS-level guarantee (e.g. after a schema/enum change).
    expect(placeholderFor({ vehicle_type: 'car', category: 'spaceship' as Car['category'] })).toBe(VEHICLE_PLACEHOLDER.economy)
  })
})

describe('needsDriverDetails', () => {
  it('is true when requires_license is true', () => {
    expect(needsDriverDetails({ requires_license: true })).toBe(true)
  })

  it('is true when requires_license is undefined (defaults to needing details)', () => {
    expect(needsDriverDetails({ requires_license: undefined as unknown as boolean })).toBe(true)
  })

  it('is false only when requires_license is explicitly false', () => {
    expect(needsDriverDetails({ requires_license: false })).toBe(false)
  })
})

describe('specsFor', () => {
  it('returns car specs: seats, doors, transmission, fuel, luggage', () => {
    const car = makeCar({ seats: 5, doors: 4, transmission: 'auto', fuel_type: 'petrol', luggage_small: 2, luggage_large: 1 })
    const labels = specsFor(car).map(s => s.label)
    expect(labels).toContain('5 seats')
    expect(labels).toContain('4 doors')
    expect(labels).toContain('Automatic')
    expect(labels).toContain('Petrol')
    expect(labels).toContain('3 bags')
  })

  it('returns an empty spec list for a car with nothing set', () => {
    const car = makeCar({
      seats: 0, doors: 0, transmission: null, fuel_type: 'none', luggage_small: 0, luggage_large: 0,
    })
    expect(specsFor(car)).toEqual([])
  })

  it('appends EV specs for an electric car', () => {
    const car = makeCar({
      fuel_type: 'electric',
      ev_range_km: 350,
      ev_charging_connector: 'CCS',
      ev_charging_time_hours: 0.5,
    })
    const labels = specsFor(car).map(s => s.label)
    expect(labels).toContain('350 km range')
    expect(labels).toContain('CCS')
    expect(labels).toContain('0.5h charge')
  })

  it('returns motorbike specs with twist-and-go transmission label and rider count', () => {
    const bike = makeCar({
      vehicle_type: 'motorbike', category: 'scooter', engine_cc: 125, transmission: 'auto', seats: 2, helmet_included: true,
    })
    const labels = specsFor(bike).map(s => s.label)
    expect(labels).toContain('125cc')
    expect(labels).toContain('Twist-and-go')
    expect(labels).toContain('2 riders')
    expect(labels).toContain('Helmet included')
  })

  it('shows "1 rider" for a motorbike with a single seat', () => {
    const bike = makeCar({ vehicle_type: 'motorbike', category: 'motorcycle', seats: 1, transmission: 'manual' })
    const labels = specsFor(bike).map(s => s.label)
    expect(labels).toContain('1 rider')
    expect(labels).toContain('Manual')
  })

  it('appends EV specs for an electric motorbike', () => {
    const bike = makeCar({
      vehicle_type: 'motorbike', category: 'scooter', fuel_type: 'electric', ev_range_km: 80,
    })
    const labels = specsFor(bike).map(s => s.label)
    expect(labels).toContain('80 km range')
  })

  it('returns bicycle specs with frame size and gears', () => {
    const bike = makeCar({
      vehicle_type: 'bicycle', category: 'mountain', frame_size: 'M', gears: 21, helmet_included: true, fuel_type: 'none',
    })
    const labels = specsFor(bike).map(s => s.label)
    expect(labels).toContain('Frame M')
    expect(labels).toContain('21 gears')
    expect(labels).toContain('Helmet included')
  })

  it('shows "Pedal assist" (not range/connector/charge-time) for an electric bicycle', () => {
    // Bicycles get a single distinct spec for electric, not the evSpecs()
    // block used by cars/motorbikes — a real branch difference to lock in.
    const ebike = makeCar({
      vehicle_type: 'bicycle', category: 'electric', fuel_type: 'electric', ev_range_km: 60,
    })
    const labels = specsFor(ebike).map(s => s.label)
    expect(labels).toContain('Pedal assist')
    expect(labels).not.toContain('60 km range')
  })
})
