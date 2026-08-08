'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function SignOutButton() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function signOut() {
    setBusy(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={busy}
      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-red-200 hover:text-red-600 disabled:opacity-60"
    >
      {busy ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
      Sign out
    </button>
  )
}
