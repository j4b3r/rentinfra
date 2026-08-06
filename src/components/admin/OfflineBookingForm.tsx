'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Car, Location, Addon } from '@/types'
import { ArrowLeft, Plus, Trash2, Save, Loader2, AlertCircle, FileText } from 'lucide-react'
import { calculateDays, getActivePriceList, calculateBookingPrice } from '@/lib/pricing'

type CarWithPriceLists = Car & {
  price_lists: { id: string; name: string; daily_rate: number; is_active: boolean; season_start: string | null }[]
}

interface Props {
  cars: CarWithPriceLists[]
  locations: Location[]
  addons: Addon[]
  settings: Record<string, string>
}

interface SelectedAddon { addon: Addon; quantity: number }

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40 focus:border-[#C9A84C]"
const labelCls = "block text-xs font-semibold text-gray-600 mb-1"
const selectCls = inputCls

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
      <h2 className="font-bold text-[#0A1F44] mb-4 text-sm uppercase tracking-wide">{title}</h2>
      {children}
    </div>
  )
}

export default function OfflineBookingForm({ cars, locations, addons, settings }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [createdId, setCreatedId] = useState<string | null>(null)
  const [createdRef, setCreatedRef] = useState<string | null>(null)

  // Car
  const [carId, setCarId] = useState('')
  // Dates
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1)
  const dayAfter = new Date(); dayAfter.setDate(dayAfter.getDate() + 3)
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  const [pickupDate, setPickupDate] = useState(fmt(tomorrow))
  const [pickupTime, setPickupTime] = useState('09:00')
  const [dropoffDate, setDropoffDate] = useState(fmt(dayAfter))
  const [dropoffTime, setDropoffTime] = useState('09:00')
  // Locations
  const [pickupLocationId, setPickupLocationId] = useState('')
  const [dropoffLocationId, setDropoffLocationId] = useState('')
  const [hotelName, setHotelName] = useState('')
  const [hotelAddress, setHotelAddress] = useState('')
  // Guest
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestLicense, setGuestLicense] = useState('')
  const [guestNiePassport, setGuestNiePassport] = useState('')
  const [guestAddress, setGuestAddress] = useState('')
  const [guestAddressSpain, setGuestAddressSpain] = useState('')
  const [driverAge, setDriverAge] = useState('')
  // Extras
  const [selectedAddons, setSelectedAddons] = useState<SelectedAddon[]>([])
  // Contract / operational
  const [kmAtPickup, setKmAtPickup] = useState('')
  const [fuelLevelPickup, setFuelLevelPickup] = useState('full')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [paymentMethodDeposit, setPaymentMethodDeposit] = useState('cash')
  const [bookingStatus, setBookingStatus] = useState('confirmed')
  const [paymentStatus, setPaymentStatus] = useState('unpaid')
  const [notes, setNotes] = useState('')

  const selectedCar = cars.find(c => c.id === carId) || null
  const totalDays = calculateDays(pickupDate, dropoffDate)
  const priceList = selectedCar ? getActivePriceList(selectedCar.price_lists || [], pickupDate) : null
  const pickupLoc = locations.find(l => l.id === pickupLocationId) || null
  const dropoffLoc = locations.find(l => l.id === dropoffLocationId) || null
  const ageNum = driverAge ? parseInt(driverAge) : null
  const pricing = priceList && totalDays > 0
    ? calculateBookingPrice(priceList, totalDays, selectedAddons, pickupLoc, dropoffLoc, ageNum, settings)
    : null

  // auto same-as-pickup for dropoff
  useEffect(() => {
    if (!dropoffLocationId && pickupLocationId) setDropoffLocationId(pickupLocationId)
  }, [pickupLocationId])

  function toggleAddon(addon: Addon) {
    setSelectedAddons(prev => {
      const exists = prev.find(a => a.addon.id === addon.id)
      if (exists) return prev.filter(a => a.addon.id !== addon.id)
      return [...prev, { addon, quantity: 1 }]
    })
  }

  function setAddonQty(addonId: string, qty: number) {
    setSelectedAddons(prev => prev.map(a => a.addon.id === addonId ? { ...a, quantity: qty } : a))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!carId) { setError('Please select a car'); return }
    if (!guestName.trim()) { setError('Guest name is required'); return }
    if (!pricing) { setError('Cannot calculate price — check car and dates'); return }

    setSaving(true)
    setError('')

    const res = await fetch('/api/admin/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        carId, bookingType: 'offline',
        pickupDate, pickupTime, dropoffDate, dropoffTime,
        pickupLocationId: pickupLocationId || null,
        dropoffLocationId: dropoffLocationId || null,
        hotelName: hotelName || null,
        hotelAddress: hotelAddress || null,
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim() || null,
        guestPhone: guestPhone.trim() || null,
        guestLicense: guestLicense.trim() || null,
        guestNiePassport: guestNiePassport.trim() || null,
        guestAddress: guestAddress.trim() || null,
        guestAddressSpain: guestAddressSpain.trim() || null,
        driverAge: ageNum,
        selectedAddons: selectedAddons.map(({ addon, quantity }) => ({
          addon: { id: addon.id, name_en: addon.name_en, pricing_type: addon.pricing_type, price: addon.price },
          quantity,
        })),
        totalDays,
        pricing,
        status: bookingStatus,
        paymentStatus,
        paymentMethod: paymentMethod || null,
        paymentMethodDeposit: paymentMethodDeposit || null,
        kmAtPickup: kmAtPickup ? parseInt(kmAtPickup) : null,
        fuelLevelPickup,
        notes: notes.trim() || null,
      }),
    })

    const data = await res.json()
    setSaving(false)

    if (!res.ok) { setError(data.error || 'Failed to create booking'); return }

    setCreatedId(data.id)
    setCreatedRef(data.reference)
  }

  // Success state
  if (createdId && createdRef) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Save size={28} className="text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-[#0A1F44] mb-1">Booking Created</h2>
        <p className="text-gray-400 mb-6">{createdRef}</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <a href={`/api/admin/bookings/${createdId}/contract?lang=es`} target="_blank"
            className="flex items-center gap-2 border border-gray-200 hover:border-[#0A1F44] text-gray-600 hover:text-[#0A1F44] px-4 py-2 rounded-xl text-sm font-semibold transition-all">
            <FileText size={14} /> Contrato ES
          </a>
          <a href={`/api/admin/bookings/${createdId}/contract?lang=en`} target="_blank"
            className="flex items-center gap-2 border border-gray-200 hover:border-[#0A1F44] text-gray-600 hover:text-[#0A1F44] px-4 py-2 rounded-xl text-sm font-semibold transition-all">
            <FileText size={14} /> Contract EN
          </a>
          <button onClick={() => router.push(`/admin/bookings/${createdId}`)}
            className="bg-[#C9A84C] hover:bg-yellow-400 text-[#0A1F44] px-5 py-2 rounded-xl text-sm font-bold transition-colors">
            View Booking →
          </button>
        </div>
        <button onClick={() => router.push('/admin/bookings')}
          className="mt-4 text-sm text-gray-400 hover:text-gray-600 underline">
          Back to bookings list
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button type="button" onClick={() => router.push('/admin/bookings')}
          className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-[#0A1F44]">New Offline Booking</h1>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">

          {/* Car */}
          <Section title="Vehicle">
            <div>
              <label className={labelCls}>Car *</label>
              <select className={selectCls} value={carId} onChange={e => setCarId(e.target.value)} required>
                <option value="">— select car —</option>
                {cars.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.make} {c.model}{c.year ? ` (${c.year})` : ''}{c.license_plate ? ` — ${c.license_plate}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </Section>

          {/* Dates */}
          <Section title="Rental Period">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Pickup Date *</label>
                <input type="date" className={inputCls} value={pickupDate} onChange={e => setPickupDate(e.target.value)} required />
              </div>
              <div>
                <label className={labelCls}>Pickup Time *</label>
                <input type="time" className={inputCls} value={pickupTime} onChange={e => setPickupTime(e.target.value)} required />
              </div>
              <div>
                <label className={labelCls}>Return Date *</label>
                <input type="date" className={inputCls} value={dropoffDate} onChange={e => setDropoffDate(e.target.value)} required />
              </div>
              <div>
                <label className={labelCls}>Return Time *</label>
                <input type="time" className={inputCls} value={dropoffTime} onChange={e => setDropoffTime(e.target.value)} required />
              </div>
              <div>
                <label className={labelCls}>Pickup Location</label>
                <select className={selectCls} value={pickupLocationId} onChange={e => setPickupLocationId(e.target.value)}>
                  <option value="">— office / default —</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name_en}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Return Location</label>
                <select className={selectCls} value={dropoffLocationId} onChange={e => setDropoffLocationId(e.target.value)}>
                  <option value="">— same as pickup —</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name_en}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Hotel Name <span className="font-normal text-gray-400">(if delivery)</span></label>
                <input className={inputCls} value={hotelName} onChange={e => setHotelName(e.target.value)} placeholder="Hotel name" />
              </div>
            </div>
          </Section>

          {/* Guest */}
          <Section title="Guest Details">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={labelCls}>Full Name *</label>
                <input className={inputCls} value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="As on driving license" required />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" className={inputCls} value={guestEmail} onChange={e => setGuestEmail(e.target.value)} placeholder="guest@email.com" />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input type="tel" className={inputCls} value={guestPhone} onChange={e => setGuestPhone(e.target.value)} placeholder="+34..." />
              </div>
              <div>
                <label className={labelCls}>License Number</label>
                <input className={inputCls} value={guestLicense} onChange={e => setGuestLicense(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>NIE / Passport</label>
                <input className={inputCls} value={guestNiePassport} onChange={e => setGuestNiePassport(e.target.value)} placeholder="X1234567A" />
              </div>
              <div>
                <label className={labelCls}>Driver Age</label>
                <input type="number" className={inputCls} value={driverAge} onChange={e => setDriverAge(e.target.value)} min="18" max="99" placeholder="e.g. 35" />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Permanent Home Address</label>
                <input className={inputCls} value={guestAddress} onChange={e => setGuestAddress(e.target.value)} placeholder="Street, city, country" />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Address in Spain</label>
                <input className={inputCls} value={guestAddressSpain} onChange={e => setGuestAddressSpain(e.target.value)} placeholder="Hotel or apartment in Spain" />
              </div>
            </div>
          </Section>

          {/* Extras / Addons */}
          {addons.length > 0 && (
            <Section title="Extras">
              <div className="space-y-2">
                {addons.map(addon => {
                  const sel = selectedAddons.find(a => a.addon.id === addon.id)
                  return (
                    <div key={addon.id} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${sel ? 'border-[#C9A84C] bg-amber-50/40' : 'border-gray-100 hover:border-gray-200'}`}>
                      <label className="flex items-center gap-3 cursor-pointer flex-1">
                        <input type="checkbox" checked={!!sel} onChange={() => toggleAddon(addon)} className="accent-[#C9A84C] w-4 h-4" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">{addon.name_en}</p>
                          <p className="text-xs text-gray-400">€{addon.price} {addon.pricing_type === 'per_day' ? '/day' : 'flat'}</p>
                        </div>
                      </label>
                      {sel && (
                        <input type="number" min={1} max={10} value={sel.quantity}
                          onChange={e => setAddonQty(addon.id, parseInt(e.target.value) || 1)}
                          className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40" />
                      )}
                    </div>
                  )
                })}
              </div>
            </Section>
          )}

          {/* Operational */}
          <Section title="Delivery Details">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>KM at Pickup</label>
                <input type="number" className={inputCls} value={kmAtPickup} onChange={e => setKmAtPickup(e.target.value)} placeholder="e.g. 12500" />
              </div>
              <div>
                <label className={labelCls}>Fuel Level at Pickup</label>
                <select className={selectCls} value={fuelLevelPickup} onChange={e => setFuelLevelPickup(e.target.value)}>
                  <option value="full">Full</option>
                  <option value="three_quarters">3/4</option>
                  <option value="half">1/2</option>
                  <option value="quarter">1/4</option>
                  <option value="empty">Empty</option>
                </select>
              </div>
            </div>
          </Section>

          {/* Notes */}
          <Section title="Internal Notes">
            <textarea className={`${inputCls} resize-none`} rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Visible only to admin…" />
          </Section>
        </div>

        {/* Right sidebar — pricing + status */}
        <div className="space-y-4">

          {/* Price summary */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-[#0A1F44] text-sm uppercase tracking-wide mb-4">Price Summary</h2>
            {!selectedCar && <p className="text-xs text-gray-400">Select a car to see pricing</p>}
            {selectedCar && !pricing && <p className="text-xs text-amber-600">Check dates</p>}
            {pricing && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Daily rate × {totalDays}d</span>
                  <span>€{pricing.dailyRate.toFixed(2)}</span>
                </div>
                {pricing.discountPct > 0 && (
                  <div className="flex justify-between text-xs text-emerald-600">
                    <span>Discount ({pricing.discountPct}%)</span>
                    <span>−€{pricing.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {pricing.addonsTotal > 0 && (
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Extras</span><span>€{pricing.addonsTotal.toFixed(2)}</span>
                  </div>
                )}
                {pricing.locationFee > 0 && (
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Location fee</span><span>€{pricing.locationFee.toFixed(2)}</span>
                  </div>
                )}
                {pricing.youngDriverFee > 0 && (
                  <div className="flex justify-between text-xs text-amber-600">
                    <span>Young driver</span><span>€{pricing.youngDriverFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Tax</span><span>€{pricing.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-[#0A1F44] pt-2 border-t border-gray-100 text-base">
                  <span>Total</span><span>€{pricing.total.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Status + payment */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h2 className="font-bold text-[#0A1F44] text-sm uppercase tracking-wide">Status</h2>
            <div>
              <label className={labelCls}>Booking Status</label>
              <select className={selectCls} value={bookingStatus} onChange={e => setBookingStatus(e.target.value)}>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Payment Status</label>
              <select className={selectCls} value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)}>
                <option value="unpaid">Unpaid</option>
                <option value="deposit_paid">Deposit Paid</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Payment Method (rental)</label>
              <select className={selectCls} value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Payment Method (deposit)</label>
              <select className={selectCls} value={paymentMethodDeposit} onChange={e => setPaymentMethodDeposit(e.target.value)}>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>
          </div>

          {/* Submit */}
          <button type="submit" disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-[#C9A84C] hover:bg-yellow-400 text-[#0A1F44] px-4 py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-60 shadow-sm">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? 'Creating…' : 'Create Booking'}
          </button>
        </div>
      </div>
    </form>
  )
}
