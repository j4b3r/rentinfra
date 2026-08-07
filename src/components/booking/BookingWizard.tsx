'use client'

import { useState } from 'react'
import { Car, Addon, Location } from '@/types'
import StepDates from './StepDates'
import StepExtras from './StepExtras'
import StepDetails from './StepDetails'
import StepReview from './StepReview'
import BookingConfirmation from './BookingConfirmation'
import { calculateDays, getActivePriceList, calculateBookingPrice } from '@/lib/pricing'

interface BookingWizardProps {
  car: Car
  addons: Addon[]
  locations: Location[]
  settings: Record<string, string>
  userId?: string
  userEmail?: string
  /** Prefilled from the homepage search panel via ?pickup=&dropoff=&location= */
  initialPickupDate?: string
  initialDropoffDate?: string
  initialLocationId?: string
}

export type WizardData = {
  pickupDate: string
  pickupTime: string
  dropoffDate: string
  dropoffTime: string
  pickupLocationId: string
  dropoffLocationId: string
  hotelName: string
  hotelAddress: string
  selectedAddons: { addon: Addon; quantity: number }[]
  guestName: string
  guestEmail: string
  guestPhone: string
  guestLicense: string
  guestNiePassport: string
  guestAddress: string
  guestAddressSpain: string
  driverAge: string
}

const STEPS = ['Dates & Location', 'Extras', 'Your Details', 'Review']

const tomorrow = new Date()
tomorrow.setDate(tomorrow.getDate() + 1)
const dayAfter = new Date()
dayAfter.setDate(dayAfter.getDate() + 3)

const fmt = (d: Date) => d.toISOString().split('T')[0]

const initialData: WizardData = {
  pickupDate: fmt(tomorrow),
  pickupTime: '09:00',
  dropoffDate: fmt(dayAfter),
  dropoffTime: '09:00',
  pickupLocationId: '',
  dropoffLocationId: '',
  hotelName: '',
  hotelAddress: '',
  selectedAddons: [],
  guestName: '',
  guestEmail: '',
  guestPhone: '',
  guestLicense: '',
  guestNiePassport: '',
  guestAddress: '',
  guestAddressSpain: '',
  driverAge: '',
}

export default function BookingWizard({
  car, addons, locations, settings, userId, userEmail,
  initialPickupDate, initialDropoffDate, initialLocationId,
}: BookingWizardProps) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<WizardData>({
    ...initialData,
    guestEmail: userEmail || '',
    // Carry over whatever the visitor already chose on the homepage search
    ...(initialPickupDate ? { pickupDate: initialPickupDate } : {}),
    ...(initialDropoffDate ? { dropoffDate: initialDropoffDate } : {}),
    // Preselect the location chosen in the homepage search, otherwise fall back
    // to the first one so step 1 does not start in a blocked state.
    ...(() => {
      const id = initialLocationId || locations[0]?.id
      return id ? { pickupLocationId: id, dropoffLocationId: id } : {}
    })(),
  })
  const [bookingRef, setBookingRef] = useState<string | null>(null)
  const [payment, setPayment] = useState<{ enabled: boolean; amountDue: number | null; isPartial: boolean }>({
    enabled: false, amountDue: null, isPartial: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function update(partial: Partial<WizardData>) {
    setData(prev => ({ ...prev, ...partial }))
  }

  const totalDays = calculateDays(data.pickupDate, data.dropoffDate)
  const priceList = getActivePriceList(car.price_lists || [], data.pickupDate)
  const pickupLoc = locations.find(l => l.id === data.pickupLocationId) || null
  const dropoffLoc = locations.find(l => l.id === data.dropoffLocationId) || null
  // A bicycle has no licence requirement, so the young-driver surcharge must
  // not apply: passing null age keeps it out of the price calculation.
  const driverAge =
    car.requires_license === false ? null : data.driverAge ? parseInt(data.driverAge) : null

  const pricing = priceList
    ? calculateBookingPrice(priceList, totalDays, data.selectedAddons, pickupLoc, dropoffLoc, driverAge, settings)
    : null

  async function submitBooking() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carId: car.id,
          userId: userId || null,
          ...data,
          totalDays,
          pricing,
          priceListId: priceList?.id,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        // Someone else took the car while this booking was being filled in.
        // Say when it frees up rather than just refusing.
        if (res.status === 409) {
          const freeFrom = json.nextAvailableDate
            ? ` It is free again from ${new Date(json.nextAvailableDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}.`
            : ''
          throw new Error(
            `This car was booked for your dates while you were filling in the form.${freeFrom} Please choose different dates or another car.`
          )
        }
        throw new Error(json.error || 'Failed to create booking')
      }
      setBookingRef(json.reference)
      if (json.payment) setPayment(json.payment)
      setStep(4)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  if (step === 4 && bookingRef) {
    return (
      <BookingConfirmation
        reference={bookingRef}
        email={data.guestEmail}
        paymentsEnabled={payment.enabled}
        amountDue={payment.amountDue}
        isPartialPayment={payment.isPartial}
      />
    )
  }

  return (
    <div>
      {/* Car header */}
      <div className="bg-white rounded-xl p-4 mb-6 flex items-center gap-4 shadow-sm">
        <div className="flex-1">
          <p className="text-xs text-gray-400 uppercase tracking-wide">{car.category}</p>
          <h2 className="font-bold text-[#0A1F44] text-lg">{car.make} {car.model}</h2>
        </div>
        {priceList && pricing && (
          <div className="text-right">
            <div className="text-2xl font-bold text-[#0A1F44]">€{pricing.total.toFixed(2)}</div>
            <div className="text-xs text-gray-400">{totalDays} day{totalDays !== 1 ? 's' : ''}</div>
          </div>
        )}
      </div>

      {/* Step indicator */}
      <div className="flex items-center mb-6">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
              i < step ? 'bg-green-500 text-white' : i === step ? 'bg-[#0A1F44] text-white' : 'bg-gray-200 text-gray-400'
            }`}>
              {i < step ? '✓' : i + 1}
            </div>
            <div className={`hidden sm:block ml-2 text-xs font-medium ${i === step ? 'text-[#0A1F44]' : 'text-gray-400'}`}>
              {label}
            </div>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${i < step ? 'bg-green-500' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        {step === 0 && (
          <StepDates data={data} update={update} locations={locations} onNext={() => setStep(1)} />
        )}
        {step === 1 && (
          <StepExtras
            data={data} update={update} addons={addons}
            totalDays={totalDays}
            onBack={() => setStep(0)} onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <StepDetails
            data={data} update={update} userId={userId}
            settings={settings}
            requiresLicense={car.requires_license !== false}
            minRiderAge={car.min_rider_age}
            onBack={() => setStep(1)} onNext={() => setStep(3)}
          />
        )}
        {step === 3 && pricing && (
          <StepReview
            data={data} car={car} pricing={pricing} locations={locations} addons={addons}
            totalDays={totalDays} loading={loading} error={error}
            onBack={() => setStep(2)} onSubmit={submitBooking}
          />
        )}
      </div>
    </div>
  )
}
