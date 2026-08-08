import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-guard'

const SIGNED_URL_TTL = 60 * 10 // 10 minutes — just long enough to render the panel

/**
 * Condition photos live in a private bucket (unlike car-images), so unlike
 * that uploader this never stores or returns a public URL — every read
 * mints a short-lived signed URL here, at request time.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id: bookingId } = await params
  const supabase = await createAdminClient()

  const { data: photos, error } = await supabase
    .from('booking_condition_photos')
    .select('id, phase, storage_path, caption, position, created_at')
    .eq('booking_id', bookingId)
    .order('phase')
    .order('position')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const withUrls = await Promise.all(
    (photos || []).map(async p => {
      const { data } = await supabase.storage
        .from('condition-photos')
        .createSignedUrl(p.storage_path, SIGNED_URL_TTL)
      return { ...p, url: data?.signedUrl ?? null }
    })
  )

  return NextResponse.json({ photos: withUrls })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id: bookingId } = await params
  const supabase = await createAdminClient()

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const phase = formData.get('phase') as string | null
  const caption = (formData.get('caption') as string | null) || null

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (phase !== 'pickup' && phase !== 'return') {
    return NextResponse.json({ error: 'phase must be pickup or return' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const allowed = ['jpg', 'jpeg', 'png', 'webp']
  if (!allowed.includes(ext)) {
    return NextResponse.json({ error: 'Only JPG, PNG, WEBP allowed' }, { status: 400 })
  }

  const fileName = `${bookingId}/${phase}/${Date.now()}.${ext}`
  const buffer = await file.arrayBuffer()

  const { error: uploadError } = await supabase.storage
    .from('condition-photos')
    .upload(fileName, buffer, { contentType: file.type, upsert: false })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { count } = await supabase
    .from('booking_condition_photos')
    .select('*', { count: 'exact', head: true })
    .eq('booking_id', bookingId)
    .eq('phase', phase)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: photo, error: dbError } = await supabase
    .from('booking_condition_photos')
    .insert({
      booking_id: bookingId,
      phase,
      storage_path: fileName,
      caption,
      position: count || 0,
      created_by: user?.id ?? null,
    })
    .select()
    .single()

  if (dbError) {
    await supabase.storage.from('condition-photos').remove([fileName])
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  const { data: signed } = await supabase.storage
    .from('condition-photos')
    .createSignedUrl(fileName, SIGNED_URL_TTL)

  return NextResponse.json({ photo: { ...photo, url: signed?.signedUrl ?? null } })
}
