'use client'

import { useEffect, useState } from 'react'
import { Loader2, Plus, Trash2, Wrench, X } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Block {
  id: string
  start_date: string
  end_date: string
  reason: string
  notes: string | null
}

const REASON_LABEL: Record<string, string> = {
  service: 'Service',
  repair: 'Repair',
  cleaning: 'Cleaning',
  other: 'Other',
}

const today = () => new Date().toISOString().slice(0, 10)

export default function MaintenancePanel({ carId }: { carId: string }) {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [startDate, setStartDate] = useState(today())
  const [endDate, setEndDate] = useState(today())
  const [reason, setReason] = useState('service')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await fetch(`/api/admin/cars/${carId}/maintenance`)
      const body = await res.json().catch(() => ({}))
      if (cancelled) return
      setBlocks(body.blocks || [])
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [carId])

  async function submit() {
    setError('')
    setSaving(true)

    const res = await fetch(`/api/admin/cars/${carId}/maintenance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate, endDate, reason, notes }),
    })
    const body = await res.json().catch(() => ({}))
    setSaving(false)

    if (!res.ok) {
      setError(body.error || 'Could not save the block')
      return
    }
    setBlocks(prev => [body.block, ...prev].sort((a, b) => b.start_date.localeCompare(a.start_date)))
    setAdding(false)
    setNotes('')
  }

  async function remove(blockId: string) {
    if (!confirm('Remove this maintenance block?')) return
    const res = await fetch(`/api/admin/cars/${carId}/maintenance/${blockId}`, { method: 'DELETE' })
    if (res.ok) setBlocks(prev => prev.filter(b => b.id !== blockId))
  }

  const now = today()
  const active = blocks.filter(b => b.start_date <= now && b.end_date > now)
  const upcoming = blocks.filter(b => b.start_date > now)
  const past = blocks.filter(b => b.end_date <= now)

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-bold text-[#0A1F44]">Maintenance</h2>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:border-[#0A1F44] hover:text-[#0A1F44]"
          >
            <Plus size={13} /> Schedule block
          </button>
        )}
      </div>

      {adding && (
        <div className="mb-4 rounded-xl border border-gray-200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-bold text-[#0A1F44]">New maintenance block</span>
            <button type="button" onClick={() => setAdding(false)} className="text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          </div>
          <div className="mb-3 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">From</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#0A1F44] focus:ring-2 focus:ring-[#0A1F44]/15"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Until</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#0A1F44] focus:ring-2 focus:ring-[#0A1F44]/15"
              />
            </div>
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-gray-600">Reason</label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#0A1F44] focus:ring-2 focus:ring-[#0A1F44]/15"
            >
              {Object.entries(REASON_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-gray-600">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#0A1F44] focus:ring-2 focus:ring-[#0A1F44]/15"
            />
          </div>
          {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#0A1F44] py-2 text-xs font-bold text-white transition hover:bg-[#0A1F44]/90 disabled:opacity-60"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Wrench size={13} />}
            Save block — the car will show unavailable for these dates
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 size={18} className="animate-spin text-gray-300" />
        </div>
      ) : blocks.length === 0 ? (
        <p className="text-sm text-gray-400">No maintenance scheduled.</p>
      ) : (
        <div className="space-y-4">
          {active.length > 0 && <BlockGroup title="Active now" blocks={active} onRemove={remove} />}
          {upcoming.length > 0 && <BlockGroup title="Upcoming" blocks={upcoming} onRemove={remove} />}
          {past.length > 0 && <BlockGroup title="Past" blocks={past} onRemove={remove} muted />}
        </div>
      )}
    </div>
  )
}

function BlockGroup({
  title,
  blocks,
  onRemove,
  muted,
}: {
  title: string
  blocks: Block[]
  onRemove: (id: string) => void
  muted?: boolean
}) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{title}</p>
      <div className="space-y-1.5">
        {blocks.map(b => (
          <div
            key={b.id}
            className={`flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 ${muted ? 'opacity-60' : ''}`}
          >
            <div>
              <p className="text-sm font-medium text-[#0A1F44]">
                {REASON_LABEL[b.reason] || b.reason} · {formatDate(b.start_date)} → {formatDate(b.end_date)}
              </p>
              {b.notes && <p className="text-xs text-gray-400">{b.notes}</p>}
            </div>
            <button
              type="button"
              onClick={() => onRemove(b.id)}
              className="text-gray-300 transition hover:text-red-500"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
