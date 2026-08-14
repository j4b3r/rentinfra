'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Trash2, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Addon {
  id: string
  name_en: string
  name_es: string
  description_en: string | null
  description_es: string | null
  icon: string | null
  pricing_type: string
  price: number
  is_global: boolean
  is_active: boolean
  vehicle_type: string | null
}

const labelCls = 'block text-sm font-medium text-[var(--ink-soft)] mb-1'
const inputCls =
  'w-full border-2 border-[var(--bar)] px-3 py-2 text-sm outline-none focus:border-[var(--bar)] focus:outline-2 focus:outline-[var(--pane-signal)] focus:outline-offset-[-2px]'

export default function AddonForm({ addon }: { addon?: Addon }) {
  const router = useRouter()
  const isEdit = Boolean(addon)

  const [nameEn, setNameEn] = useState(addon?.name_en || '')
  const [nameEs, setNameEs] = useState(addon?.name_es || '')
  const [descEn, setDescEn] = useState(addon?.description_en || '')
  const [descEs, setDescEs] = useState(addon?.description_es || '')
  const [pricingType, setPricingType] = useState(addon?.pricing_type || 'flat')
  const [price, setPrice] = useState(String(addon?.price ?? ''))
  const [isGlobal, setIsGlobal] = useState(addon?.is_global ?? true)
  const [isActive, setIsActive] = useState(addon?.is_active ?? true)
  const [vehicleType, setVehicleType] = useState(addon?.vehicle_type || '')

  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    setSaving(true)
    setError('')

    const payload = {
      name_en: nameEn,
      name_es: nameEs,
      description_en: descEn,
      description_es: descEs,
      pricing_type: pricingType,
      price: Number(price),
      is_global: isGlobal,
      is_active: isActive,
      vehicle_type: vehicleType || null,
    }

    const res = await fetch(isEdit ? `/api/admin/addons/${addon!.id}` : '/api/admin/addons', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const body = await res.json().catch(() => ({}))
    setSaving(false)

    if (!res.ok) {
      setError(body.error || 'Could not save the addon')
      return
    }
    router.push('/admin/addons')
    router.refresh()
  }

  async function remove() {
    if (!addon) return
    if (!confirm(`Delete "${addon.name_en}"? This cannot be undone.`)) return
    setDeleting(true)
    setError('')

    const res = await fetch(`/api/admin/addons/${addon.id}`, { method: 'DELETE' })
    const body = await res.json().catch(() => ({}))
    setDeleting(false)

    if (!res.ok) {
      setError(body.error || 'Could not delete the addon')
      return
    }
    router.push('/admin/addons')
    router.refresh()
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/addons" className="text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-[var(--ink)]">{isEdit ? 'Edit Addon' : 'Add Addon'}</h1>
      </div>

      <div className="op-panel space-y-5 p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Name (English) *</label>
            <input className={inputCls} value={nameEn} onChange={e => setNameEn(e.target.value)} placeholder="GPS Navigation" />
          </div>
          <div>
            <label className={labelCls}>Name (Spanish) *</label>
            <input className={inputCls} value={nameEs} onChange={e => setNameEs(e.target.value)} placeholder="Navegador GPS" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Description (English)</label>
            <textarea className={`${inputCls} resize-none`} rows={2} value={descEn} onChange={e => setDescEn(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Description (Spanish)</label>
            <textarea className={`${inputCls} resize-none`} rows={2} value={descEs} onChange={e => setDescEs(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Pricing</label>
            <select className={inputCls} value={pricingType} onChange={e => setPricingType(e.target.value)}>
              <option value="flat">Flat (once per booking)</option>
              <option value="per_day">Per day</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Price (€) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className={inputCls}
              value={price}
              onChange={e => setPrice(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Limit to vehicle type</label>
          <select className={inputCls} value={vehicleType} onChange={e => setVehicleType(e.target.value)}>
            <option value="">All vehicle types</option>
            <option value="car">Car only</option>
            <option value="motorbike">Motorbike only</option>
            <option value="bicycle">Bicycle only</option>
          </select>
          <p className="mt-1 text-xs text-[var(--ink-soft)]">A child seat is meaningless on a bicycle — leave blank to show everywhere.</p>
        </div>

        <div className="flex items-center gap-6 pt-1">
          <label className="flex items-center gap-2 text-sm text-[var(--ink-soft)]">
            <input type="checkbox" checked={isGlobal} onChange={e => setIsGlobal(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
            Applies to all cars
          </label>
          <label className="flex items-center gap-2 text-sm text-[var(--ink-soft)]">
            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
            Active (bookable on the site)
          </label>
        </div>

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
            disabled={saving || !nameEn || !nameEs || !price}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--bar)] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[var(--bar)]/90 disabled:opacity-40"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
