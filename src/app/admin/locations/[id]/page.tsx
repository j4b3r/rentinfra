import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import LocationForm from '@/components/admin/LocationForm'

export default async function EditLocationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: location } = await supabase.from('locations').select('*').eq('id', id).single()
  if (!location) notFound()

  return <LocationForm location={location} />
}
