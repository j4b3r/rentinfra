import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-guard'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { photoId } = await params
  const supabase = await createAdminClient()

  const { data: photo } = await supabase
    .from('booking_condition_photos')
    .select('storage_path')
    .eq('id', photoId)
    .single()

  if (!photo) return NextResponse.json({ error: 'Photo not found' }, { status: 404 })

  await supabase.storage.from('condition-photos').remove([photo.storage_path])
  await supabase.from('booking_condition_photos').delete().eq('id', photoId)

  return NextResponse.json({ success: true })
}
