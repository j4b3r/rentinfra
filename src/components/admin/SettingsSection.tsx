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

const inputCls = "w-full border-2 border-[var(--bar)] bg-[var(--glass-clear)] px-3 py-2 text-sm text-[var(--ink)] outline-none transition focus:bg-white focus:outline-2 focus:outline-[var(--pane-signal)] focus:outline-offset-[-2px]"

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
    <div className="op-panel overflow-hidden">
      {/* Header */}
      <div className="op-panel-header px-6 py-5">
        <h2 className="font-bold text-[var(--ink)]">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-[var(--ink-soft)]">{description}</p>}
      </div>

      {/* Fields */}
      <div className="space-y-5 px-6 py-5">
        {fields.map(f => (
          <div key={f.key}>
            <label className="mb-1 block text-xs font-semibold text-[var(--ink-soft)]">{f.label}</label>

            {f.type === 'toggle' ? (
              <label className="flex cursor-pointer select-none items-center gap-3">
                <button
                  type="button"
                  onClick={() => set(f.key, values[f.key] === 'true' ? 'false' : 'true')}
                  className="relative transition-colors"
                  style={{
                    height: '22px',
                    width: '40px',
                    background: values[f.key] === 'true' ? 'var(--pane-signal)' : '#d1d5db',
                  }}
                >
                  <span className={`absolute left-0.5 top-0.5 h-4 w-4 bg-white transition-transform ${
                    values[f.key] === 'true' ? 'translate-x-[18px]' : ''
                  }`} />
                </button>
                <span className="text-sm text-[var(--ink-soft)]">{values[f.key] === 'true' ? 'Enabled' : 'Disabled'}</span>
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

            {f.description && <p className="mt-1 text-xs text-[var(--ink-soft)]">{f.description}</p>}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t-2 border-[var(--bar)] bg-[var(--glass-paper)] px-6 py-4">
        {error ? (
          <span className="flex items-center gap-1.5 text-xs text-red-600"><AlertCircle size={13} />{error}</span>
        ) : <span />}
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-signal flex items-center gap-2 px-5 py-2 text-sm font-bold disabled:opacity-60"
        >
          {saved ? <><Check size={14} /> Saved!</> : saving ? 'Saving…' : <><Save size={14} /> Save Changes</>}
        </button>
      </div>
    </div>
  )
}
