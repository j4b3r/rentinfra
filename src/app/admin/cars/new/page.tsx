import { createClient } from '@/lib/supabase/server'
import CarForm from '@/components/admin/CarForm'

export default async function NewCarPage() {
  const supabase = await createClient()
  const { data: locations } = await supabase
    .from('locations')
    .select('id, name_en')
    .eq('is_active', true)
    .order('name_en')

  return <CarForm locations={locations || []} />
}
