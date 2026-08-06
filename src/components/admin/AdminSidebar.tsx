'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Car, Calendar, Users, MapPin,
  Settings, Languages, Package, ExternalLink, LogOut, Star
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/bookings', label: 'Bookings', icon: Calendar },
  { href: '/admin/cars', label: 'Cars', icon: Car },
  { href: '/admin/addons', label: 'Addons', icon: Package },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/locations', label: 'Locations', icon: MapPin },
  { href: '/admin/testimonials', label: 'Testimonials', icon: Star },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
  { href: '/admin/translations', label: 'Translations', icon: Languages },
]

interface Props {
  userName: string
}

export default function AdminSidebar({ userName }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <aside className="w-64 bg-[#0A1F44] flex flex-col shrink-0 h-screen border-r border-white/5">
      {/* Logo — TODO: replace with your own logo image */}
      <div className="px-5 py-5 border-b border-white/8">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-white text-sm font-extrabold tracking-wide">RENT <span className="text-[#C9A84C]">INFRA</span></p>
            <p className="text-gray-500 text-[10px] uppercase tracking-widest">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-gray-600 text-[10px] uppercase tracking-widest font-semibold px-3 mb-2">Menu</p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                active
                  ? 'bg-[#C9A84C] text-[#0A1F44] font-bold shadow-sm shadow-[#C9A84C]/20'
                  : 'text-gray-400 hover:bg-white/8 hover:text-white'
              }`}>
              <Icon size={16} className={active ? 'text-[#0A1F44]' : ''} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-white/8 space-y-1">
        <Link href="/" target="_blank"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-gray-500 hover:text-white hover:bg-white/8 transition-all">
          <ExternalLink size={14} /> View Website
        </Link>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-gray-500 hover:text-red-400 hover:bg-red-400/8 transition-all">
          <LogOut size={14} /> Sign Out
        </button>

        {/* User */}
        <div className="flex items-center gap-3 px-3 pt-3 mt-1 border-t border-white/8">
          <div className="w-7 h-7 rounded-full bg-[#C9A84C]/20 flex items-center justify-center shrink-0">
            <span className="text-[#C9A84C] text-xs font-bold">{initials}</span>
          </div>
          <p className="text-xs text-gray-400 truncate">{userName}</p>
        </div>
      </div>
    </aside>
  )
}
