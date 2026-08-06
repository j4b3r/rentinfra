import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createAdminClient()
  const { id } = await params
  const body = await req.json()
  const { priceList, discounts, ...carData } = body

  const { data: car, error } = await supabase
    .from('cars')
    .update(carData)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Update or create price list
  if (priceList) {
    if (priceList.id) {
      // Update existing
      await supabase
        .from('price_lists')
        .update({ name: priceList.name, daily_rate: priceList.daily_rate, is_active: priceList.is_active })
        .eq('id', priceList.id)

      // Replace discounts: delete old, insert new
      if (discounts !== undefined) {
        await supabase.from('price_list_discounts').delete().eq('price_list_id', priceList.id)
        if (discounts.length > 0) {
          await supabase.from('price_list_discounts').insert(
            discounts.map((d: {
              min_days: number; max_days?: number;
              discount_type: string; discount_value: number;
              label_en?: string; label_es?: string
            }) => ({ ...d, price_list_id: priceList.id }))
          )
        }
      }
    } else if (priceList.daily_rate) {
      // Create new price list
      const { data: pl } = await supabase
        .from('price_lists')
        .insert({ car_id: id, name: priceList.name || 'Standard', daily_rate: priceList.daily_rate, is_active: true })
        .select().single()

      if (pl && discounts?.length > 0) {
        await supabase.from('price_list_discounts').insert(
          discounts.map((d: {
            min_days: number; max_days?: number;
            discount_type: string; discount_value: number;
            label_en?: string; label_es?: string
          }) => ({ ...d, price_list_id: pl.id }))
        )
      }
    }
  }

  return NextResponse.json({ car })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createAdminClient()
  const { id } = await params

  const { error } = await supabase.from('cars').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ success: true })
}
