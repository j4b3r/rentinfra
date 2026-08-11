import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-guard'

const SIGNED_URL_TTL = 60 * 10 // 10 minutes — same as licence documents / condition photos

const ROLES = ['client', 'company'] as const
const STAGES = ['contract', 'delivery', 'return'] as const

/**
 * Signatures live in a private bucket. Every read mints a short-lived signed
 * URL here — never a stored public URL — same pattern as licence documents
 * and condition photos.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id: bookingId } = await params
  const supabase = await createAdminClient()

  const { data: signatures, error } = await supabase
    .from('booking_signatures')
    .select('id, role, stage, storage_path, signed_at')
    .eq('booking_id', bookingId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const withUrls = await Promise.all(
    (signatures || []).map(async s => {
      const { data } = await supabase.storage
        .from('signatures')
        .createSignedUrl(s.storage_path, SIGNED_URL_TTL)
      return { ...s, url: data?.signedUrl ?? null }
    })
  )

  return NextResponse.json({ signatures: withUrls })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id: bookingId } = await params
  const supabase = await createAdminClient()

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const role = formData.get('role') as string | null
  const stage = formData.get('stage') as string | null

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (!ROLES.includes(role as (typeof ROLES)[number])) {
    return NextResponse.json({ error: 'role must be client or company' }, { status: 400 })
  }
  if (!STAGES.includes(stage as (typeof STAGES)[number])) {
    return NextResponse.json({ error: 'stage must be contract, delivery or return' }, { status: 400 })
  }

  // Re-signing the same (booking, role, stage) replaces the prior image —
  // remove the old storage object first so we don't leak orphaned files.
  const { data: existing } = await supabase
    .from('booking_signatures')
    .select('id, storage_path')
    .eq('booking_id', bookingId)
    .eq('role', role)
    .eq('stage', stage)
    .maybeSingle()

  if (existing) {
    await supabase.storage.from('signatures').remove([existing.storage_path])
  }

  const fileName = `${bookingId}/${stage}-${role}-${Date.now()}.png`
  const buffer = await file.arrayBuffer()

  const { error: uploadError } = await supabase.storage
    .from('signatures')
    .upload(fileName, buffer, { contentType: 'image/png', upsert: false })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: signature, error: dbError } = await supabase
    .from('booking_signatures')
    .upsert(
      {
        id: existing?.id,
        booking_id: bookingId,
        role,
        stage,
        storage_path: fileName,
        signed_at: new Date().toISOString(),
        created_by: user?.id ?? null,
      },
      { onConflict: 'booking_id,role,stage' }
    )
    .select()
    .single()

  if (dbError) {
    await supabase.storage.from('signatures').remove([fileName])
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  const { data: signed } = await supabase.storage
    .from('signatures')
    .createSignedUrl(fileName, SIGNED_URL_TTL)

  return NextResponse.json({ signature: { ...signature, url: signed?.signedUrl ?? null } })
}
