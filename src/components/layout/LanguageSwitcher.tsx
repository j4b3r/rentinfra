'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Globe } from 'lucide-react'

export default function LanguageSwitcher() {
  const router = useRouter()
  const [, startTransition] = useTransition()

  function switchLocale(locale: string) {
    document.cookie = `locale=${locale};path=/;max-age=31536000`
    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-1">
      <Globe size={14} className="text-gray-400" />
      <button onClick={() => switchLocale('en')} className="text-xs text-gray-400 hover:text-white">EN</button>
      <span className="text-gray-600">|</span>
      <button onClick={() => switchLocale('es')} className="text-xs text-gray-400 hover:text-white">ES</button>
    </div>
  )
}
