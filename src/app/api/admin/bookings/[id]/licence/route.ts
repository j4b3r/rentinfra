import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-guard'

const SIGNED_URL_TTL = 60 * 10 // 10 minutes — same as condition photos

/**
 * Licence photos live in a private bucket. Every read mints a short-lived
 * signed URL here — never a stored public URL — same pattern as
 * condition-photos, since this is also a private-document read.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id: bookingId } = await params
  const supabase = await createAdminClient()

  const [{ data: photos, error }, { data: booking }] = await Promise.all([
    supabase
      .from('booking_licence_documents')
      .select('id, side, storage_path, created_at')
      .eq('booking_id', bookingId)
      .order('side'),
    supabase
      .from('bookings')
      .select('guest_license, licence_verified_at, licence_rejection_reason')
      .eq('id', bookingId)
      .single(),
  ])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const withUrls = await Promise.all(
    (photos || []).map(async p => {
      const { data } = await supabase.storage
        .from('licence-documents')
        .createSignedUrl(p.storage_path, SIGNED_URL_TTL)
      return { ...p, url: data?.signedUrl ?? null }
    })
  )

  return NextResponse.json({ photos: withUrls, booking })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id: bookingId } = await params
  const supabase = await createAdminClient()

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const side = formData.get('side') as string | null

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (side !== 'front' && side !== 'back') {
    return NextResponse.json({ error: 'side must be front or back' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const allowed = ['jpg', 'jpeg', 'png', 'webp']
  if (!allowed.includes(ext)) {
    return NextResponse.json({ error: 'Only JPG, PNG, WEBP allowed' }, { status: 400 })
  }

  // Uploading a replacement resets verification — staff must re-check
  // against the new image rather than a stale approval silently carrying
  // over to a different photo.
  const fileName = `${bookingId}/${side}-${Date.now()}.${ext}`
  const buffer = await file.arrayBuffer()

  const { error: uploadError } = await supabase.storage
    .from('licence-documents')
    .upload(fileName, buffer, { contentType: file.type, upsert: false })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: photo, error: dbError } = await supabase
    .from('booking_licence_documents')
    .insert({
      booking_id: bookingId,
      side,
      storage_path: fileName,
      created_by: user?.id ?? null,
    })
    .select()
    .single()

  if (dbError) {
    await supabase.storage.from('licence-documents').remove([fileName])
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  await supabase
    .from('bookings')
    .update({ licence_verified_at: null, licence_rejection_reason: null })
    .eq('id', bookingId)

  const { data: signed } = await supabase.storage
    .from('licence-documents')
    .createSignedUrl(fileName, SIGNED_URL_TTL)

  return NextResponse.json({ photo: { ...photo, url: signed?.signedUrl ?? null } })
}
