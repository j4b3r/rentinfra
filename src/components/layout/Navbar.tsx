'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Menu, X, Phone, ChevronDown } from 'lucide-react'
import LanguageSwitcher from './LanguageSwitcher'

interface NavbarProps {
  user?: { id: string; email?: string } | null
  isAdmin?: boolean
  settings?: Record<string, string>
}

export default function Navbar({ user, isAdmin, settings = {} }: NavbarProps) {
  const t = useTranslations('nav')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const companyName = settings.company_name || 'RentInfra Demo'
  const phone = settings.company_phone || '+10000000000'
  const whatsapp = settings.social_whatsapp || `https://wa.me/${phone.replace(/[^0-9]/g, '')}`
  const officeHoursOpen = settings.office_hours_open || '08:00'
  const officeHoursClose = settings.office_hours_close || '20:00'

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const links = [
    { href: '/', label: t('home') },
    { href: '/cars', label: t('cars') },
    { href: '/blog', label: 'Blog' },
    { href: '/faq', label: 'FAQ' },
    { href: '/contact', label: t('contact') },
  ]

  return (
    <nav
      className={`sticky top-0 z-50 bg-[var(--bar)] transition-shadow duration-300 ${
        scrolled ? 'shadow-[0_4px_0_0_var(--bar)]' : ''
      }`}
    >
      {/* Top info bar — a thin lit pane, not a gradient strip */}
      <div className="hidden border-b-2 border-black/40 bg-[var(--pane-signal)] lg:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 text-xs text-[var(--ink-on-signal)] sm:px-6 lg:px-8">
          <p className="font-medium">{companyName}</p>
          <div className="flex items-center gap-4">
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="hover:underline">
              WhatsApp: {phone}
            </a>
            <span aria-hidden="true">/</span>
            <span className="tabular-nums">
              Mon&ndash;Sat {officeHoursOpen}&ndash;{officeHoursClose}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Wordmark — set inside its own pane, never across the bar */}
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <span className="grid h-9 w-9 grid-cols-2 grid-rows-2 gap-[2px] bg-[var(--bar)] p-[2px]" aria-hidden="true">
              <span className="bg-[var(--glass-clear)]" />
              <span className="bg-[var(--pane-signal)]" />
              <span className="bg-[var(--glass-clear)]" />
              <span className="bg-[var(--glass-clear)]" />
            </span>
            <div className="hidden sm:block">
              <div className="flex items-baseline gap-1 font-display text-lg leading-none text-[var(--glass-clear)]">
                <span>RENT</span>
                <span className="text-[var(--pane-signal)]">INFRA</span>
              </div>
            </div>
          </Link>

          {/* Desktop nav — each link a pane you enter, not a pill */}
          <div className="hidden md:flex md:items-stretch md:self-stretch">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center border-l border-white/10 px-4 text-sm font-medium text-gray-300 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden items-center gap-4 md:flex">
            <a
              href={`tel:${phone}`}
              className="flex items-center gap-1.5 text-sm font-medium text-[#5b93ff] transition-colors hover:text-white"
            >
              <Phone size={14} />
              {phone}
            </a>
            <LanguageSwitcher />

            {user ? (
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="btn-signal px-3 py-1.5 text-xs font-bold uppercase tracking-wide"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="/account"
                  className="flex items-center gap-1 text-sm text-gray-300 transition-colors hover:text-white"
                >
                  {t('myAccount')} <ChevronDown size={13} />
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="px-3 py-1.5 text-sm text-gray-300 transition-colors hover:text-white"
                >
                  {t('login')}
                </Link>
                <Link href="/auth/register" className="btn-signal px-4 py-1.5 text-sm font-bold">
                  {t('register')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded p-2 text-white transition-colors hover:bg-white/10 md:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="space-y-0 border-t border-white/10 bg-[#050608] md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block border-b border-white/5 px-4 py-3 text-sm font-medium text-gray-300 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/my-booking"
            onClick={() => setMobileOpen(false)}
            className="block border-b border-white/5 px-4 py-3 text-sm font-medium text-gray-300 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            {t('myBooking')}
          </Link>
          {user && (
            <Link
              href="/account"
              onClick={() => setMobileOpen(false)}
              className="block border-b border-white/5 px-4 py-3 text-sm font-medium text-gray-300 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              {t('myAccount')}
            </Link>
          )}

          <div className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <a href={`tel:${phone}`} className="flex items-center gap-2 text-sm font-medium text-[#5b93ff]">
                <Phone size={14} /> {phone}
              </a>
              <LanguageSwitcher />
            </div>
            {!user && (
              <div className="flex gap-2 pt-1">
                <Link
                  href="/auth/login"
                  onClick={() => setMobileOpen(false)}
                  className="btn-frame flex-1 border-white/20 py-2.5 text-center text-sm text-gray-200 hover:bg-white/10 hover:text-white"
                >
                  {t('login')}
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setMobileOpen(false)}
                  className="btn-signal flex-1 py-2.5 text-center text-sm font-bold"
                >
                  {t('register')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
