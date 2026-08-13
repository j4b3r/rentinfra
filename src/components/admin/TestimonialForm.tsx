'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Trash2 } from 'lucide-react'

export interface TestimonialRecord {
  id?: string
  author_name: string
  author_country: string | null
  author_country_emoji: string | null
  rating: number
  quote: string
  car_id: string | null
  car_label: string | null
  is_published: boolean
  position: number
}

interface TestimonialFormProps {
  testimonial?: TestimonialRecord
  cars: { id: string; make: string; model: string }[]
}

const emptyTestimonial: TestimonialRecord = {
  author_name: '',
  author_country: '',
  author_country_emoji: '',
  rating: 5,
  quote: '',
  car_id: null,
  car_label: '',
  is_published: false,
  position: 0,
}

export default function TestimonialForm({ testimonial, cars }: TestimonialFormProps) {
  const router = useRouter()
  const isEdit = Boolean(testimonial?.id)
  const [form, setForm] = useState<TestimonialRecord>(testimonial ?? emptyTestimonial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function set<K extends keyof TestimonialRecord>(key: K, value: TestimonialRecord[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    // Store a readable car label so the quote survives the car being deleted.
    const car = cars.find((c) => c.id === form.car_id)
    const payload = { ...form, car_label: car ? `${car.make} ${car.model}` : null }

    const res = await fetch(
      isEdit ? `/api/admin/testimonials/${testimonial!.id}` : '/api/admin/testimonials',
      {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    )

    setSaving(false)

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error || 'Could not save this review. Check the fields and try again.')
      return
    }

    router.push('/admin/testimonials')
    router.refresh()
  }

  async function handleDelete() {
    setSaving(true)
    const res = await fetch(`/api/admin/testimonials/${testimonial!.id}`, { method: 'DELETE' })
    setSaving(false)

    if (!res.ok) {
      setError('Could not delete this review.')
      return
    }
    router.push('/admin/testimonials')
    router.refresh()
  }

  const field =
    'w-full border-2 border-[var(--bar)] px-3 py-2 text-sm outline-none focus:border-[var(--bar)] focus:outline-2 focus:outline-[var(--pane-signal)] focus:outline-offset-[-2px]'
  const label = 'block text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)] mb-1.5'

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="rounded-xl border border-gray-100 bg-white p-6 space-y-5">
        <div>
          <label htmlFor="quote" className={label}>
            Review
          </label>
          <textarea
            id="quote"
            required
            rows={4}
            value={form.quote}
            onChange={(e) => set('quote', e.target.value)}
            className={field}
            placeholder="What the customer wrote about their rental."
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="author_name" className={label}>
              Customer name
            </label>
            <input
              id="author_name"
              required
              value={form.author_name}
              onChange={(e) => set('author_name', e.target.value)}
              className={field}
              placeholder="Alex T."
            />
          </div>

          <div>
            <label htmlFor="rating" className={label}>
              Rating
            </label>
            <select
              id="rating"
              value={form.rating}
              onChange={(e) => set('rating', Number(e.target.value))}
              className={field}
            >
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>
                  {r} star{r !== 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="author_country" className={label}>
              Country <span className="font-normal normal-case text-[var(--ink-soft)]">(optional)</span>
            </label>
            <input
              id="author_country"
              value={form.author_country ?? ''}
              onChange={(e) => set('author_country', e.target.value)}
              className={field}
              placeholder="United Kingdom"
            />
          </div>

          <div>
            <label htmlFor="author_country_emoji" className={label}>
              Flag <span className="font-normal normal-case text-[var(--ink-soft)]">(optional)</span>
            </label>
            <input
              id="author_country_emoji"
              value={form.author_country_emoji ?? ''}
              onChange={(e) => set('author_country_emoji', e.target.value)}
              className={field}
              placeholder="🇬🇧"
            />
          </div>

          <div>
            <label htmlFor="car_id" className={label}>
              Car rented <span className="font-normal normal-case text-[var(--ink-soft)]">(optional)</span>
            </label>
            <select
              id="car_id"
              value={form.car_id ?? ''}
              onChange={(e) => set('car_id', e.target.value || null)}
              className={field}
            >
              <option value="">Not specified</option>
              {cars.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.make} {c.model}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="position" className={label}>
              Sort order
            </label>
            <input
              id="position"
              type="number"
              value={form.position}
              onChange={(e) => set('position', Number(e.target.value))}
              className={field}
            />
          </div>
        </div>

        <label className="flex items-start gap-3 rounded-lg bg-gray-50 p-4">
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={(e) => set('is_published', e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[var(--bar)]"
          />
          <span className="text-sm">
            <span className="font-semibold text-[var(--ink)]">Show on the homepage</span>
            <span className="mt-0.5 block text-xs text-[var(--ink-soft)]">
              Unpublished reviews stay in this list but never appear on the public site.
            </span>
          </span>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[var(--pane-signal)] px-5 py-2.5 text-sm font-bold text-[var(--ink)] transition hover:bg-[var(--pane-signal-deep)] disabled:opacity-60"
        >
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add review'}
        </button>

        {isEdit && !confirmDelete && (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
          >
            <Trash2 size={14} /> Delete
          </button>
        )}

        {isEdit && confirmDelete && (
          <span className="flex items-center gap-2 text-sm">
            <span className="text-[var(--ink-soft)]">Delete this review permanently?</span>
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
            >
              Yes, delete
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="border-2 border-[var(--bar)] px-3 py-2 text-xs font-semibold text-[var(--ink-soft)] hover:bg-gray-50"
            >
              Keep
            </button>
          </span>
        )}
      </div>
    </form>
  )
}
