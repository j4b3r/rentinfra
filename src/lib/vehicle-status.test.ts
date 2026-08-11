import { describe, it, expect } from 'vitest'
import { deriveVehicleStatus } from './vehicle-status'

describe('deriveVehicleStatus', () => {
  it('returns off-fleet when inactive, regardless of other flags', () => {
    expect(
      deriveVehicleStatus({ isActive: false, hasActiveBooking: true, hasActiveMaintenance: true })
    ).toBe('off-fleet')
  })

  it('returns maintenance when active and both maintenance and a booking are present', () => {
    // Maintenance takes priority over an active booking — the interesting
    // precedence case per the file's own doc comment.
    expect(
      deriveVehicleStatus({ isActive: true, hasActiveBooking: true, hasActiveMaintenance: true })
    ).toBe('maintenance')
  })

  it('returns rented when active with a booking and no maintenance', () => {
    expect(
      deriveVehicleStatus({ isActive: true, hasActiveBooking: true, hasActiveMaintenance: false })
    ).toBe('rented')
  })

  it('returns available when active with neither a booking nor maintenance', () => {
    expect(
      deriveVehicleStatus({ isActive: true, hasActiveBooking: false, hasActiveMaintenance: false })
    ).toBe('available')
  })
})
