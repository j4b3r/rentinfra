'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import SignatureCanvas from 'react-signature-canvas'
import { Loader2, PenLine, RotateCcw, X } from 'lucide-react'

type Role = 'client' | 'company'
type Stage = 'contract' | 'delivery' | 'return'

interface Signature {
  id: string
  role: Role
  stage: Stage
  storage_path: string
  url: string | null
}

const STAGES: { value: Stage; label: string }[] = [
  { value: 'contract', label: 'Contract' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'return', label: 'Return' },
]
const ROLES: { value: Role; label: string }[] = [
  { value: 'client', label: 'Client' },
  { value: 'company', label: 'Company' },
]

export default function SignaturePanel({ bookingId }: { bookingId: string }) {
  const [signatures, setSignatures] = useState<Signature[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [signing, setSigning] = useState<{ role: Role; stage: Stage } | null>(null)
  const [saving, setSaving] = useState(false)
  const padRef = useRef<SignatureCanvas>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await fetch(`/api/admin/bookings/${bookingId}/signatures`)
      const body = await res.json().catch(() => ({}))
      if (cancelled) return
      setSignatures(body.signatures || [])
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [bookingId])

  async function save() {
    if (!signing || !padRef.current || padRef.current.isEmpty()) {
      setError('Draw a signature first')
      return
    }
    setSaving(true)
    setError('')

    const dataUrl = padRef.current.toDataURL('image/png')
    const blob = await (await fetch(dataUrl)).blob()
    const form = new FormData()
    form.append('file', blob, 'signature.png')
    form.append('role', signing.role)
    form.append('stage', signing.stage)

    const res = await fetch(`/api/admin/bookings/${bookingId}/signatures`, { method: 'POST', body: form })
    const body = await res.json().catch(() => ({}))
    setSaving(false)

    if (!res.ok) {
      setError(body.error || 'Save failed')
      return
    }
    setSignatures(prev => [...prev.filter(s => !(s.role === signing.role && s.stage === signing.stage)), body.signature])
    setSigning(null)
  }

  function find(role: Role, stage: Stage) {
    return signatures.find(s => s.role === role && s.stage === stage)
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold text-[#0A1F44]">Signatures</h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={20} className="animate-spin text-gray-300" />
        </div>
      ) : (
        <>
          {error && <p className="mb-3 text-xs text-red-600">{error}</p>}

          <div className="space-y-3">
            {STAGES.map(stage => (
              <div key={stage.value}>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  {stage.label}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map(role => {
                    const sig = find(role.value, stage.value)
                    return (
                      <div key={role.value}>
                        {sig?.url ? (
                          <div className="group relative aspect-[2/1] overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                            <Image src={sig.url} alt={`${role.label} signature — ${stage.label}`} fill className="object-contain p-1" unoptimized />
                            <button
                              type="button"
                              onClick={() => setSigning({ role: role.value, stage: stage.value })}
                              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
                              title="Re-sign"
                            >
                              <PenLine size={12} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSigning({ role: role.value, stage: stage.value })}
                            className="flex aspect-[2/1] w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-200 text-gray-400 transition hover:border-[#C9A84C] hover:text-[#C9A84C]"
                          >
                            <PenLine size={16} />
                            <span className="text-[10px] font-medium">{role.label}</span>
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-3 text-[11px] text-gray-400">
            Signing here embeds the signature in the PDF contract for that stage. Any stage/role
            left unsigned still shows a blank line to sign by hand on the printout.
          </p>
        </>
      )}

      {signing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-[#0A1F44]">
                {ROLES.find(r => r.value === signing.role)?.label} signature — {STAGES.find(s => s.value === signing.stage)?.label}
              </p>
              <button type="button" onClick={() => setSigning(null)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
              <SignatureCanvas
                ref={padRef}
                penColor="#0A1F44"
                canvasProps={{ className: 'w-full', height: 180 }}
              />
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => padRef.current?.clear()}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
              >
                <RotateCcw size={13} /> Clear
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#0A1F44] py-2 text-xs font-bold text-white transition hover:bg-[#0A1F44]/90 disabled:opacity-40"
              >
                {saving && <Loader2 size={13} className="animate-spin" />}
                {saving ? 'Saving...' : 'Save signature'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
