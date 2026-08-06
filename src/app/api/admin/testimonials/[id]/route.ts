import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-guard'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin()
  if (denied) return denied

  const supabase = await createAdminClient()
  const { id } = await params
  const body = await req.json()

  const { data, error } = await supabase
    .from('testimonials')
    .update({
      author_name: body.author_name,
      author_country: body.author_country || null,
      author_country_emoji: body.author_country_emoji || null,
      rating: Number(body.rating) || 5,
      quote: body.quote,
      car_id: body.car_id || null,
      car_label: body.car_label || null,
      is_published: Boolean(body.is_published),
      position: Number(body.position) || 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ testimonial: data })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin()
  if (denied) return denied

  const supabase = await createAdminClient()
  const { id } = await params

  const { error } = await supabase.from('testimonials').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
