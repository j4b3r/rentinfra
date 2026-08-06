'use client'

import { useState } from 'react'
import { Search, Car, Calendar, MapPin, Package } from 'lucide-react'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import { Booking } from '@/types'

export default function MyBookingPage() {
  const [reference, setReference] = useState('')
  const [email, setEmail] = useState('')
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function search() {
    if (!reference.trim() || !email.trim()) return
    setLoading(true)
    setError(null)
    setBooking(null)

    const res = await fetch(`/api/bookings/lookup?reference=${encodeURIComponent(reference)}&email=${encodeURIComponent(email)}`)
    const data = await res.json()

    if (!res.ok || !data.booking) {
      setError('No booking found with these details.')
    } else {
      setBooking(data.booking)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-[#0A1F44] py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-white">Find My Booking</h1>
          <p className="text-gray-400 mt-1">Enter your booking reference and email address</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Search form */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Booking Reference</label>
              <input
                type="text" placeholder="CMB-2026-00001"
                value={reference}
                onChange={e => setReference(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && search()}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0A1F44]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email" placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && search()}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0A1F44]"
              />
            </div>
            <button
              onClick={search}
              disabled={loading || !reference || !email}
              className="w-full bg-[#0A1F44] text-white py-3 rounded-lg font-semibold hover:bg-[#C9A84C] hover:text-[#0A1F44] transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <Search size={18} />
              {loading ? 'Searching...' : 'Find Booking'}
            </button>
          </div>
          {error && <p className="mt-4 text-red-600 text-sm">{error}</p>}
        </div>

        {/* Result */}
        {booking && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="bg-[#0A1F44] px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs">Booking Reference</p>
                <p className="text-[#C9A84C] font-bold text-xl">{booking.reference}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(booking.status)}`}>
                {booking.status}
              </span>
            </div>

            <div className="p-6 space-y-4">
              {/* Car */}
              {booking.car && (
                <div className="flex items-center gap-3">
                  <Car size={18} className="text-[#C9A84C] shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Vehicle</p>
                    <p className="font-semibold text-[#0A1F44]">{booking.car.make} {booking.car.model}</p>
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="flex items-start gap-3">
                <Calendar size={18} className="text-[#C9A84C] shrink-0 mt-0.5" />
                <div className="grid grid-cols-2 gap-4 flex-1">
                  <div>
                    <p className="text-xs text-gray-400">Pickup</p>
                    <p className="font-semibold text-sm text-[#0A1F44]">{formatDate(booking.pickup_date)}</p>
                    <p className="text-xs text-gray-500">{booking.pickup_time}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Return</p>
                    <p className="font-semibold text-sm text-[#0A1F44]">{formatDate(booking.dropoff_date)}</p>
                    <p className="text-xs text-gray-500">{booking.dropoff_time}</p>
                  </div>
                </div>
              </div>

              {/* Location */}
              {booking.pickup_location && (
                <div className="flex items-center gap-3">
                  <MapPin size={18} className="text-[#C9A84C] shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Pickup Location</p>
                    <p className="font-semibold text-sm text-[#0A1F44]">{booking.pickup_location.name_en}</p>
                    {booking.hotel_name && <p className="text-xs text-gray-400">{booking.hotel_name}</p>}
                  </div>
                </div>
              )}

              {/* Extras */}
              {booking.booking_addons && booking.booking_addons.length > 0 && (
                <div className="flex items-start gap-3">
                  <Package size={18} className="text-[#C9A84C] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Extras</p>
                    {booking.booking_addons.map(ba => (
                      <p key={ba.id} className="text-sm text-gray-600">{ba.addon_name_snapshot} — €{ba.subtotal.toFixed(2)}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                <span className="text-gray-600">Total Amount</span>
                <span className="text-xl font-bold text-[#0A1F44]">
                  {booking.total_amount ? formatCurrency(booking.total_amount) : '—'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
