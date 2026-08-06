'use client'

import { Location } from '@/types'
import { WizardData } from './BookingWizard'
import { MapPin } from 'lucide-react'

interface Props {
  data: WizardData
  update: (p: Partial<WizardData>) => void
  locations: Location[]
  onNext: () => void
}

export default function StepDates({ data, update, locations, onNext }: Props) {
  const today = new Date().toISOString().split('T')[0]

  const pickupLoc = locations.find(l => l.id === data.pickupLocationId)
  const showHotelFields =
    pickupLoc?.type === 'hotel_delivery' ||
    locations.find(l => l.id === data.dropoffLocationId)?.type === 'hotel_delivery'

  // Spell out what is missing so the button is never dead without a reason.
  const problems: string[] = []
  if (!data.pickupDate || !data.dropoffDate) problems.push('Choose both a pickup and a return date')
  else if (data.pickupDate >= data.dropoffDate) problems.push('The return date must be after the pickup date')
  if (!data.pickupLocationId) problems.push('Choose a pickup location')
  if (!data.dropoffLocationId) problems.push('Choose a return location')

  const isValid = problems.length === 0

  return (
    <div className="space-y-5">
      <h3 className="font-bold text-[#0A1F44] text-lg">Select Dates & Location</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date</label>
          <input type="date" min={today}
            value={data.pickupDate}
            onChange={e => update({ pickupDate: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1F44]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Time</label>
          <input type="time"
            value={data.pickupTime}
            onChange={e => update({ pickupTime: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1F44]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Return Date</label>
          <input type="date" min={data.pickupDate || today}
            value={data.dropoffDate}
            onChange={e => update({ dropoffDate: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1F44]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Return Time</label>
          <input type="time"
            value={data.dropoffTime}
            onChange={e => update({ dropoffTime: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1F44]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <MapPin size={13} className="inline mr-1" />Pickup Location
          </label>
          <select
            value={data.pickupLocationId}
            onChange={e => update({ pickupLocationId: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1F44]"
          >
            <option value="">Select location...</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>
                {loc.name_en} {loc.extra_fee > 0 ? `(+€${loc.extra_fee})` : '(Free)'}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <MapPin size={13} className="inline mr-1" />Return Location
          </label>
          <select
            value={data.dropoffLocationId}
            onChange={e => update({ dropoffLocationId: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1F44]"
          >
            <option value="">Select location...</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>
                {loc.name_en} {loc.extra_fee > 0 ? `(+€${loc.extra_fee})` : '(Free)'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showHotelFields && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hotel Name</label>
            <input type="text" placeholder="e.g. Hotel Puente Romano"
              value={data.hotelName}
              onChange={e => update({ hotelName: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1F44]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hotel Address</label>
            <input type="text" placeholder="Full address"
              value={data.hotelAddress}
              onChange={e => update({ hotelAddress: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1F44]"
            />
          </div>
        </div>
      )}

      {!isValid && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-medium text-amber-900">
            To continue, complete {problems.length} {problems.length === 1 ? 'field' : 'fields'}:
          </p>
          <ul className="mt-1 list-disc pl-5 text-sm text-amber-800">
            {problems.map(p => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={onNext}
        disabled={!isValid}
        className="w-full bg-[#0A1F44] text-white py-3 rounded-lg font-semibold hover:bg-[#C9A84C] hover:text-[#0A1F44] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Continue to Extras →
      </button>
    </div>
  )
}
