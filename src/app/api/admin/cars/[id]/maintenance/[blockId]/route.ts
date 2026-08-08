import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-guard'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; blockId: string }> }
) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { blockId } = await params
  const supabase = await createAdminClient()
  const { error } = await supabase.from('maintenance_blocks').delete().eq('id', blockId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
