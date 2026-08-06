import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-guard'

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id: carId, imageId } = await params
  const supabase = await createAdminClient()

  // Clear existing primary
  await supabase.from('car_images').update({ is_primary: false }).eq('car_id', carId)
  // Set new primary
  const { error } = await supabase.from('car_images').update({ is_primary: true }).eq('id', imageId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { imageId } = await params
  const supabase = await createAdminClient()

  // Get image record to find storage path
  const { data: image } = await supabase
    .from('car_images')
    .select('storage_path, is_primary, car_id')
    .eq('id', imageId)
    .single()

  if (!image) return NextResponse.json({ error: 'Image not found' }, { status: 404 })

  // Delete from storage
  if (image.storage_path) {
    await supabase.storage.from('car-images').remove([image.storage_path])
  }

  // Delete DB record
  await supabase.from('car_images').delete().eq('id', imageId)

  // If deleted image was primary, promote the next image
  if (image.is_primary) {
    const { data: remaining } = await supabase
      .from('car_images')
      .select('id')
      .eq('car_id', image.car_id)
      .order('position')
      .limit(1)

    if (remaining?.[0]) {
      await supabase.from('car_images').update({ is_primary: true }).eq('id', remaining[0].id)
    }
  }

  return NextResponse.json({ success: true })
}
