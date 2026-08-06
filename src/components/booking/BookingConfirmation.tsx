'use client'

import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

interface Props {
  reference: string
  email: string
}

export default function BookingConfirmation({ reference, email }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-8 text-center max-w-lg mx-auto">
      <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-[#0A1F44] mb-2">Booking Confirmed!</h2>
      <p className="text-gray-500 mb-6">
        We have received your booking request and will confirm it shortly.
      </p>

      <div className="bg-[#0A1F44] text-white rounded-xl p-5 mb-6">
        <p className="text-xs text-gray-400 mb-1">Your Booking Reference</p>
        <p className="text-3xl font-bold text-[#C9A84C] tracking-widest">{reference}</p>
        <p className="text-xs text-gray-400 mt-2">A confirmation has been sent to {email}</p>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-sm text-amber-800 mb-6 text-left">
        <strong>Save your reference number!</strong><br />
        You can use it at{' '}
        <Link href="/my-booking" className="underline font-medium">rentinfra.com/my-booking</Link>
        {' '}to check your booking status anytime.
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/my-booking" className="flex-1 border-2 border-[#0A1F44] text-[#0A1F44] py-2.5 rounded-lg font-semibold hover:bg-[#0A1F44] hover:text-white transition-colors text-center">
          Track My Booking
        </Link>
        <Link href="/cars" className="flex-1 bg-[#C9A84C] text-[#0A1F44] py-2.5 rounded-lg font-semibold hover:bg-yellow-400 transition-colors text-center">
          Browse More Cars
        </Link>
      </div>
    </div>
  )
}
