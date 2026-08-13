'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Car, Calendar, Users, MapPin,
  Settings, Languages, Package, ExternalLink, LogOut, Star, BarChart3,
  Menu, X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/bookings', label: 'Bookings', icon: Calendar },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
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

function Wordmark() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-8 w-8 grid-cols-2 grid-rows-2 gap-[2px] bg-[var(--bar-soft)] p-[2px]" aria-hidden="true">
        <span className="bg-[var(--glass-clear)]" />
        <span className="bg-[var(--pane-signal)]" />
        <span className="bg-[var(--glass-clear)]" />
        <span className="bg-[var(--glass-clear)]" />
      </span>
      <div>
        <p className="text-sm font-bold text-white">
          RENT<span className="text-[var(--pane-signal)]">INFRA</span>
        </p>
        <p className="text-[10px] uppercase tracking-widest text-gray-500">Admin</p>
      </div>
    </div>
  )
}

function SidebarContents({ userName, onNavigate }: { userName: string; onNavigate?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <>
      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-600">Menu</p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                active ? 'op-nav-active font-semibold' : 'op-nav-inactive'
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="space-y-1 border-t-2 border-white/10 px-3 py-4">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2 text-xs text-gray-500 transition-colors hover:bg-white/8 hover:text-white"
        >
          <ExternalLink size={14} /> View Website
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2 text-xs text-gray-500 transition-colors hover:bg-[var(--pane-oxblood)]/20 hover:text-red-300"
        >
          <LogOut size={14} /> Sign Out
        </button>

        {/* User */}
        <div className="mt-1 flex items-center gap-3 border-t-2 border-white/10 px-3 pt-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center bg-[var(--pane-signal)]/20">
            <span className="text-xs font-bold text-[#5b93ff]">{initials}</span>
          </div>
          <p className="truncate text-xs text-gray-400">{userName}</p>
        </div>
      </div>
    </>
  )
}

export default function AdminSidebar({ userName }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile top bar — replaces the fixed-width sidebar below the lg breakpoint */}
      <div className="op-sidebar flex h-14 shrink-0 items-center justify-between border-b-2 border-black/40 px-4 lg:hidden">
        <Wordmark />
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 text-white"
          aria-label="Open menu"
          aria-expanded={mobileOpen}
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside className="op-sidebar hidden h-screen w-60 shrink-0 flex-col border-r-2 border-black/40 lg:flex">
        <div className="border-b-2 border-white/10 px-5 py-5">
          <Wordmark />
        </div>
        <SidebarContents userName={userName} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="op-sidebar absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r-2 border-black/40">
            <div className="flex items-center justify-between border-b-2 border-white/10 px-5 py-5">
              <Wordmark />
              <button onClick={() => setMobileOpen(false)} className="p-1 text-white" aria-label="Close menu">
                <X size={20} />
              </button>
            </div>
            <SidebarContents userName={userName} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
    </>
  )
}
