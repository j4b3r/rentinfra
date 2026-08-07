'use client'

import Link from 'next/link'
import { useState } from 'react'
import { CheckCircle, CreditCard, Loader2, AlertCircle } from 'lucide-react'
import { SITE_HOST } from '@/lib/site'
import { formatCurrency } from '@/lib/utils'

interface Props {
  reference: string
  email: string
  /** Payment is configured and switched on */
  paymentsEnabled?: boolean
  /** What Stripe will charge now — the full total, or a deposit percentage of it */
  amountDue?: number | null
  /** True when amountDue is a part-payment and the rest is due at pick-up */
  isPartialPayment?: boolean
}

export default function BookingConfirmation({
  reference,
  email,
  paymentsEnabled = false,
  amountDue = null,
  isPartialPayment = false,
}: Props) {
  const [payingNow, setPayingNow] = useState(false)
  const [payError, setPayError] = useState('')

  async function payNow() {
    setPayingNow(true)
    setPayError('')

    const res = await fetch('/api/payments/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference, email }),
    })
    const body = await res.json().catch(() => ({}))

    if (!res.ok || !body.url) {
      setPayingNow(false)
      setPayError(body.error || 'Could not start the payment. Please try again.')
      return
    }
    window.location.href = body.url
  }

  const canPay = paymentsEnabled && amountDue !== null && amountDue > 0

  return (
    <div className="bg-white rounded-xl shadow-sm p-8 text-center max-w-lg mx-auto">
      <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-[#0A1F44] mb-2">Booking received</h2>
      <p className="text-gray-500 mb-6">
        {canPay
          ? 'Your booking is held. Pay now to confirm it.'
          : 'We have your booking request and will confirm it shortly.'}
      </p>

      <div className="bg-[#0A1F44] text-white rounded-xl p-5 mb-6">
        <p className="text-xs text-gray-400 mb-1">Your Booking Reference</p>
        <p className="text-3xl font-bold text-[#C9A84C] tracking-widest">{reference}</p>
        <p className="text-xs text-gray-400 mt-2">A confirmation has been sent to {email}</p>
      </div>

      {canPay && (
        <div className="mb-6 rounded-xl border border-[#C9A84C]/40 bg-[#C9A84C]/5 p-5 text-left">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold text-[#0A1F44]">
              {isPartialPayment ? 'Deposit due now' : 'Total due now'}
            </span>
            <span className="font-display text-2xl text-[#0A1F44] tabular-nums">
              {formatCurrency(amountDue!)}
            </span>
          </div>
          {isPartialPayment && (
            <p className="mt-1 text-xs text-gray-600">
              The balance is payable when you collect the vehicle.
            </p>
          )}

          <button
            onClick={payNow}
            disabled={payingNow}
            className="btn-gold mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold uppercase tracking-wide text-[#0A1F44] disabled:opacity-60"
          >
            {payingNow ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Redirecting to payment…
              </>
            ) : (
              <>
                <CreditCard size={16} /> Pay {formatCurrency(amountDue!)} now
              </>
            )}
          </button>

          {payError && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-red-600">
              <AlertCircle size={13} /> {payError}
            </p>
          )}

          <p className="mt-2 text-center text-xs text-gray-500">
            You can also pay at the counter — your booking is held either way.
          </p>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-sm text-amber-800 mb-6 text-left">
        <strong>Save your reference number!</strong><br />
        You can use it at{' '}
        <Link href="/my-booking" className="underline font-medium">{SITE_HOST}/my-booking</Link>
        {' '}to check your booking status anytime.
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/my-booking" className="flex-1 border-2 border-[#0A1F44] text-[#0A1F44] py-2.5 rounded-lg font-semibold hover:bg-[#0A1F44] hover:text-white transition-colors text-center">
          Track My Booking
        </Link>
        <Link href="/cars" className="flex-1 bg-[#C9A84C] text-[#0A1F44] py-2.5 rounded-lg font-semibold hover:bg-yellow-400 transition-colors text-center">
          Browse the fleet
        </Link>
      </div>
    </div>
  )
}
