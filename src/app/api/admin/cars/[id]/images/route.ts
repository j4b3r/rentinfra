import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-guard'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id: carId } = await params
  const supabase = await createAdminClient()

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const allowed = ['jpg', 'jpeg', 'png', 'webp']
  if (!allowed.includes(ext)) return NextResponse.json({ error: 'Only JPG, PNG, WEBP allowed' }, { status: 400 })

  const fileName = `${carId}/${Date.now()}.${ext}`
  const buffer = await file.arrayBuffer()

  const { error: uploadError } = await supabase.storage
    .from('car-images')
    .upload(fileName, buffer, { contentType: file.type, upsert: false })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from('car-images').getPublicUrl(fileName)

  // Check if this is the first image (make it primary)
  const { count } = await supabase
    .from('car_images')
    .select('*', { count: 'exact', head: true })
    .eq('car_id', carId)

  const isPrimary = count === 0

  const { data: image, error: dbError } = await supabase
    .from('car_images')
    .insert({ car_id: carId, url: publicUrl, storage_path: fileName, position: count || 0, is_primary: isPrimary })
    .select()
    .single()

  if (dbError) {
    // Clean up uploaded file if DB insert fails
    await supabase.storage.from('car-images').remove([fileName])
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ image })
}
