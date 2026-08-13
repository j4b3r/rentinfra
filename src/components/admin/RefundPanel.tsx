'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Undo2, AlertCircle, Check } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Props {
  bookingId: string
  amountPaid: number
  refundedAmount: number
  hasStripePayment: boolean
}

/**
 * Refunds are issued by staff, not automatically: the cancellation policy is
 * free text with no machine-readable window, so nothing can work out what a
 * customer is owed. This shows what is refundable and carries out the decision.
 */
export default function RefundPanel({
  bookingId,
  amountPaid,
  refundedAmount,
  hasStripePayment,
}: Props) {
  const router = useRouter()
  const refundable = amountPaid - refundedAmount

  const [amount, setAmount] = useState(refundable > 0 ? refundable.toFixed(2) : '')
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  if (!hasStripePayment || amountPaid <= 0) return null

  async function submitRefund() {
    setBusy(true)
    setError('')

    const res = await fetch(`/api/admin/bookings/${bookingId}/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Number(amount) }),
    })
    const body = await res.json().catch(() => ({}))
    setBusy(false)
    setConfirming(false)

    if (!res.ok) {
      setError(body.error || 'The refund could not be processed.')
      return
    }
    setDone(true)
    router.refresh()
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4">
      <h3 className="mb-3 text-sm font-bold text-[var(--ink)]">Refund</h3>

      <dl className="mb-3 space-y-1 text-xs">
        <div className="flex justify-between">
          <dt className="text-[var(--ink-soft)]">Paid</dt>
          <dd className="font-semibold tabular-nums text-[var(--ink)]">{formatCurrency(amountPaid)}</dd>
        </div>
        {refundedAmount > 0 && (
          <div className="flex justify-between">
            <dt className="text-[var(--ink-soft)]">Already refunded</dt>
            <dd className="font-semibold tabular-nums text-red-600">
              −{formatCurrency(refundedAmount)}
            </dd>
          </div>
        )}
        <div className="flex justify-between border-t border-gray-100 pt-1">
          <dt className="text-[var(--ink-soft)]">Refundable</dt>
          <dd className="font-semibold tabular-nums text-[var(--ink)]">
            {formatCurrency(Math.max(0, refundable))}
          </dd>
        </div>
      </dl>

      {refundable <= 0 ? (
        <p className="text-xs text-[var(--ink-soft)]">Fully refunded.</p>
      ) : done ? (
        <p className="flex items-center gap-1.5 text-xs text-green-700">
          <Check size={13} /> Refund sent. It reaches the customer in 5–10 days.
        </p>
      ) : (
        <>
          <label className="mb-1 block text-xs font-medium text-[var(--ink-soft)]" htmlFor="refund-amount">
            Amount to refund
          </label>
          <input
            id="refund-amount"
            type="number"
            step="0.01"
            min="0"
            max={refundable}
            value={amount}
            onChange={e => setAmount(e.target.value)}
            disabled={confirming || busy}
            className="mb-2 w-full border-2 border-[var(--bar)] px-3 py-2 text-sm tabular-nums outline-none focus:border-[var(--bar)] focus:outline-2 focus:outline-[var(--pane-signal)] focus:outline-offset-[-2px] disabled:bg-gray-50"
          />

          {!confirming ? (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              <Undo2 size={14} /> Refund {formatCurrency(Number(amount) || 0)}
            </button>
          ) : (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="mb-2 text-xs text-red-800">
                Refund {formatCurrency(Number(amount) || 0)} to the customer? This sends money back
                through Stripe and cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={submitRefund}
                  disabled={busy}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-600 py-2 text-xs font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
                >
                  {busy ? <><Loader2 size={13} className="animate-spin" /> Refunding…</> : 'Yes, refund'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  disabled={busy}
                  className="flex-1 border-2 border-[var(--bar)] bg-white py-2 text-xs font-semibold text-[var(--ink-soft)] hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle size={13} /> {error}
        </p>
      )}
    </div>
  )
}
