'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Car, PriceList, PriceListDiscount } from '@/types'
import { Plus, Trash2, Save, ArrowLeft, AlertCircle } from 'lucide-react'
import CarImageUploader from './CarImageUploader'

interface Discount {
  id?: string
  min_days: number
  max_days: number | null
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  label_en: string
  label_es: string
}

interface CarFormProps {
  car?: Car & { price_lists?: (PriceList & { price_list_discounts?: PriceListDiscount[] })[] }
}

export default function CarForm({ car }: CarFormProps) {
  const router = useRouter()
  const isEdit = !!car

  const activePL = car?.price_lists?.find(pl => pl.is_active && !pl.season_start) || car?.price_lists?.[0]

  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  // Car fields
  const [make, setMake] = useState(car?.make || '')
  const [model, setModel] = useState(car?.model || '')
  const [year, setYear] = useState(car?.year?.toString() || '')
  const [category, setCategory] = useState<'economy' | 'suv' | 'luxury'>(car?.category || 'economy')
  const [transmission, setTransmission] = useState<'auto' | 'manual'>(car?.transmission || 'auto')
  const [fuelType, setFuelType] = useState<'petrol' | 'diesel' | 'electric' | 'hybrid'>(car?.fuel_type || 'petrol')
  const [seats, setSeats] = useState(car?.seats?.toString() || '5')
  const [doors, setDoors] = useState(car?.doors?.toString() || '4')
  const [luggageSmall, setLuggageSmall] = useState(car?.luggage_small?.toString() || '2')
  const [luggageLarge, setLuggageLarge] = useState(car?.luggage_large?.toString() || '1')
  const [ac, setAc] = useState(car?.ac ?? true)
  const [bluetooth, setBluetooth] = useState(car?.bluetooth ?? true)
  const [gpsBuiltin, setGpsBuiltin] = useState(car?.gps_builtin ?? false)
  const [licensePlate, setLicensePlate] = useState(car?.license_plate || '')
  const [descEn, setDescEn] = useState(car?.description_en || '')
  const [descEs, setDescEs] = useState(car?.description_es || '')
  const [isActive, setIsActive] = useState(car?.is_active ?? true)
  const [isAvailable, setIsAvailable] = useState(car?.is_available ?? true)

  // Price list
  const [plName, setPlName] = useState(activePL?.name || 'Standard')
  const [dailyRate, setDailyRate] = useState(activePL?.daily_rate?.toString() || '')
  const [plId] = useState(activePL?.id || '')

  // Discounts
  const [discounts, setDiscounts] = useState<Discount[]>(
    activePL?.price_list_discounts?.map(d => ({
      id: d.id,
      min_days: d.min_days,
      max_days: d.max_days,
      discount_type: d.discount_type,
      discount_value: d.discount_value,
      label_en: d.label_en || '',
      label_es: d.label_es || '',
    })) || []
  )

  function addDiscount() {
    setDiscounts(prev => [...prev, {
      min_days: 3, max_days: null, discount_type: 'percentage', discount_value: 10,
      label_en: '3+ days', label_es: '3+ días'
    }])
  }

  function removeDiscount(i: number) {
    setDiscounts(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateDiscount(i: number, field: keyof Discount, value: string | number | null) {
    setDiscounts(prev => prev.map((d, idx) => idx === i ? { ...d, [field]: value } : d))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!make.trim() || !model.trim()) { setError('Make and model are required'); return }
    if (!dailyRate || isNaN(Number(dailyRate))) { setError('Daily rate is required'); return }

    setSaving(true)
    setError('')

    const payload = {
      make: make.trim(),
      model: model.trim(),
      year: year ? parseInt(year) : null,
      category,
      transmission,
      fuel_type: fuelType,
      seats: parseInt(seats),
      doors: parseInt(doors),
      luggage_small: parseInt(luggageSmall),
      luggage_large: parseInt(luggageLarge),
      ac,
      bluetooth,
      gps_builtin: gpsBuiltin,
      license_plate: licensePlate.trim() || null,
      description_en: descEn || null,
      description_es: descEs || null,
      is_active: isActive,
      is_available: isAvailable,
      priceList: { id: plId || undefined, name: plName, daily_rate: parseFloat(dailyRate), is_active: true },
      discounts: discounts.map(d => ({
        min_days: Number(d.min_days),
        max_days: d.max_days ? Number(d.max_days) : null,
        discount_type: d.discount_type,
        discount_value: Number(d.discount_value),
        label_en: d.label_en || null,
        label_es: d.label_es || null,
      })),
    }

    const url = isEdit ? `/api/admin/cars/${car!.id}` : '/api/admin/cars'
    const method = isEdit ? 'PUT' : 'POST'

    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const data = await res.json()

    setSaving(false)

    if (!res.ok) { setError(data.error || 'Something went wrong'); return }

    router.push('/admin/cars')
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm(`Delete ${car!.make} ${car!.model}? This cannot be undone.`)) return
    setDeleting(true)
    const res = await fetch(`/api/admin/cars/${car!.id}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/admin/cars')
      router.refresh()
    } else {
      setDeleting(false)
      setError('Failed to delete car')
    }
  }

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40 focus:border-[#C9A84C]"
  const selectCls = inputCls
  const labelCls = "block text-xs font-semibold text-gray-600 mb-1"

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <button type="button" onClick={() => router.push('/admin/cars')}
          className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-[#0A1F44]">{isEdit ? `Edit ${car!.make} ${car!.model}` : 'Add New Car'}</h1>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Basic Info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
        <h2 className="font-bold text-[#0A1F44] mb-4">Basic Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Make *</label>
            <input className={inputCls} value={make} onChange={e => setMake(e.target.value)} placeholder="e.g. Volkswagen" required />
          </div>
          <div>
            <label className={labelCls}>Model *</label>
            <input className={inputCls} value={model} onChange={e => setModel(e.target.value)} placeholder="e.g. Golf" required />
          </div>
          <div>
            <label className={labelCls}>Year</label>
            <input className={inputCls} type="number" value={year} onChange={e => setYear(e.target.value)} placeholder="e.g. 2023" min="2000" max="2030" />
          </div>
          <div>
            <label className={labelCls}>Category *</label>
            <select className={selectCls} value={category} onChange={e => setCategory(e.target.value as 'economy' | 'suv' | 'luxury')}>
              <option value="economy">Economy</option>
              <option value="suv">SUV</option>
              <option value="luxury">Luxury</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Transmission *</label>
            <select className={selectCls} value={transmission} onChange={e => setTransmission(e.target.value as 'auto' | 'manual')}>
              <option value="auto">Automatic</option>
              <option value="manual">Manual</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Fuel Type *</label>
            <select className={selectCls} value={fuelType} onChange={e => setFuelType(e.target.value as 'petrol' | 'diesel' | 'electric' | 'hybrid')}>
              <option value="petrol">Petrol</option>
              <option value="diesel">Diesel</option>
              <option value="electric">Electric</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>License Plate</label>
            <input className={inputCls} value={licensePlate} onChange={e => setLicensePlate(e.target.value)} placeholder="e.g. 1234 ABC" />
          </div>
          <div>
            <label className={labelCls}>Seats</label>
            <input className={inputCls} type="number" value={seats} onChange={e => setSeats(e.target.value)} min="2" max="9" />
          </div>
          <div>
            <label className={labelCls}>Doors</label>
            <input className={inputCls} type="number" value={doors} onChange={e => setDoors(e.target.value)} min="2" max="5" />
          </div>
          <div>
            <label className={labelCls}>Small Bags</label>
            <input className={inputCls} type="number" value={luggageSmall} onChange={e => setLuggageSmall(e.target.value)} min="0" max="10" />
          </div>
          <div>
            <label className={labelCls}>Large Bags</label>
            <input className={inputCls} type="number" value={luggageLarge} onChange={e => setLuggageLarge(e.target.value)} min="0" max="5" />
          </div>
        </div>

        {/* Features */}
        <div className="mt-4 flex gap-6">
          {[
            { label: 'Air Conditioning', val: ac, set: setAc },
            { label: 'Bluetooth', val: bluetooth, set: setBluetooth },
            { label: 'Built-in GPS', val: gpsBuiltin, set: setGpsBuiltin },
          ].map(({ label, val, set }) => (
            <label key={label} className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={val} onChange={e => set(e.target.checked)}
                className="w-4 h-4 accent-[#C9A84C]" />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
        <h2 className="font-bold text-[#0A1F44] mb-4">Description</h2>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className={labelCls}>English</label>
            <textarea className={`${inputCls} resize-none`} rows={3} value={descEn} onChange={e => setDescEn(e.target.value)}
              placeholder="Short description of the car..." />
          </div>
          <div>
            <label className={labelCls}>Spanish</label>
            <textarea className={`${inputCls} resize-none`} rows={3} value={descEs} onChange={e => setDescEs(e.target.value)}
              placeholder="Descripción breve del coche..." />
          </div>
        </div>
      </div>

      {/* Photos — only available after car is created */}
      {isEdit && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
          <h2 className="font-bold text-[#0A1F44] mb-4">Photos</h2>
          <CarImageUploader
            carId={car!.id}
            initialImages={car!.car_images?.map(img => ({
              id: img.id,
              url: img.url,
              is_primary: img.is_primary,
            })) || []}
          />
        </div>
      )}

      {!isEdit && (
        <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-5 mb-4 text-center">
          <p className="text-sm text-gray-400">Save the car first, then you can add photos.</p>
        </div>
      )}

      {/* Pricing */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
        <h2 className="font-bold text-[#0A1F44] mb-4">Pricing</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelCls}>Price List Name</label>
            <input className={inputCls} value={plName} onChange={e => setPlName(e.target.value)} placeholder="Standard" />
          </div>
          <div>
            <label className={labelCls}>Daily Rate (€) *</label>
            <input className={inputCls} type="number" step="0.01" value={dailyRate}
              onChange={e => setDailyRate(e.target.value)} placeholder="e.g. 65.00" required min="0" />
          </div>
        </div>

        {/* Discount tiers */}
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Discount Tiers</h3>
            <button type="button" onClick={addDiscount}
              className="flex items-center gap-1 text-xs text-[#C9A84C] hover:text-yellow-600 font-semibold">
              <Plus size={13} /> Add tier
            </button>
          </div>

          {discounts.length === 0 && (
            <p className="text-xs text-gray-400 italic">No discounts. Add a tier for multi-day bookings.</p>
          )}

          <div className="space-y-3">
            {discounts.map((d, i) => (
              <div key={i} className="grid grid-cols-6 gap-2 items-end bg-gray-50 rounded-xl p-3">
                <div>
                  <label className={labelCls}>Min days</label>
                  <input className={inputCls} type="number" value={d.min_days} min="1"
                    onChange={e => updateDiscount(i, 'min_days', parseInt(e.target.value))} />
                </div>
                <div>
                  <label className={labelCls}>Max days</label>
                  <input className={inputCls} type="number" value={d.max_days ?? ''} min="1"
                    placeholder="∞"
                    onChange={e => updateDiscount(i, 'max_days', e.target.value ? parseInt(e.target.value) : null)} />
                </div>
                <div>
                  <label className={labelCls}>Type</label>
                  <select className={selectCls} value={d.discount_type}
                    onChange={e => updateDiscount(i, 'discount_type', e.target.value)}>
                    <option value="percentage">%</option>
                    <option value="fixed">€ fixed</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Value</label>
                  <input className={inputCls} type="number" step="0.01" value={d.discount_value} min="0"
                    onChange={e => updateDiscount(i, 'discount_value', parseFloat(e.target.value))} />
                </div>
                <div>
                  <label className={labelCls}>Label (EN)</label>
                  <input className={inputCls} value={d.label_en}
                    onChange={e => updateDiscount(i, 'label_en', e.target.value)} placeholder="e.g. 3+ days" />
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className={labelCls}>Label (ES)</label>
                    <input className={inputCls} value={d.label_es}
                      onChange={e => updateDiscount(i, 'label_es', e.target.value)} placeholder="e.g. 3+ días" />
                  </div>
                  <button type="button" onClick={() => removeDiscount(i)}
                    className="text-red-400 hover:text-red-600 mb-0.5 shrink-0">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="font-bold text-[#0A1F44] mb-4">Status</h2>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)}
              className="w-4 h-4 accent-[#C9A84C]" />
            <span className="text-sm text-gray-700">Active <span className="text-gray-400">(visible on site)</span></span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={isAvailable} onChange={e => setIsAvailable(e.target.checked)}
              className="w-4 h-4 accent-[#C9A84C]" />
            <span className="text-sm text-gray-700">Available <span className="text-gray-400">(can be booked)</span></span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div>
          {isEdit && (
            <button type="button" onClick={handleDelete} disabled={deleting}
              className="flex items-center gap-2 text-red-500 hover:text-red-700 text-sm font-semibold transition-colors disabled:opacity-50">
              <Trash2 size={15} />
              {deleting ? 'Deleting…' : 'Delete Car'}
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => router.push('/admin/cars')}
            className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-[#C9A84C] hover:bg-yellow-400 text-[#0A1F44] px-6 py-2.5 rounded-xl font-bold text-sm transition-colors disabled:opacity-60 shadow-sm">
            <Save size={15} />
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Car'}
          </button>
        </div>
      </div>
    </form>
  )
}
