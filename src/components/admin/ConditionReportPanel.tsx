'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Camera, Loader2, Trash2, AlertTriangle, Plus, X } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Photo {
  id: string
  phase: 'pickup' | 'return'
  storage_path: string
  caption: string | null
  position: number
  url: string | null
}

interface Claim {
  id: string
  description: string
  amount: number
  photo_ids: string[]
  status: 'open' | 'resolved' | 'waived'
  created_at: string
}

const claimStatusColor: Record<string, string> = {
  open: 'bg-amber-100 text-amber-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  waived: 'bg-gray-100 text-[var(--ink-soft)]',
}

export default function ConditionReportPanel({ bookingId }: { bookingId: string }) {
  const [phase, setPhase] = useState<'pickup' | 'return'>('pickup')
  const [photos, setPhotos] = useState<Photo[]>([])
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [claimOpen, setClaimOpen] = useState(false)
  const [claimDesc, setClaimDesc] = useState('')
  const [claimAmount, setClaimAmount] = useState('')
  const [savingClaim, setSavingClaim] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [photosRes, claimsRes] = await Promise.all([
        fetch(`/api/admin/bookings/${bookingId}/condition-photos`),
        fetch(`/api/admin/bookings/${bookingId}/damage-claims`),
      ])
      const photosBody = await photosRes.json().catch(() => ({}))
      const claimsBody = await claimsRes.json().catch(() => ({}))
      if (cancelled) return
      setPhotos(photosBody.photos || [])
      setClaims(claimsBody.claims || [])
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [bookingId])

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setError('')
    setUploading(true)

    for (const file of Array.from(files)) {
      const form = new FormData()
      form.append('file', file)
      form.append('phase', phase)

      const res = await fetch(`/api/admin/bookings/${bookingId}/condition-photos`, {
        method: 'POST',
        body: form,
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(body.error || 'Upload failed')
        break
      }
      setPhotos(prev => [...prev, body.photo])
    }

    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleDelete(photoId: string) {
    if (!confirm('Delete this photo?')) return
    const res = await fetch(`/api/admin/bookings/${bookingId}/condition-photos/${photoId}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      setPhotos(prev => prev.filter(p => p.id !== photoId))
      setSelected(prev => {
        const next = new Set(prev)
        next.delete(photoId)
        return next
      })
    }
  }

  function toggleSelect(photoId: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(photoId)) next.delete(photoId)
      else next.add(photoId)
      return next
    })
  }

  async function submitClaim() {
    const amount = Number(claimAmount)
    if (!claimDesc.trim()) {
      setError('Describe the damage')
      return
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a valid amount')
      return
    }
    setSavingClaim(true)
    setError('')

    const res = await fetch(`/api/admin/bookings/${bookingId}/damage-claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: claimDesc.trim(),
        amount,
        photoIds: Array.from(selected),
      }),
    })
    const body = await res.json().catch(() => ({}))
    setSavingClaim(false)

    if (!res.ok) {
      setError(body.error || 'Could not save the claim')
      return
    }
    setClaims(prev => [body.claim, ...prev])
    setClaimOpen(false)
    setClaimDesc('')
    setClaimAmount('')
    setSelected(new Set())
  }

  async function updateClaimStatus(claimId: string, status: Claim['status']) {
    const res = await fetch(`/api/admin/bookings/${bookingId}/damage-claims/${claimId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      setClaims(prev => prev.map(c => (c.id === claimId ? { ...c, status } : c)))
    }
  }

  const shownPhotos = photos.filter(p => p.phase === phase)

  return (
    <div className="op-panel p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold text-[var(--ink)]">Condition report</h2>
        <div className="flex border-2 border-[var(--bar)] p-0.5 text-xs font-semibold">
          {(['pickup', 'return'] as const).map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setPhase(p)}
              className={`rounded-md px-3 py-1 capitalize transition ${
                phase === p ? 'bg-[var(--bar)] text-white' : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={20} className="animate-spin text-gray-300" />
        </div>
      ) : (
        <>
          {/* Photo grid */}
          <div className="mb-3 grid grid-cols-3 gap-2">
            {shownPhotos.map(photo => (
              <button
                key={photo.id}
                type="button"
                onClick={() => toggleSelect(photo.id)}
                className={`group relative aspect-square overflow-hidden rounded-lg border-2 transition ${
                  selected.has(photo.id) ? 'border-[var(--pane-signal)]' : 'border-transparent'
                }`}
              >
                {photo.url && (
                  <Image src={photo.url} alt={photo.caption || 'Condition photo'} fill className="object-cover" unoptimized />
                )}
                <div
                  onClick={e => {
                    e.stopPropagation()
                    handleDelete(photo.id)
                  }}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
                >
                  <Trash2 size={12} />
                </div>
                {selected.has(photo.id) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[var(--pane-signal)]/20">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--pane-signal)] text-xs font-bold text-[var(--ink)]">
                      ✓
                    </div>
                  </div>
                )}
              </button>
            ))}

            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-200 text-[var(--ink-soft)] transition hover:border-[var(--pane-signal)] hover:text-[var(--pane-signal)]">
              {uploading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
              <span className="text-[10px] font-medium">Add photo</span>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                disabled={uploading}
                onChange={e => handleFiles(e.target.files)}
                className="hidden"
              />
            </label>
          </div>

          {shownPhotos.length > 0 && (
            <p className="mb-3 text-[11px] text-[var(--ink-soft)]">
              Tap a photo to select it, then raise a damage claim citing what&apos;s selected.
            </p>
          )}

          {error && <p className="mb-3 text-xs text-red-600">{error}</p>}

          {/* Raise a claim */}
          {!claimOpen ? (
            <button
              type="button"
              onClick={() => setClaimOpen(true)}
              className="mb-4 flex w-full items-center justify-center gap-1.5 border-2 border-[var(--bar)] py-2 text-xs font-semibold text-[var(--ink-soft)] transition hover:border-red-200 hover:text-red-600"
            >
              <Plus size={13} /> Raise damage claim
            </button>
          ) : (
            <div className="mb-4 border-2 border-[var(--bar)] p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--ink)]">New damage claim</span>
                <button type="button" onClick={() => setClaimOpen(false)} className="text-[var(--ink-soft)] hover:text-[var(--ink)]">
                  <X size={14} />
                </button>
              </div>
              <textarea
                value={claimDesc}
                onChange={e => setClaimDesc(e.target.value)}
                placeholder="What's damaged, and how"
                rows={2}
                className="mb-2 w-full border-2 border-[var(--bar)] px-3 py-2 text-sm outline-none focus:border-[var(--bar)] focus:outline-2 focus:outline-[var(--pane-signal)] focus:outline-offset-[-2px]"
              />
              <input
                type="number"
                step="0.01"
                min="0"
                value={claimAmount}
                onChange={e => setClaimAmount(e.target.value)}
                placeholder="Amount"
                className="mb-2 w-full border-2 border-[var(--bar)] px-3 py-2 text-sm tabular-nums outline-none focus:border-[var(--bar)] focus:outline-2 focus:outline-[var(--pane-signal)] focus:outline-offset-[-2px]"
              />
              <p className="mb-2 text-[11px] text-[var(--ink-soft)]">
                {selected.size > 0
                  ? `Citing ${selected.size} selected photo${selected.size !== 1 ? 's' : ''}.`
                  : 'No photos selected — select photos above to cite them as evidence.'}
              </p>
              <p className="mb-2 text-[11px] text-amber-700">
                This records a claim for staff to act on at the counter. It does not charge or
                refund anything automatically.
              </p>
              <button
                type="button"
                onClick={submitClaim}
                disabled={savingClaim}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--bar)] py-2 text-xs font-bold text-white transition hover:bg-[var(--bar)]/90 disabled:opacity-60"
              >
                {savingClaim ? <Loader2 size={13} className="animate-spin" /> : <AlertTriangle size={13} />}
                Save claim
              </button>
            </div>
          )}

          {/* Existing claims */}
          {claims.length > 0 && (
            <div className="space-y-2 border-t border-gray-50 pt-3">
              {claims.map(claim => (
                <div key={claim.id} className="rounded-lg border border-gray-100 p-3">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <p className="text-xs text-[var(--ink)]">{claim.description}</p>
                    <span className="shrink-0 text-xs font-bold tabular-nums text-[var(--ink)]">
                      {formatCurrency(claim.amount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${claimStatusColor[claim.status]}`}
                    >
                      {claim.status}
                    </span>
                    {claim.status === 'open' && (
                      <div className="flex gap-2 text-[11px] font-semibold">
                        <button
                          type="button"
                          onClick={() => updateClaimStatus(claim.id, 'resolved')}
                          className="text-emerald-600 hover:underline"
                        >
                          Mark resolved
                        </button>
                        <button
                          type="button"
                          onClick={() => updateClaimStatus(claim.id, 'waived')}
                          className="text-[var(--ink-soft)] hover:underline"
                        >
                          Waive
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
