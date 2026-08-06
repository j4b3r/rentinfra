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
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0A1F44]">Testimonials</h1>
          <p className="mt-1 text-sm text-gray-500">
            Published reviews appear on the homepage. With none published, the homepage hides the
            section entirely.
          </p>
        </div>
        <Link
          href="/admin/testimonials/new"
          className="flex shrink-0 items-center gap-2 rounded-lg bg-[#C9A84C] px-4 py-2 text-sm font-semibold text-[#0A1F44] transition-colors hover:bg-yellow-400"
        >
          <Plus size={16} /> Add review
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Review</th>
              <th className="px-4 py-3 text-left">Rating</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id} className="border-t border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-[#0A1F44]">{t.author_name}</p>
                  <p className="text-xs text-gray-400">
                    {[t.author_country, t.car_label].filter(Boolean).join(' · ') || '—'}
                  </p>
                </td>
                <td className="max-w-md px-4 py-3 text-gray-600">
                  <span className="line-clamp-2">{t.quote}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1 text-[#C9A84C]">
                    <Star size={13} className="fill-[#C9A84C]" />
                    <span className="font-semibold text-[#0A1F44]">{t.rating}</span>
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
                    className="flex w-fit items-center gap-1 rounded border border-[#0A1F44] px-2 py-1 text-xs text-[#0A1F44] transition-colors hover:bg-[#0A1F44] hover:text-white"
                  >
                    <Edit size={12} /> Edit
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
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
