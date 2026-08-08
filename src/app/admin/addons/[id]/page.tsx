import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import AddonForm from '@/components/admin/AddonForm'

export default async function EditAddonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: addon } = await supabase.from('addons').select('*').eq('id', id).single()
  if (!addon) notFound()

  return <AddonForm addon={addon} />
}
