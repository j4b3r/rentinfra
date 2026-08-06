'use client'

import { Car, Addon, Location } from '@/types'
import { PriceCalculation } from '@/types'
import { WizardData } from './BookingWizard'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Props {
  data: WizardData
  car: Car
  pricing: PriceCalculation
  locations: Location[]
  addons: Addon[]
  totalDays: number
  loading: boolean
  error: string | null
  onBack: () => void
  onSubmit: () => void
}

export default function StepReview({ data, car, pricing, locations, totalDays, loading, error, onBack, onSubmit }: Props) {
  const pickupLoc = locations.find(l => l.id === data.pickupLocationId)
  const dropoffLoc = locations.find(l => l.id === data.dropoffLocationId)

  return (
    <div className="space-y-5">
      <h3 className="font-bold text-[#0A1F44] text-lg">Review Your Booking</h3>

      {/* Car */}
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Vehicle</p>
        <p className="font-bold text-[#0A1F44]">{car.make} {car.model} {car.year || ''}</p>
        <p className="text-sm text-gray-500 capitalize">{car.category}</p>
      </div>

      {/* Dates & Locations */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">Pickup</p>
          <p className="font-semibold text-sm text-[#0A1F44]">{formatDate(data.pickupDate)}</p>
          <p className="text-xs text-gray-500">{data.pickupTime} • {pickupLoc?.name_en}</p>
          {data.hotelName && <p className="text-xs text-gray-400">{data.hotelName}</p>}
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">Return</p>
          <p className="font-semibold text-sm text-[#0A1F44]">{formatDate(data.dropoffDate)}</p>
          <p className="text-xs text-gray-500">{data.dropoffTime} • {dropoffLoc?.name_en}</p>
        </div>
      </div>

      {/* Driver */}
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Driver</p>
        <p className="font-semibold text-sm">{data.guestName}</p>
        <p className="text-xs text-gray-500">{data.guestEmail} • {data.guestPhone}</p>
        {data.guestLicense && <p className="text-xs text-gray-400">License: {data.guestLicense}</p>}
        <p className="text-xs text-gray-400">Age: {data.driverAge}</p>
      </div>

      {/* Price breakdown */}
      <div className="border border-gray-100 rounded-lg p-4 space-y-2">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Price Breakdown</p>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">{formatCurrency(pricing.dailyRate)}/day × {totalDays} day{totalDays !== 1 ? 's' : ''}</span>
          <span>{formatCurrency(pricing.dailyRate * totalDays)}</span>
        </div>
        {pricing.discountPct > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount ({pricing.discountPct}%)</span>
            <span>-{formatCurrency(pricing.discountAmount)}</span>
          </div>
        )}
        {pricing.addonsTotal > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Extras ({data.selectedAddons.length})</span>
            <span>{formatCurrency(pricing.addonsTotal)}</span>
          </div>
        )}
        {pricing.locationFee > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Location fee</span>
            <span>{formatCurrency(pricing.locationFee)}</span>
          </div>
        )}
        {pricing.youngDriverFee > 0 && (
          <div className="flex justify-between text-sm text-amber-600">
            <span>Young driver surcharge</span>
            <span>{formatCurrency(pricing.youngDriverFee)}</span>
          </div>
        )}
        {pricing.taxAmount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax</span>
            <span>{formatCurrency(pricing.taxAmount)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-[#0A1F44] text-lg pt-2 border-t border-gray-100">
          <span>Total</span>
          <span>{formatCurrency(pricing.total)}</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Payment note */}
      <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-sm text-amber-800">
        Payment will be collected at pickup. Your booking will be confirmed shortly.
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={onBack} disabled={loading} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-lg hover:bg-gray-50 transition-colors">
          ← Back
        </button>
        <button
          onClick={onSubmit}
          disabled={loading}
          className="flex-1 bg-[#C9A84C] text-[#0A1F44] py-3 rounded-lg font-bold hover:bg-yellow-400 transition-colors disabled:opacity-60"
        >
          {loading ? 'Confirming...' : 'Confirm Booking'}
        </button>
      </div>
    </div>
  )
}
