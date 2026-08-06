import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import TestimonialForm, { TestimonialRecord } from '@/components/admin/TestimonialForm'

export default async function EditTestimonial({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: testimonial }, { data: cars }] = await Promise.all([
    supabase.from('testimonials').select('*').eq('id', id).single(),
    supabase.from('cars').select('id, make, model').eq('is_active', true).order('make'),
  ])

  if (!testimonial) notFound()

  return (
    <div>
      <Link
        href="/admin/testimonials"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0A1F44]"
      >
        <ArrowLeft size={14} /> Back to testimonials
      </Link>
      <h1 className="mb-6 text-2xl font-bold text-[#0A1F44]">Edit review</h1>
      <TestimonialForm testimonial={testimonial as TestimonialRecord} cars={cars || []} />
    </div>
  )
}
