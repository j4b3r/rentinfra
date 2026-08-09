'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Camera, Loader2, Trash2, ShieldCheck, ShieldX, X } from 'lucide-react'

interface Photo {
  id: string
  side: 'front' | 'back'
  storage_path: string
  url: string | null
}

interface BookingLicence {
  guest_license: string | null
  licence_verified_at: string | null
  licence_rejection_reason: string | null
}

export default function LicencePanel({ bookingId }: { bookingId: string }) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [booking, setBooking] = useState<BookingLicence | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<'front' | 'back' | null>(null)
  const [error, setError] = useState('')
  const [rejecting, setRejecting] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [busy, setBusy] = useState(false)
  const frontInput = useRef<HTMLInputElement>(null)
  const backInput = useRef<HTMLInputElement>(null)

  async function load() {
    const res = await fetch(`/api/admin/bookings/${bookingId}/licence`)
    const body = await res.json().catch(() => ({}))
    setPhotos(body.photos || [])
    setBooking(body.booking || null)
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await fetch(`/api/admin/bookings/${bookingId}/licence`)
      const body = await res.json().catch(() => ({}))
      if (cancelled) return
      setPhotos(body.photos || [])
      setBooking(body.booking || null)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [bookingId])

  async function handleUpload(side: 'front' | 'back', file: File | null) {
    if (!file) return
    setError('')
    setUploading(side)

    const form = new FormData()
    form.append('file', file)
    form.append('side', side)

    const res = await fetch(`/api/admin/bookings/${bookingId}/licence`, { method: 'POST', body: form })
    const body = await res.json().catch(() => ({}))
    setUploading(null)

    if (!res.ok) {
      setError(body.error || 'Upload failed')
      return
    }
    setPhotos(prev => [...prev.filter(p => p.side !== side), body.photo])
    // Uploading resets verification server-side — reflect that immediately.
    setBooking(prev => (prev ? { ...prev, licence_verified_at: null, licence_rejection_reason: null } : prev))
  }

  async function handleDelete(photoId: string) {
    if (!confirm('Delete this licence photo?')) return
    const res = await fetch(`/api/admin/bookings/${bookingId}/licence/${photoId}`, { method: 'DELETE' })
    if (res.ok) setPhotos(prev => prev.filter(p => p.id !== photoId))
  }

  async function verify() {
    setBusy(true)
    setError('')
    const res = await fetch(`/api/admin/bookings/${bookingId}/licence/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify' }),
    })
    setBusy(false)
    if (!res.ok) {
      setError('Could not verify')
      return
    }
    await load()
  }

  async function reject() {
    if (!rejectReason.trim()) {
      setError('Give a reason for rejecting')
      return
    }
    setBusy(true)
    setError('')
    const res = await fetch(`/api/admin/bookings/${bookingId}/licence/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject', reason: rejectReason.trim() }),
    })
    setBusy(false)
    if (!res.ok) {
      setError('Could not save')
      return
    }
    setRejecting(false)
    setRejectReason('')
    await load()
  }

  const front = photos.find(p => p.side === 'front')
  const back = photos.find(p => p.side === 'back')
  const isVerified = Boolean(booking?.licence_verified_at)
  const isRejected = Boolean(booking?.licence_rejection_reason)

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold text-[#0A1F44]">Driver licence</h2>
        {isVerified && (
          <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            <ShieldCheck size={12} /> Verified
          </span>
        )}
        {isRejected && !isVerified && (
          <span className="flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-600">
            <ShieldX size={12} /> Rejected
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={20} className="animate-spin text-gray-300" />
        </div>
      ) : (
        <>
          {booking?.guest_license && (
            <p className="mb-3 text-xs text-gray-500">
              Licence number on file: <span className="font-semibold text-[#0A1F44]">{booking.guest_license}</span>
            </p>
          )}

          <div className="mb-3 grid grid-cols-2 gap-2">
            <PhotoSlot
              label="Front"
              photo={front}
              uploading={uploading === 'front'}
              inputRef={frontInput}
              onPick={f => handleUpload('front', f)}
              onDelete={handleDelete}
            />
            <PhotoSlot
              label="Back"
              photo={back}
              uploading={uploading === 'back'}
              inputRef={backInput}
              onPick={f => handleUpload('back', f)}
              onDelete={handleDelete}
            />
          </div>

          {isRejected && booking?.licence_rejection_reason && (
            <p className="mb-3 rounded-lg bg-red-50 p-2 text-xs text-red-700">
              Rejected: {booking.licence_rejection_reason}
            </p>
          )}

          {error && <p className="mb-3 text-xs text-red-600">{error}</p>}

          {!isVerified && !rejecting && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={verify}
                disabled={busy || !front || !back}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-40"
              >
                <ShieldCheck size={13} /> Verify
              </button>
              <button
                type="button"
                onClick={() => setRejecting(true)}
                disabled={busy}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
              >
                <ShieldX size={13} /> Reject
              </button>
            </div>
          )}

          {!front || !back ? (
            <p className="mt-2 text-[11px] text-gray-400">Upload both sides before verifying.</p>
          ) : null}

          {rejecting && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-red-800">Reason for rejecting</span>
                <button type="button" onClick={() => setRejecting(false)} className="text-red-400 hover:text-red-600">
                  <X size={14} />
                </button>
              </div>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={2}
                placeholder="e.g. photo is blurry, name doesn't match booking"
                className="mb-2 w-full rounded-lg border border-red-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-200"
              />
              <button
                type="button"
                onClick={reject}
                disabled={busy}
                className="w-full rounded-lg bg-red-600 py-2 text-xs font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                Confirm rejection
              </button>
            </div>
          )}

          {isVerified && (
            <p className="text-[11px] text-gray-400">Uploading a new photo will reset this and require re-verifying.</p>
          )}
        </>
      )}
    </div>
  )
}

function PhotoSlot({
  label,
  photo,
  uploading,
  inputRef,
  onPick,
  onDelete,
}: {
  label: string
  photo: Photo | undefined
  uploading: boolean
  inputRef: React.RefObject<HTMLInputElement | null>
  onPick: (file: File | null) => void
  onDelete: (id: string) => void
}) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      {photo?.url ? (
        <div className="group relative aspect-[3/2] overflow-hidden rounded-lg border border-gray-100">
          <Image src={photo.url} alt={`Licence ${label.toLowerCase()}`} fill className="object-cover" unoptimized />
          <button
            type="button"
            onClick={() => onDelete(photo.id)}
            className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
          >
            <Trash2 size={12} />
          </button>
        </div>
      ) : (
        <label className="flex aspect-[3/2] cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-200 text-gray-400 transition hover:border-[#C9A84C] hover:text-[#C9A84C]">
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
          <span className="text-[10px] font-medium">Add photo</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            disabled={uploading}
            onChange={e => onPick(e.target.files?.[0] ?? null)}
            className="hidden"
          />
        </label>
      )}
    </div>
  )
}
