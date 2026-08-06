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
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-[#0A1F44] shadow-xl shadow-black/20' : 'bg-[#0A1F44]'
    }`}>
      {/* Top info bar */}
      <div className="hidden lg:block border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex justify-between items-center">
          <p className="text-gray-400 text-xs">{companyName}</p>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <a href={whatsapp} target="_blank" rel="noopener noreferrer"
              className="hover:text-[#C9A84C] transition-colors">WhatsApp: {phone}</a>
            <span>·</span>
            <span>Mon–Sat {officeHoursOpen}–{officeHoursClose}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo — TODO: replace with your own logo image */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:block">
              <div className="flex items-baseline gap-1">
                <span className="text-white font-extrabold text-lg tracking-wide">RENT</span>
                <span className="text-[#C9A84C] font-extrabold text-lg tracking-wide">INFRA</span>
              </div>
              <p className="text-gray-400 text-[10px] -mt-0.5 tracking-widest uppercase">Affordable Car Rental</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(link => (
              <Link key={link.href} href={link.href}
                className="text-gray-300 hover:text-white hover:bg-white/8 px-3 py-2 rounded-lg transition-all text-sm font-medium">
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            <a href={`tel:${phone}`}
              className="flex items-center gap-1.5 text-[#C9A84C] text-sm font-medium hover:text-white transition-colors">
              <Phone size={14} />
              {phone}
            </a>
            <LanguageSwitcher />

            {user ? (
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <Link href="/admin"
                    className="text-xs bg-[#C9A84C] text-[#0A1F44] px-3 py-1.5 rounded-lg font-bold hover:bg-yellow-400 transition-colors">
                    Admin
                  </Link>
                )}
                <Link href="/account"
                  className="flex items-center gap-1 text-gray-300 hover:text-white text-sm transition-colors">
                  {t('myAccount')} <ChevronDown size={13} />
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login"
                  className="text-gray-300 hover:text-white text-sm px-3 py-1.5 transition-colors">
                  {t('login')}
                </Link>
                <Link href="/auth/register"
                  className="btn-gold text-[#0A1F44] px-4 py-1.5 rounded-lg text-sm font-bold">
                  {t('register')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#071530] px-4 py-4 space-y-1">
          {links.map(link => (
            <Link key={link.href} href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block text-gray-300 hover:text-white hover:bg-white/8 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors">
              {link.label}
            </Link>
          ))}
          <Link href="/my-booking"
            onClick={() => setMobileOpen(false)}
            className="block text-gray-300 hover:text-white hover:bg-white/8 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors">
            {t('myBooking')}
          </Link>

          <div className="pt-3 border-t border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <a href={`tel:${phone}`} className="flex items-center gap-2 text-[#C9A84C] text-sm font-medium">
                <Phone size={14} /> {phone}
              </a>
              <LanguageSwitcher />
            </div>
            {!user && (
              <div className="flex gap-2 pt-1">
                <Link href="/auth/login" onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center text-gray-300 border border-white/20 rounded-lg py-2.5 text-sm hover:bg-white/10 transition-colors">
                  {t('login')}
                </Link>
                <Link href="/auth/register" onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center btn-gold text-[#0A1F44] rounded-lg py-2.5 text-sm font-bold">
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
