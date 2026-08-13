'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, Scale, Clock, Share2, Bell, BookOpen, Plug } from 'lucide-react'

const ICONS: Record<string, React.ElementType> = {
  Building2, Scale, Clock, Share2, Bell, BookOpen, Plug,
}

interface Props {
  href: string
  label: string
  iconName: string
  desc: string
}

export default function SettingsNavLink({ href, label, iconName, desc }: Props) {
  const Icon = ICONS[iconName] || Building2
  const pathname = usePathname()
  const active = href === '/admin/settings' ? pathname === '/admin/settings' : pathname === href

  return (
    <Link href={href}
      className={`group flex items-center gap-3 border-b border-gray-100 px-4 py-3.5 transition-colors last:border-0 ${
        active ? 'bg-[var(--pane-signal)]' : 'hover:bg-[var(--glass-paper)]'
      }`}>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center transition-colors ${
        active ? 'bg-white/15' : 'bg-[var(--glass-seeded)]'
      }`}>
        <Icon size={15} className={active ? 'text-white' : 'text-[var(--ink-soft)] group-hover:text-[var(--pane-signal)]'} />
      </div>
      <div>
        <p className={`text-sm font-semibold leading-tight ${active ? 'text-white' : 'text-[var(--ink)]'}`}>{label}</p>
        <p className={`mt-0.5 text-[10px] leading-tight ${active ? 'text-white/70' : 'text-[var(--ink-soft)]'}`}>{desc}</p>
      </div>
    </Link>
  )
}
