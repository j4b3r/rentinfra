import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import CarForm from '@/components/admin/CarForm'
import { Car, PriceList, PriceListDiscount } from '@/types'

export default async function EditCarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: car } = await supabase
    .from('cars')
    .select('*, price_lists(*, price_list_discounts(*))')
    .eq('id', id)
    .single()

  if (!car) notFound()

  return <CarForm car={car as Car & { price_lists: (PriceList & { price_list_discounts: PriceListDiscount[] })[] }} />
}
