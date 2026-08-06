import Link from 'next/link'
import { MessageCircle, Phone, MapPin, Clock } from 'lucide-react'

interface ClosingCtaProps {
  settings?: Record<string, string>
}

/**
 * Closing action plus the practical details (where, when, how to reach us).
 * This replaces the old contact-and-map block that used to sit near the top
 * of the page, before visitors had any reason to care about the address.
 */
export default function ClosingCta({ settings = {} }: ClosingCtaProps) {
  const phone = settings.company_phone || ''
  const whatsapp =
    settings.social_whatsapp ||
    (phone ? `https://wa.me/${phone.replace(/[^0-9]/g, '')}` : '')
  const address = settings.company_address || ''
  const mapsUrl = settings.google_maps_url || ''
  const openTime = settings.office_hours_open || '08:00'
  const closeTime = settings.office_hours_close || '20:00'

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 rounded-2xl border border-black/5 bg-[#F2F4F7] p-8 sm:p-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          <div>
            <h2 className="font-display text-3xl text-[#0B1220] sm:text-4xl">
              Ready when you are
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-600">
              Book online in a couple of minutes, or message us and we will sort it out for you.
              Same-day pick-up is usually possible.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/cars"
                className="btn-gold rounded-lg px-6 py-3 text-sm font-bold uppercase tracking-wide text-[#0A1F44]"
              >
                Browse the fleet
              </Link>
              {whatsapp && (
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-[#0A1F44]/20 px-5 py-3 text-sm font-semibold text-[#0A1F44] transition hover:border-[#0A1F44] hover:bg-white"
                >
                  <MessageCircle size={16} />
                  Message on WhatsApp
                </a>
              )}
            </div>
          </div>

          {/* Practical details — the footer content that used to open the page */}
          <dl className="space-y-4 text-sm lg:border-l lg:border-black/10 lg:pl-10">
            {phone && (
              <div className="flex gap-3">
                <Phone size={16} className="mt-0.5 shrink-0 text-[#C9A84C]" />
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Phone
                  </dt>
                  <dd>
                    <a
                      href={`tel:${phone.replace(/\s/g, '')}`}
                      className="font-medium text-[#0B1220] hover:text-[#0A1F44]"
                    >
                      {phone}
                    </a>
                  </dd>
                </div>
              </div>
            )}

            {address && (
              <div className="flex gap-3">
                <MapPin size={16} className="mt-0.5 shrink-0 text-[#C9A84C]" />
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Where to find us
                  </dt>
                  <dd className="font-medium leading-snug text-[#0B1220]">
                    {mapsUrl ? (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-[#0A1F44] hover:underline"
                      >
                        {address}
                      </a>
                    ) : (
                      address
                    )}
                  </dd>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Clock size={16} className="mt-0.5 shrink-0 text-[#C9A84C]" />
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Opening hours
                </dt>
                <dd className="font-medium text-[#0B1220] tabular-nums">
                  Every day, {openTime} – {closeTime}
                </dd>
              </div>
            </div>
          </dl>
        </div>
      </div>
    </section>
  )
}
