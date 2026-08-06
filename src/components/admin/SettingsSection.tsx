'use client'

import { useState } from 'react'
import { Save, Check, AlertCircle } from 'lucide-react'

export interface FieldDef {
  key: string
  label: string
  description?: string
  type?: 'text' | 'number' | 'email' | 'url' | 'time' | 'date' | 'textarea' | 'toggle'
  placeholder?: string
}

interface Props {
  title: string
  description?: string
  fields: FieldDef[]
  values: Record<string, string>
}

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40 focus:border-[#C9A84C] transition-colors"

export default function SettingsSection({ title, description, fields, values: initial }: Props) {
  const [values, setValues] = useState<Record<string, string>>(initial)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  function set(key: string, val: string) {
    setValues(v => ({ ...v, [key]: val }))
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    setSaving(false)
    if (!res.ok) { setError('Failed to save'); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-50">
        <h2 className="font-bold text-[#0A1F44]">{title}</h2>
        {description && <p className="text-sm text-gray-400 mt-0.5">{description}</p>}
      </div>

      {/* Fields */}
      <div className="px-6 py-5 space-y-5">
        {fields.map(f => (
          <div key={f.key}>
            <label className="block text-xs font-semibold text-gray-600 mb-1">{f.label}</label>

            {f.type === 'toggle' ? (
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <button
                  type="button"
                  onClick={() => set(f.key, values[f.key] === 'true' ? 'false' : 'true')}
                  className={`relative w-10 h-5.5 rounded-full transition-colors ${
                    values[f.key] === 'true' ? 'bg-[#C9A84C]' : 'bg-gray-200'
                  }`}
                  style={{ height: '22px', width: '40px' }}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    values[f.key] === 'true' ? 'translate-x-[18px]' : ''
                  }`} />
                </button>
                <span className="text-sm text-gray-600">{values[f.key] === 'true' ? 'Enabled' : 'Disabled'}</span>
              </label>
            ) : f.type === 'textarea' ? (
              <textarea
                className={`${inputCls} resize-none`}
                rows={3}
                value={values[f.key] || ''}
                onChange={e => set(f.key, e.target.value)}
                placeholder={f.placeholder}
              />
            ) : (
              <input
                type={f.type || 'text'}
                className={inputCls}
                value={values[f.key] || ''}
                onChange={e => set(f.key, e.target.value)}
                placeholder={f.placeholder}
              />
            )}

            {f.description && <p className="text-xs text-gray-400 mt-1">{f.description}</p>}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
        {error ? (
          <span className="flex items-center gap-1.5 text-xs text-red-600"><AlertCircle size={13} />{error}</span>
        ) : <span />}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#C9A84C] hover:bg-yellow-400 text-[#0A1F44] px-5 py-2 rounded-xl font-bold text-sm transition-colors disabled:opacity-60 shadow-sm"
        >
          {saved ? <><Check size={14} /> Saved!</> : saving ? 'Saving…' : <><Save size={14} /> Save Changes</>}
        </button>
      </div>
    </div>
  )
}
