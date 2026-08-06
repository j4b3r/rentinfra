'use client'

import { WizardData } from './BookingWizard'

interface Props {
  data: WizardData
  update: (p: Partial<WizardData>) => void
  userId?: string
  settings: Record<string, string>
  onBack: () => void
  onNext: () => void
}

export default function StepDetails({ data, update, userId, settings, onBack, onNext }: Props) {
  const minAge = parseInt(settings.min_driver_age || '21')

  // Name each problem so the form can say what it is waiting for, instead of
  // just presenting a dead button.
  const problems: { field: string; message: string }[] = []
  if (!data.guestName.trim()) problems.push({ field: 'name', message: 'Enter the full name' })
  if (!data.guestEmail.trim()) {
    problems.push({ field: 'email', message: 'Enter an email address' })
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.guestEmail.trim())) {
    problems.push({ field: 'email', message: 'Check the email address' })
  }
  if (!data.guestPhone.trim()) problems.push({ field: 'phone', message: 'Enter a phone number' })
  if (!data.driverAge) {
    problems.push({ field: 'age', message: 'Enter the driver age' })
  } else if (parseInt(data.driverAge) < minAge) {
    problems.push({ field: 'age', message: `The driver must be at least ${minAge}` })
  }

  const errorFor = (field: string) => problems.find(p => p.field === field)?.message
  const isValid = problems.length === 0

  const inputClass = (field: string) =>
    `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1F44] ${
      errorFor(field) ? 'border-red-300' : 'border-gray-200'
    }`

  return (
    <div className="space-y-5">
      <h3 className="font-bold text-[#0A1F44] text-lg">Your Details</h3>

      {userId && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-700">
          You're logged in. Fill in your details below.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
          <input type="text" placeholder="As on your driving license"
            value={data.guestName}
            onChange={e => update({ guestName: e.target.value })}
            className={inputClass('name')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
          <input type="email" placeholder="your@email.com"
            value={data.guestEmail}
            onChange={e => update({ guestEmail: e.target.value })}
            className={inputClass('email')}
          />
          {errorFor('email') && data.guestEmail.trim() && (
            <p className="text-xs text-red-600 mt-1">{errorFor('email')}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-red-500">*</span></label>
          <input type="tel" placeholder="+34..."
            value={data.guestPhone}
            onChange={e => update({ guestPhone: e.target.value })}
            className={inputClass('phone')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Driver License Number</label>
          <input type="text"
            value={data.guestLicense}
            onChange={e => update({ guestLicense: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1F44]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">NIE / Passport Number</label>
          <input type="text" placeholder="e.g. X1234567A"
            value={data.guestNiePassport}
            onChange={e => update({ guestNiePassport: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1F44]"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Permanent Home Address</label>
          <input type="text" placeholder="Street, city, country"
            value={data.guestAddress}
            onChange={e => update({ guestAddress: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1F44]"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Address in Spain <span className="text-gray-400 font-normal">(hotel, apartment…)</span></label>
          <input type="text" placeholder="Hotel name or address in Spain"
            value={data.guestAddressSpain}
            onChange={e => update({ guestAddressSpain: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1F44]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Driver Age <span className="text-red-500">*</span>{' '}
            <span className="text-gray-400 font-normal">(min {minAge})</span>
          </label>
          <input type="number" min={minAge} max={99} placeholder={`${minAge}+`}
            value={data.driverAge}
            onChange={e => update({ driverAge: e.target.value })}
            className={inputClass('age')}
          />
          {data.driverAge && parseInt(data.driverAge) < 25 && parseInt(data.driverAge) >= minAge && (
            <p className="text-xs text-amber-600 mt-1">Young driver surcharge applies (+€{settings.young_driver_surcharge_per_day}/day)</p>
          )}
          {data.driverAge && parseInt(data.driverAge) < minAge && (
            <p className="text-xs text-red-600 mt-1">Minimum driver age is {minAge}</p>
          )}
        </div>
      </div>

      {/* Say what is still needed rather than leaving a dead button. */}
      {!isValid && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-medium text-amber-900">
            To continue, complete {problems.length} {problems.length === 1 ? 'field' : 'fields'}:
          </p>
          <ul className="mt-1 list-disc pl-5 text-sm text-amber-800">
            {problems.map(p => (
              <li key={p.field}>{p.message}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button onClick={onBack} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-lg hover:bg-gray-50 transition-colors">
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={!isValid}
          className="flex-1 bg-[#0A1F44] text-white py-3 rounded-lg font-semibold hover:bg-[#C9A84C] hover:text-[#0A1F44] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Review Booking →
        </button>
      </div>
    </div>
  )
}
