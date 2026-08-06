import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import TestimonialForm from '@/components/admin/TestimonialForm'

export default async function NewTestimonial() {
  const supabase = await createClient()
  const { data: cars } = await supabase
    .from('cars')
    .select('id, make, model')
    .eq('is_active', true)
    .order('make')

  return (
    <div>
      <Link
        href="/admin/testimonials"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0A1F44]"
      >
        <ArrowLeft size={14} /> Back to testimonials
      </Link>
      <h1 className="mb-6 text-2xl font-bold text-[#0A1F44]">Add review</h1>
      <TestimonialForm cars={cars || []} />
    </div>
  )
}
