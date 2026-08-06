import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-guard'

export async function POST(req: NextRequest) {
  const denied = await requireAdmin()
  if (denied) return denied

  const supabase = await createAdminClient()
  const body = await req.json()

  const { priceList, discounts, ...carData } = body

  // Generate slug from make + model + year
  const slugBase = `${carData.make}-${carData.model}${carData.year ? `-${carData.year}` : ''}`
    .toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  // Ensure unique slug
  const { data: existing } = await supabase
    .from('cars')
    .select('slug')
    .ilike('slug', `${slugBase}%`)

  let slug = slugBase
  if (existing && existing.length > 0) {
    slug = `${slugBase}-${existing.length + 1}`
  }

  const { data: car, error } = await supabase
    .from('cars')
    .insert({ ...carData, slug })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Create price list if provided
  if (priceList && priceList.daily_rate) {
    const { data: pl, error: plErr } = await supabase
      .from('price_lists')
      .insert({
        car_id: car.id,
        name: priceList.name || 'Standard',
        daily_rate: priceList.daily_rate,
        is_active: true,
      })
      .select()
      .single()

    if (!plErr && pl && discounts?.length > 0) {
      await supabase.from('price_list_discounts').insert(
        discounts.map((d: {
          min_days: number; max_days?: number;
          discount_type: string; discount_value: number;
          label_en?: string; label_es?: string
        }) => ({ ...d, price_list_id: pl.id }))
      )
    }
  }

  return NextResponse.json({ car })
}
