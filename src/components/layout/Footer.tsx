import Link from 'next/link'
import { Phone, MapPin, MessageCircle } from 'lucide-react'

interface FooterProps {
  settings?: Record<string, string>
}

export default function Footer({ settings = {} }: FooterProps) {
  const phone = settings.company_phone || '+10000000000'
  const whatsapp = settings.social_whatsapp || `https://wa.me/${phone.replace(/[^0-9]/g, '')}`
  const facebook = settings.social_facebook || 'https://facebook.com/rentinfra'
  const instagram = settings.social_instagram || 'https://instagram.com/rentinfra'
  const tiktok = settings.social_tiktok || 'https://tiktok.com/@rentinfra'
  const address = settings.company_address || '123 Example Street, Suite 100, 00000 Demo City, Demo Country'

  return (
    <footer className="mt-auto bg-[var(--bar)] text-gray-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4 md:gap-8">
          {/* Brand */}
          <div>
            <div className="mb-3 flex items-baseline gap-1 font-display text-base text-white">
              <span>RENT</span>
              <span className="text-[var(--pane-signal)]">INFRA</span>
            </div>
            <p className="mb-4 text-sm text-gray-400">Affordable Car Rental, Anywhere</p>

            <div className="flex gap-[3px]">
              <a
                href={facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="flex h-8 w-8 items-center justify-center bg-white/10 transition-colors hover:bg-[var(--pane-signal)]"
              >
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a
                href={instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-8 w-8 items-center justify-center bg-white/10 transition-colors hover:bg-[var(--pane-signal)]"
              >
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a
                href={tiktok}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="flex h-8 w-8 items-center justify-center bg-white/10 transition-colors hover:bg-[var(--pane-signal)]"
              >
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
              </a>
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="flex h-8 w-8 items-center justify-center bg-white/10 transition-colors hover:bg-[var(--pane-signal)]"
              >
                <MessageCircle size={14} />
              </a>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-[var(--pane-signal)]">Contact</h3>
            <div className="space-y-2 text-sm">
              <a href={`tel:${phone}`} className="flex items-center gap-2 transition-colors hover:text-white">
                <Phone size={13} /> {phone}
              </a>
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 transition-colors hover:text-white"
              >
                <MessageCircle size={13} /> WhatsApp
              </a>
              <div className="flex items-start gap-2">
                <MapPin size={13} className="mt-0.5 shrink-0" />
                <span>{address}</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-[var(--pane-signal)]">Quick Links</h3>
            <div className="space-y-2 text-sm">
              <Link href="/cars" className="block transition-colors hover:text-white">Our Fleet</Link>
              <Link href="/blog" className="block transition-colors hover:text-white">Travel Blog</Link>
              <Link href="/faq" className="block transition-colors hover:text-white">FAQ</Link>
              <Link href="/my-booking" className="block transition-colors hover:text-white">Find My Booking</Link>
              <Link href="/contact" className="block transition-colors hover:text-white">Contact</Link>
            </div>
          </div>

          {/* Help */}
          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-[var(--pane-signal)]">Help & Legal</h3>
            <div className="space-y-2 text-sm">
              <Link href="/customer-care" className="block transition-colors hover:text-white">Customer Care</Link>
              <Link href="/terms" className="block transition-colors hover:text-white">Terms & Conditions</Link>
              <Link href="/privacy" className="block transition-colors hover:text-white">Privacy Policy</Link>
              <Link href="/auth/login" className="block transition-colors hover:text-white">Login / Register</Link>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t-2 border-white/10 pt-6 text-xs text-gray-500 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} RentInfra. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-gray-300">Terms</Link>
            <Link href="/privacy" className="hover:text-gray-300">Privacy</Link>
            <Link href="/customer-care" className="hover:text-gray-300">Customer Care</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
