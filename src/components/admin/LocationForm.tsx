'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Trash2, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Location {
  id: string
  name_en: string
  name_es: string
  type: string
  address: string | null
  extra_fee: number
  notes_en: string | null
  notes_es: string | null
  is_active: boolean
}

const labelCls = 'block text-sm font-medium text-gray-600 mb-1'
const inputCls =
  'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0A1F44] focus:ring-2 focus:ring-[#0A1F44]/15'

export default function LocationForm({ location }: { location?: Location }) {
  const router = useRouter()
  const isEdit = Boolean(location)

  const [nameEn, setNameEn] = useState(location?.name_en || '')
  const [nameEs, setNameEs] = useState(location?.name_es || '')
  const [type, setType] = useState(location?.type || 'office')
  const [address, setAddress] = useState(location?.address || '')
  const [extraFee, setExtraFee] = useState(String(location?.extra_fee ?? '0'))
  const [notesEn, setNotesEn] = useState(location?.notes_en || '')
  const [notesEs, setNotesEs] = useState(location?.notes_es || '')
  const [isActive, setIsActive] = useState(location?.is_active ?? true)

  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    setSaving(true)
    setError('')

    const payload = {
      name_en: nameEn,
      name_es: nameEs,
      type,
      address,
      extra_fee: Number(extraFee),
      notes_en: notesEn,
      notes_es: notesEs,
      is_active: isActive,
    }

    const res = await fetch(isEdit ? `/api/admin/locations/${location!.id}` : '/api/admin/locations', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const body = await res.json().catch(() => ({}))
    setSaving(false)

    if (!res.ok) {
      setError(body.error || 'Could not save the location')
      return
    }
    router.push('/admin/locations')
    router.refresh()
  }

  async function remove() {
    if (!location) return
    if (!confirm(`Delete "${location.name_en}"? This cannot be undone.`)) return
    setDeleting(true)
    setError('')

    const res = await fetch(`/api/admin/locations/${location.id}`, { method: 'DELETE' })
    const body = await res.json().catch(() => ({}))
    setDeleting(false)

    if (!res.ok) {
      setError(body.error || 'Could not delete the location')
      return
    }
    router.push('/admin/locations')
    router.refresh()
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/locations" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-[#0A1F44]">{isEdit ? 'Edit Location' : 'Add Location'}</h1>
      </div>

      <div className="space-y-5 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Name (English) *</label>
            <input className={inputCls} value={nameEn} onChange={e => setNameEn(e.target.value)} placeholder="Málaga Airport" />
          </div>
          <div>
            <label className={labelCls}>Name (Spanish) *</label>
            <input className={inputCls} value={nameEs} onChange={e => setNameEs(e.target.value)} placeholder="Aeropuerto de Málaga" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Type</label>
            <select className={inputCls} value={type} onChange={e => setType(e.target.value)}>
              <option value="office">Office</option>
              <option value="airport">Airport</option>
              <option value="hotel_delivery">Hotel delivery</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Extra fee (€)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className={inputCls}
              value={extraFee}
              onChange={e => setExtraFee(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Address</label>
          <input className={inputCls} value={address} onChange={e => setAddress(e.target.value)} placeholder="Optional" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Notes (English)</label>
            <textarea className={`${inputCls} resize-none`} rows={2} value={notesEn} onChange={e => setNotesEn(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Notes (Spanish)</label>
            <textarea className={`${inputCls} resize-none`} rows={2} value={notesEs} onChange={e => setNotesEs(e.target.value)} />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
          Active (selectable at checkout)
        </label>

        {error && (
          <p className="flex items-center gap-1.5 text-sm text-red-600">
            <AlertCircle size={14} /> {error}
          </p>
        )}

        <div className="flex items-center justify-between border-t border-gray-50 pt-4">
          {isEdit ? (
            <button
              type="button"
              onClick={remove}
              disabled={deleting}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
            >
              {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Delete
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={save}
            disabled={saving || !nameEn || !nameEs}
            className="flex items-center gap-1.5 rounded-lg bg-[#0A1F44] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#0A1F44]/90 disabled:opacity-40"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
