import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Edit, Star } from 'lucide-react'

interface TestimonialRow {
  id: string
  author_name: string
  author_country: string | null
  rating: number
  quote: string
  car_label: string | null
  is_published: boolean
  position: number
}

export default async function AdminTestimonials() {
  const supabase = await createClient()
  const { data: testimonials } = await supabase
    .from('testimonials')
    .select('*')
    .order('position')
    .order('created_at')

  const rows = (testimonials || []) as TestimonialRow[]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--ink)]">Testimonials</h1>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            Published reviews appear on the homepage. With none published, the homepage hides the
            section entirely.
          </p>
        </div>
        <Link
          href="/admin/testimonials/new"
          className="btn-signal flex shrink-0 items-center gap-2 px-4 py-2 text-sm font-bold"
        >
          <Plus size={16} /> Add review
        </Link>
      </div>

      <div className="op-panel overflow-hidden">
        <table className="op-table w-full text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-[var(--ink-soft)]">
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Review</th>
              <th className="px-4 py-3 text-left">Rating</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-[var(--ink)]">{t.author_name}</p>
                  <p className="text-xs text-[var(--ink-soft)]">
                    {[t.author_country, t.car_label].filter(Boolean).join(' · ') || '—'}
                  </p>
                </td>
                <td className="max-w-md px-4 py-3 text-[var(--ink-soft)]">
                  <span className="line-clamp-2">{t.quote}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1 text-[var(--pane-signal)]">
                    <Star size={13} className="fill-[var(--pane-signal)]" />
                    <span className="font-semibold text-[var(--ink)]">{t.rating}</span>
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      t.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {t.is_published ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/testimonials/${t.id}`}
                    className="btn-frame flex w-fit items-center gap-1 px-2 py-1 text-xs"
                  >
                    <Edit size={12} /> Edit
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[var(--ink-soft)]">
                  No reviews yet. Add your first one to show social proof on the homepage.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
