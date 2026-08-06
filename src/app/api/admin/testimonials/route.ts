import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createAdminClient()
  const body = await req.json()

  const { data, error } = await supabase
    .from('testimonials')
    .insert({
      author_name: body.author_name,
      author_country: body.author_country || null,
      author_country_emoji: body.author_country_emoji || null,
      rating: Number(body.rating) || 5,
      quote: body.quote,
      car_id: body.car_id || null,
      car_label: body.car_label || null,
      is_published: Boolean(body.is_published),
      position: Number(body.position) || 0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ testimonial: data })
}
