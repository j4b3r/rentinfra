'use client'

import { useState } from 'react'
import { Setting } from '@/types'
import { createClient } from '@/lib/supabase/client'

interface Props {
  settings: Setting[]
}

const SETTING_GROUPS: { title: string; keys: string[] }[] = [
  {
    title: 'Rental Rules',
    keys: ['min_driver_age', 'min_license_years', 'young_driver_surcharge_per_day', 'second_driver_fee'],
  },
  {
    title: 'Pricing',
    keys: ['deposit_percentage', 'tax_rate', 'currency'],
  },
  {
    title: 'Office Hours',
    keys: ['office_hours_open', 'office_hours_close', 'after_hours_fee'],
  },
  {
    title: 'Company Info',
    keys: ['company_phone', 'company_email', 'company_address'],
  },
]

export default function SettingsForm({ settings }: Props) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(settings.map(s => [s.key, s.value]))
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()

    for (const [key, value] of Object.entries(values)) {
      await supabase.from('settings').update({ value, updated_at: new Date().toISOString() }).eq('key', key)
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function getLabel(key: string) {
    return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  }

  function getDescription(s: Setting) {
    return settings.find(setting => setting.key === s.key)?.description || ''
  }

  return (
    <div className="space-y-6">
      {SETTING_GROUPS.map(group => (
        <div key={group.title} className="op-panel p-6">
          <h2 className="font-bold text-[var(--ink)] mb-4">{group.title}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {group.keys.map(key => {
              const setting = settings.find(s => s.key === key)
              if (!setting) return null
              return (
                <div key={key}>
                  <label className="block text-sm font-medium text-[var(--ink)] mb-1">{getLabel(key)}</label>
                  {key === 'company_address' ? (
                    <textarea
                      value={values[key] || ''}
                      onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))}
                      rows={3}
                      className="w-full border-2 border-[var(--bar)] px-3 py-2 text-sm focus:outline-2 focus:outline-[var(--pane-signal)] focus:outline-offset-[-2px]"
                    />
                  ) : (
                    <input
                      type={setting.type === 'number' ? 'number' : 'text'}
                      value={values[key] || ''}
                      onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))}
                      className="w-full border-2 border-[var(--bar)] px-3 py-2 text-sm focus:outline-2 focus:outline-[var(--pane-signal)] focus:outline-offset-[-2px]"
                    />
                  )}
                  {getDescription(setting) && (
                    <p className="text-xs text-[var(--ink-soft)] mt-1">{getDescription(setting)}</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-[var(--pane-signal)] text-[var(--ink)] px-8 py-3 rounded-lg font-bold hover:bg-[var(--pane-signal-deep)] transition-colors disabled:opacity-60"
      >
        {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Settings'}
      </button>
    </div>
  )
}
