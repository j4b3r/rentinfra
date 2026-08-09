'use client'

import { useState } from 'react'
import { Check, AlertCircle, Loader2, Save } from 'lucide-react'

/** Sent back for a secret field the admin did not retype. */
const UNCHANGED = '__UNCHANGED__'

export interface IntegrationField {
  key: string
  label: string
  description?: string
  /** Credential: shown masked, only overwritten when retyped */
  secret?: boolean
  type?: 'text' | 'toggle'
  placeholder?: string
}

export interface IntegrationGroup {
  provider: 'resend' | 'stripe' | 'twilio'
  title: string
  blurb: string
  docsUrl: string
  fields: IntegrationField[]
}

interface Props {
  groups: IntegrationGroup[]
  /** Public values, plus masked previews for secrets that are already set. */
  values: Record<string, string>
  /** Which secret keys currently hold a value. */
  configured: Record<string, boolean>
}

export default function IntegrationsForm({ groups, values: initial, configured }: Props) {
  // Secrets start as the sentinel so an untouched field never overwrites the
  // stored key. Everything else starts at its real value.
  const [values, setValues] = useState<Record<string, string>>(() => {
    const start: Record<string, string> = { ...initial }
    for (const g of groups) {
      for (const f of g.fields) {
        if (f.secret && configured[f.key]) start[f.key] = UNCHANGED
      }
    }
    return start
  })

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [testing, setTesting] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<Record<string, { ok: boolean; message: string }>>({})

  function set(key: string, val: string) {
    setValues(v => ({ ...v, [key]: val }))
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    const res = await fetch('/api/admin/integrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    setSaving(false)

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error || 'Could not save. Check the values and try again.')
      return
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function handleTest(provider: string) {
    setTesting(provider)
    setTestResult(r => ({ ...r, [provider]: { ok: false, message: '' } }))

    // Save first so the test checks what is actually stored.
    await fetch('/api/admin/integrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })

    const res = await fetch('/api/admin/integrations/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider }),
    })
    const body = await res.json().catch(() => ({ ok: false, message: 'Test failed.' }))
    setTesting(null)
    setTestResult(r => ({ ...r, [provider]: body }))
  }

  const inputCls =
    'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono outline-none transition focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/40'

  return (
    <div className="max-w-3xl space-y-6">
      {groups.map(group => {
        const result = testResult[group.provider]
        return (
          <section key={group.provider} className="rounded-xl border border-gray-100 bg-white p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#0A1F44]">{group.title}</h2>
                <p className="mt-1 text-sm text-gray-500">{group.blurb}</p>
              </div>
              <a
                href={group.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-xs font-semibold text-[#C9A84C] hover:underline"
              >
                Get keys →
              </a>
            </div>

            <div className="space-y-4">
              {group.fields.map(f => (
                <div key={f.key}>
                  <label htmlFor={f.key} className="mb-1 block text-sm font-medium text-gray-700">
                    {f.label}
                    {f.secret && configured[f.key] && (
                      <span className="ml-2 text-xs font-normal text-green-600">
                        saved ({initial[f.key]})
                      </span>
                    )}
                  </label>

                  {f.type === 'toggle' ? (
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={values[f.key] === 'true'}
                        onChange={e => set(f.key, e.target.checked ? 'true' : 'false')}
                        className="h-4 w-4 accent-[#0A1F44]"
                      />
                      <span className="text-sm text-gray-600">{f.description}</span>
                    </label>
                  ) : (
                    <>
                      <input
                        id={f.key}
                        type="text"
                        autoComplete="off"
                        spellCheck={false}
                        value={values[f.key] === UNCHANGED ? '' : values[f.key] ?? ''}
                        placeholder={
                          f.secret && configured[f.key]
                            ? 'Leave blank to keep the saved key'
                            : f.placeholder
                        }
                        onChange={e => set(f.key, e.target.value)}
                        className={inputCls}
                      />
                      {f.description && (
                        <p className="mt-1 text-xs text-gray-500">{f.description}</p>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => handleTest(group.provider)}
                disabled={testing === group.provider}
                className="flex items-center gap-2 rounded-lg border border-[#0A1F44] px-4 py-2 text-sm font-semibold text-[#0A1F44] transition hover:bg-[#0A1F44] hover:text-white disabled:opacity-60"
              >
                {testing === group.provider ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Testing…
                  </>
                ) : (
                  'Test connection'
                )}
              </button>

              {result?.message && (
                <span
                  className={`flex items-center gap-1.5 text-sm ${
                    result.ok ? 'text-green-700' : 'text-red-600'
                  }`}
                >
                  {result.ok ? <Check size={14} /> : <AlertCircle size={14} />}
                  {result.message}
                </span>
              )}
            </div>
          </section>
        )
      })}

      {error && (
        <p className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={15} /> {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-[#C9A84C] px-5 py-2.5 text-sm font-bold text-[#0A1F44] transition hover:bg-yellow-400 disabled:opacity-60"
        >
          <Save size={15} />
          {saving ? 'Saving…' : 'Save integrations'}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-green-700">
            <Check size={15} /> Saved
          </span>
        )}
      </div>
    </div>
  )
}
