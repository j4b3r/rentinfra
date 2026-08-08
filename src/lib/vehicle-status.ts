/**
 * Vehicle status is derived, not stored. "Rented" and "maintenance" are both
 * just "does today fall inside a row for this car" — a stored status column
 * would let it drift from the bookings/blocks it's supposed to summarize the
 * first time someone edits a date. Only "off-fleet" is a genuine persistent
 * attribute, and cars.is_active already carries it.
 */

export type VehicleStatus = 'off-fleet' | 'maintenance' | 'rented' | 'available'

export interface StatusInputs {
  isActive: boolean
  /** True if a blocking booking (pending/confirmed/active) covers today. */
  hasActiveBooking: boolean
  /** True if a maintenance block covers today. */
  hasActiveMaintenance: boolean
}

export function deriveVehicleStatus({
  isActive,
  hasActiveBooking,
  hasActiveMaintenance,
}: StatusInputs): VehicleStatus {
  if (!isActive) return 'off-fleet'
  if (hasActiveMaintenance) return 'maintenance'
  if (hasActiveBooking) return 'rented'
  return 'available'
}

export const VEHICLE_STATUS_LABEL: Record<VehicleStatus, string> = {
  'off-fleet': 'Off-fleet',
  maintenance: 'Maintenance',
  rented: 'Rented',
  available: 'Available',
}

export const VEHICLE_STATUS_COLOR: Record<VehicleStatus, string> = {
  'off-fleet': 'bg-gray-100 text-gray-500',
  maintenance: 'bg-amber-100 text-amber-700',
  rented: 'bg-blue-100 text-blue-700',
  available: 'bg-emerald-100 text-emerald-700',
}
