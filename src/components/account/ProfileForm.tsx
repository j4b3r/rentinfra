'use client'

import { useState } from 'react'
import { Loader2, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface ProfileFields {
  full_name: string
  phone: string
  nationality: string
  license_number: string
}

/**
 * Writes straight through the browser Supabase client: `profiles_own` is
 * `FOR ALL USING (auth.uid() = id)`, so this needs no API route.
 */
export default function ProfileForm({ userId, initial }: { userId: string; initial: ProfileFields }) {
  const [fields, setFields] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  function set<K extends keyof ProfileFields>(key: K, value: string) {
    setFields(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  async function save() {
    setSaving(true)
    setError('')
    const supabase = createClient()

    const { error: err } = await supabase
      .from('profiles')
      .update({
        full_name: fields.full_name || null,
        phone: fields.phone || null,
        nationality: fields.nationality || null,
        license_number: fields.license_number || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    setSaving(false)
    if (err) {
      setError('Could not save your details.')
      return
    }
    setSaved(true)
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">Full name</label>
        <input
          value={fields.full_name}
          onChange={e => set('full_name', e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#0A1F44] focus:ring-2 focus:ring-[#0A1F44]/15"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">Phone</label>
        <input
          value={fields.phone}
          onChange={e => set('phone', e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#0A1F44] focus:ring-2 focus:ring-[#0A1F44]/15"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">Nationality</label>
        <input
          value={fields.nationality}
          onChange={e => set('nationality', e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#0A1F44] focus:ring-2 focus:ring-[#0A1F44]/15"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">Driving licence number</label>
        <input
          value={fields.license_number}
          onChange={e => set('license_number', e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#0A1F44] focus:ring-2 focus:ring-[#0A1F44]/15"
        />
      </div>

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#0A1F44] py-2.5 text-sm font-semibold text-white transition hover:bg-[#0A1F44]/90 disabled:opacity-60"
      >
        {saving ? (
          <Loader2 size={14} className="animate-spin" />
        ) : saved ? (
          <>
            <Check size={14} /> Saved
          </>
        ) : (
          'Save changes'
        )}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
