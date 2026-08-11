export type VehicleType = 'car' | 'motorbike' | 'bicycle'

/** Categories are validated per vehicle type by a DB constraint. */
export type CarCategory = 'economy' | 'suv' | 'luxury'
export type MotorbikeCategory = 'scooter' | 'motorcycle' | 'touring'
export type BicycleCategory = 'city' | 'mountain' | 'electric' | 'road'
export type VehicleCategory = CarCategory | MotorbikeCategory | BicycleCategory

export type Transmission = 'auto' | 'manual'
export type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'none'
export type BookingStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled'
export type PaymentStatus = 'unpaid' | 'deposit_paid' | 'paid' | 'refunded' | 'partial_refund'
export type PaymentMethod = 'stripe' | 'paypal' | 'cash' | 'bank_transfer'
export type BookingType = 'online' | 'offline'
export type PricingType = 'per_day' | 'flat'
export type LocationType = 'office' | 'airport' | 'hotel_delivery' | 'custom'
export type NotificationType = 'email' | 'whatsapp' | 'sms'
export type NotificationStatus = 'pending' | 'sent' | 'failed'

export interface Profile {
  id: string
  full_name: string | null
  phone: string | null
  nationality: string | null
  license_number: string | null
  preferred_language: string
  is_admin: boolean
  created_at: string
  updated_at: string
}

export interface Car {
  id: string
  slug: string
  make: string
  model: string
  year: number | null
  vehicle_type: VehicleType
  category: VehicleCategory
  /** Null on bicycles */
  transmission: Transmission | null
  fuel_type: FuelType | null
  seats: number
  doors: number
  luggage_small: number
  luggage_large: number
  /** Motorbikes: engine displacement in cc */
  engine_cc: number | null
  /** Bicycles: frame size, e.g. "M" or "54cm" */
  frame_size: string | null
  /** Bicycles: number of gears */
  gears: number | null
  helmet_included: boolean
  /** False for bicycles — no licence, age limit or young-driver fee */
  requires_license: boolean
  /** Overrides the global min_driver_age when set */
  min_rider_age: number | null
  ac: boolean
  bluetooth: boolean
  gps_builtin: boolean
  license_plate: string | null
  /** The branch this car is normally based at. NULL = available at every location. */
  home_location_id: string | null
  /** EV specs — only meaningful when fuel_type === 'electric' */
  ev_range_km: number | null
  ev_charging_connector: string | null
  ev_charging_time_hours: number | null
  description_en: string | null
  description_es: string | null
  is_available: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  car_images?: CarImage[]
  price_lists?: PriceList[]
}

export interface CarImage {
  id: string
  car_id: string
  url: string
  storage_path: string | null
  position: number
  is_primary: boolean
  created_at: string
}

export type RateUnit = 'day' | 'hour'

export interface PriceList {
  id: string
  car_id: string
  name: string
  daily_rate: number
  /** What daily_rate buys. 'hour' lists also set hourly_rate/min_hours. */
  rate_unit?: RateUnit
  hourly_rate?: number | null
  min_hours?: number | null
  season_start: string | null
  season_end: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  price_list_discounts?: PriceListDiscount[]
}

export interface PriceListDiscount {
  id: string
  price_list_id: string
  min_days: number
  max_days: number | null
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  label_en: string | null
  label_es: string | null
  created_at: string
}

export interface Addon {
  id: string
  /** Limits the addon to one vehicle type; null applies to all */
  vehicle_type?: VehicleType | null
  name_en: string
  name_es: string
  description_en: string | null
  description_es: string | null
  icon: string | null
  pricing_type: PricingType
  price: number
  is_global: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Location {
  id: string
  name_en: string
  name_es: string
  type: LocationType
  address: string | null
  extra_fee: number
  notes_en: string | null
  notes_es: string | null
  is_active: boolean
  created_at: string
}

export interface Booking {
  id: string
  reference: string
  booking_type: BookingType
  status: BookingStatus
  user_id: string | null
  guest_name: string | null
  guest_email: string | null
  guest_phone: string | null
  guest_license: string | null
  car_id: string
  pickup_date: string
  pickup_time: string
  dropoff_date: string
  dropoff_time: string
  total_days: number
  pickup_location_id: string | null
  dropoff_location_id: string | null
  hotel_name: string | null
  hotel_address: string | null
  daily_rate_snapshot: number | null
  discount_applied_pct: number
  addons_total: number
  location_fee: number
  young_driver_fee: number
  subtotal: number | null
  tax_amount: number
  total_amount: number | null
  payment_status: PaymentStatus
  payment_method: PaymentMethod | null
  stripe_payment_intent_id: string | null
  paypal_order_id: string | null
  deposit_amount: number
  deposit_paid_at: string | null
  driver_age: number | null
  guest_nie_passport: string | null
  guest_address: string | null
  guest_address_spain: string | null
  km_at_pickup: number | null
  km_at_return: number | null
  payment_method_deposit: string | null
  fuel_level_pickup: string | null
  fuel_level_return: string | null
  notes: string | null
  cancellation_reason: string | null
  cancelled_at: string | null
  confirmed_at: string | null
  created_at: string
  updated_at: string
  car?: Car
  pickup_location?: Location
  dropoff_location?: Location
  booking_addons?: BookingAddon[]
  profile?: Profile
}

export interface BookingAddon {
  id: string
  booking_id: string
  addon_id: string
  addon_name_snapshot: string
  pricing_type_snapshot: string
  price_snapshot: number
  quantity: number
  subtotal: number
  created_at: string
}

export interface Setting {
  key: string
  value: string
  type: 'string' | 'number' | 'boolean' | 'json'
  description: string | null
  /** Credentials — withheld from non-admins by RLS, never sent to the client */
  is_secret?: boolean
  updated_at: string
}

export interface BookingFormData {
  carId: string
  pickupDate: string
  pickupTime: string
  dropoffDate: string
  dropoffTime: string
  pickupLocationId: string
  dropoffLocationId: string
  hotelName?: string
  hotelAddress?: string
  selectedAddons: { addonId: string; quantity: number }[]
  guestName?: string
  guestEmail?: string
  guestPhone?: string
  guestLicense?: string
  driverAge?: number
  userId?: string
}

export interface PriceCalculation {
  dailyRate: number
  totalDays: number
  discountPct: number
  discountAmount: number
  addonsTotal: number
  locationFee: number
  youngDriverFee: number
  subtotal: number
  taxAmount: number
  total: number
}
