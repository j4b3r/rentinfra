'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Loader2 } from 'lucide-react'

const STATUSES = ['pending', 'confirmed', 'active', 'completed', 'cancelled']
const PAYMENT_STATUSES = ['unpaid', 'deposit_paid', 'paid', 'refunded', 'partial_refund']

const statusColor: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  active: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-gray-100 text-[var(--ink-soft)]',
  cancelled: 'bg-red-100 text-red-600',
}

interface Props {
  bookingId: string
  initialStatus: string
  initialPaymentStatus: string
  initialNotes: string | null
  initialKmPickup?: number | null
  initialKmReturn?: number | null
  initialFuelPickup?: string | null
  initialFuelReturn?: string | null
  initialPaymentMethodDeposit?: string | null
}

export default function BookingActions({ bookingId, initialStatus, initialPaymentStatus, initialNotes, initialKmPickup, initialKmReturn, initialFuelPickup, initialFuelReturn, initialPaymentMethodDeposit }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState(initialStatus)
  const [paymentStatus, setPaymentStatus] = useState(initialPaymentStatus)
  const [notes, setNotes] = useState(initialNotes || '')
  const [kmPickup, setKmPickup] = useState(initialKmPickup?.toString() || '')
  const [kmReturn, setKmReturn] = useState(initialKmReturn?.toString() || '')
  const [fuelPickup, setFuelPickup] = useState(initialFuelPickup || 'full')
  const [fuelReturn, setFuelReturn] = useState(initialFuelReturn || '')
  const [paymentMethodDeposit, setPaymentMethodDeposit] = useState(initialPaymentMethodDeposit || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    setError('')

    const res = await fetch(`/api/admin/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        payment_status: paymentStatus,
        notes,
        km_at_pickup: kmPickup ? parseInt(kmPickup) : null,
        km_at_return: kmReturn ? parseInt(kmReturn) : null,
        fuel_level_pickup: fuelPickup || null,
        fuel_level_return: fuelReturn || null,
        payment_method_deposit: paymentMethodDeposit || null,
      }),
    })

    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      setError(data.error || 'Failed to save')
      return
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  const selectCls = "w-full border-2 border-[var(--bar)] px-3 py-2 text-sm focus:outline-none focus:outline-2 focus:outline-[var(--pane-signal)] focus:outline-offset-[-2px] focus:border-[var(--pane-signal)]"

  return (
    <div className="space-y-4">
      {/* Status */}
      <div>
        <label className="block text-xs font-semibold text-[var(--ink-soft)] mb-1.5">Booking Status</label>
        <select className={selectCls} value={status} onChange={e => setStatus(e.target.value)}>
          {STATUSES.map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <span className={`mt-1.5 inline-block text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize ${statusColor[status]}`}>
          {status}
        </span>
      </div>

      {/* Payment status */}
      <div>
        <label className="block text-xs font-semibold text-[var(--ink-soft)] mb-1.5">Payment Status</label>
        <select className={selectCls} value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)}>
          {PAYMENT_STATUSES.map(s => (
            <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
          ))}
        </select>
      </div>

      {/* KM */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-[var(--ink-soft)] mb-1.5">KM at Pickup</label>
          <input type="number" className={selectCls} value={kmPickup} onChange={e => setKmPickup(e.target.value)} placeholder="e.g. 12500" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[var(--ink-soft)] mb-1.5">KM at Return</label>
          <input type="number" className={selectCls} value={kmReturn} onChange={e => setKmReturn(e.target.value)} placeholder="e.g. 13200" />
        </div>
      </div>

      {/* Fuel */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-[var(--ink-soft)] mb-1.5">Fuel at Pickup</label>
          <select className={selectCls} value={fuelPickup} onChange={e => setFuelPickup(e.target.value)}>
            <option value="full">Full</option>
            <option value="three_quarters">¾</option>
            <option value="half">½</option>
            <option value="quarter">¼</option>
            <option value="empty">Empty</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-[var(--ink-soft)] mb-1.5">Fuel at Return</label>
          <select className={selectCls} value={fuelReturn} onChange={e => setFuelReturn(e.target.value)}>
            <option value="">—</option>
            <option value="full">Full</option>
            <option value="three_quarters">¾</option>
            <option value="half">½</option>
            <option value="quarter">¼</option>
            <option value="empty">Empty</option>
          </select>
        </div>
      </div>

      {/* Deposit payment method */}
      <div>
        <label className="block text-xs font-semibold text-[var(--ink-soft)] mb-1.5">Deposit Method</label>
        <select className={selectCls} value={paymentMethodDeposit} onChange={e => setPaymentMethodDeposit(e.target.value)}>
          <option value="">— select —</option>
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="bank_transfer">Bank Transfer</option>
        </select>
      </div>

      {/* Internal notes */}
      <div>
        <label className="block text-xs font-semibold text-[var(--ink-soft)] mb-1.5">Internal Notes</label>
        <textarea
          className={`${selectCls} resize-none`}
          rows={4}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Notes visible only to admin…"
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 bg-[var(--pane-signal)] hover:bg-[var(--pane-signal-deep)] text-[var(--ink)] px-4 py-2.5 rounded-xl font-bold text-sm transition-colors disabled:opacity-60 shadow-sm"
      >
        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
        {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
      </button>
    </div>
  )
}
