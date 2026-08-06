import type { Car, VehicleType } from '@/types'

/**
 * Per-type vehicle presentation and rules.
 *
 * A bicycle has no transmission, fuel type or doors; a motorbike has an engine
 * size but no boot. Keeping the differences here means the fleet grid, the car
 * page, the booking wizard and the admin form all describe a vehicle the same
 * way instead of each hardcoding "seats · doors · transmission".
 */

export const VEHICLE_TYPES: VehicleType[] = ['car', 'motorbike', 'bicycle']

export const VEHICLE_TYPE_LABEL: Record<VehicleType, string> = {
  car: 'Cars',
  motorbike: 'Motorbikes',
  bicycle: 'Bicycles',
}

/** Singular, for use in a sentence. */
export const VEHICLE_NOUN: Record<VehicleType, string> = {
  car: 'car',
  motorbike: 'motorbike',
  bicycle: 'bicycle',
}

export const CATEGORIES_BY_TYPE: Record<VehicleType, { value: string; label: string }[]> = {
  car: [
    { value: 'economy', label: 'Economy' },
    { value: 'suv', label: 'SUV' },
    { value: 'luxury', label: 'Luxury' },
  ],
  motorbike: [
    { value: 'scooter', label: 'Scooter' },
    { value: 'motorcycle', label: 'Motorcycle' },
    { value: 'touring', label: 'Touring' },
  ],
  bicycle: [
    { value: 'city', label: 'City' },
    { value: 'mountain', label: 'Mountain' },
    { value: 'electric', label: 'E-Bike' },
    { value: 'road', label: 'Road' },
  ],
}

export function categoryLabel(vehicleType: VehicleType, category: string): string {
  return (
    CATEGORIES_BY_TYPE[vehicleType]?.find(c => c.value === category)?.label ?? category
  )
}

/** Fallback images per type, used when a vehicle has no photo yet. */
export const VEHICLE_PLACEHOLDER: Record<string, string> = {
  // cars
  economy: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&q=80',
  suv: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80',
  luxury: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=800&q=80',
  // motorbikes
  scooter: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&q=80',
  motorcycle: 'https://images.unsplash.com/photo-1558981285-6f0c94958bb6?w=800&q=80',
  touring: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&q=80',
  // bicycles
  city: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&q=80',
  mountain: 'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=800&q=80',
  electric: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800&q=80',
  road: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&q=80',
}

export function placeholderFor(vehicle: Pick<Car, 'vehicle_type' | 'category'>): string {
  return VEHICLE_PLACEHOLDER[vehicle.category] || VEHICLE_PLACEHOLDER.economy
}

export interface SpecItem {
  /** lucide icon name resolved by the caller */
  icon: 'users' | 'door' | 'gauge' | 'fuel' | 'luggage' | 'settings' | 'bike' | 'zap'
  label: string
}

/**
 * The specs worth showing for this vehicle — only the ones that apply.
 * A bicycle returns frame size and gears, never "5 seats, automatic".
 */
export function specsFor(vehicle: Car): SpecItem[] {
  const specs: SpecItem[] = []

  if (vehicle.vehicle_type === 'car') {
    if (vehicle.seats) specs.push({ icon: 'users', label: `${vehicle.seats} seats` })
    if (vehicle.doors) specs.push({ icon: 'door', label: `${vehicle.doors} doors` })
    if (vehicle.transmission)
      specs.push({
        icon: 'settings',
        label: vehicle.transmission === 'auto' ? 'Automatic' : 'Manual',
      })
    if (vehicle.fuel_type && vehicle.fuel_type !== 'none')
      specs.push({ icon: 'fuel', label: capitalize(vehicle.fuel_type) })
    const bags = (vehicle.luggage_small ?? 0) + (vehicle.luggage_large ?? 0)
    if (bags) specs.push({ icon: 'luggage', label: `${bags} bags` })
    return specs
  }

  if (vehicle.vehicle_type === 'motorbike') {
    if (vehicle.engine_cc) specs.push({ icon: 'gauge', label: `${vehicle.engine_cc}cc` })
    if (vehicle.transmission)
      specs.push({
        icon: 'settings',
        label: vehicle.transmission === 'auto' ? 'Twist-and-go' : 'Manual',
      })
    if (vehicle.seats) specs.push({ icon: 'users', label: vehicle.seats > 1 ? '2 riders' : '1 rider' })
    if (vehicle.helmet_included) specs.push({ icon: 'bike', label: 'Helmet included' })
    return specs
  }

  // bicycle
  if (vehicle.frame_size) specs.push({ icon: 'bike', label: `Frame ${vehicle.frame_size}` })
  if (vehicle.gears) specs.push({ icon: 'settings', label: `${vehicle.gears} gears` })
  if (vehicle.fuel_type === 'electric') specs.push({ icon: 'zap', label: 'Pedal assist' })
  if (vehicle.helmet_included) specs.push({ icon: 'bike', label: 'Helmet included' })
  return specs
}

/** Bicycles need no licence, no minimum age and no young-driver surcharge. */
export function needsDriverDetails(vehicle: Pick<Car, 'requires_license'>): boolean {
  return vehicle.requires_license !== false
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
