import { PriceList, Addon, Location, PriceCalculation } from '@/types'
import { differenceInCalendarDays } from 'date-fns'

export function calculateDays(pickupDate: string, dropoffDate: string): number {
  const pickup = new Date(pickupDate)
  const dropoff = new Date(dropoffDate)
  const days = differenceInCalendarDays(dropoff, pickup)
  return days < 1 ? 1 : days
}

export function getActivePriceList(priceLists: PriceList[], pickupDate: string): PriceList | null {
  if (!priceLists || priceLists.length === 0) return null

  const pickup = new Date(pickupDate)

  // Find seasonal price list that matches the pickup date
  const seasonal = priceLists.find(pl => {
    if (!pl.is_active || !pl.season_start || !pl.season_end) return false
    const start = new Date(pl.season_start)
    const end = new Date(pl.season_end)
    return pickup >= start && pickup <= end
  })

  if (seasonal) return seasonal

  // Fall back to standard (no season dates)
  return priceLists.find(pl => pl.is_active && !pl.season_start) || priceLists[0]
}

export function getDiscountForDays(priceList: PriceList, days: number): { pct: number; label: string } {
  if (!priceList.price_list_discounts || priceList.price_list_discounts.length === 0) {
    return { pct: 0, label: '' }
  }

  const discount = priceList.price_list_discounts.find(d => {
    const aboveMin = days >= d.min_days
    const belowMax = d.max_days === null || days <= d.max_days
    return aboveMin && belowMax
  })

  if (!discount) return { pct: 0, label: '' }

  const pct = discount.discount_type === 'percentage' ? discount.discount_value : 0
  return { pct, label: discount.label_en || '' }
}

export function calculateBookingPrice(
  priceList: PriceList,
  days: number,
  selectedAddons: { addon: Addon; quantity: number }[],
  pickupLocation: Location | null,
  dropoffLocation: Location | null,
  driverAge: number | null,
  settings: Record<string, string>
): PriceCalculation {
  const dailyRate = priceList.daily_rate
  const { pct: discountPct } = getDiscountForDays(priceList, days)

  const baseTotal = dailyRate * days
  const discountAmount = (baseTotal * discountPct) / 100
  const discountedBase = baseTotal - discountAmount

  const addonsTotal = selectedAddons.reduce((sum, { addon, quantity }) => {
    const cost = addon.pricing_type === 'per_day' ? addon.price * days * quantity : addon.price * quantity
    return sum + cost
  }, 0)

  const locationFee = (pickupLocation?.extra_fee || 0) + (dropoffLocation?.extra_fee || 0)

  const minDriverAge = parseInt(settings.min_driver_age || '21')
  const youngDriverAge = 25
  const youngDriverSurcharge = parseFloat(settings.young_driver_surcharge_per_day || '10')
  const youngDriverFee =
    driverAge && driverAge >= minDriverAge && driverAge < youngDriverAge
      ? youngDriverSurcharge * days
      : 0

  const subtotal = discountedBase + addonsTotal + locationFee + youngDriverFee
  const taxRate = parseFloat(settings.tax_rate || '0') / 100
  const taxAmount = subtotal * taxRate
  const total = subtotal + taxAmount

  return {
    dailyRate,
    totalDays: days,
    discountPct,
    discountAmount,
    addonsTotal,
    locationFee,
    youngDriverFee,
    subtotal,
    taxAmount,
    total,
  }
}
