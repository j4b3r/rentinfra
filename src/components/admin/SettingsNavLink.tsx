'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, Scale, Clock, Share2, Bell, BookOpen } from 'lucide-react'

const ICONS: Record<string, React.ElementType> = {
  Building2, Scale, Clock, Share2, Bell, BookOpen,
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
      className={`flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 last:border-0 transition-colors group ${
        active ? 'bg-[#0A1F44]' : 'hover:bg-gray-50'
      }`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
        active ? 'bg-white/15' : 'bg-gray-100 group-hover:bg-[#C9A84C]/10'
      }`}>
        <Icon size={15} className={active ? 'text-[#C9A84C]' : 'text-gray-500 group-hover:text-[#C9A84C]'} />
      </div>
      <div>
        <p className={`text-sm font-semibold leading-tight ${active ? 'text-white' : 'text-gray-700'}`}>{label}</p>
        <p className={`text-[10px] leading-tight mt-0.5 ${active ? 'text-gray-300' : 'text-gray-400'}`}>{desc}</p>
      </div>
    </Link>
  )
}
