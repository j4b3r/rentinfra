import Link from 'next/link'
import { MessageCircle, Phone, MapPin, Clock } from 'lucide-react'

interface ClosingCtaProps {
  settings?: Record<string, string>
}

/**
 * Closing action plus the practical details (where, when, how to reach us).
 * The lit pane carries the action; the frame around it carries the facts —
 * the same grammar the search panel opened with, closing the page.
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
    <section className="glazing py-[3px]">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-[3px] px-[3px] lg:grid-cols-[1.2fr_1fr]">
        <div className="pane-lit p-8 sm:p-10">
          <h2 className="font-display text-3xl text-[var(--ink-on-signal)] sm:text-4xl">
            Ready when you are
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--ink-on-signal)]/85">
            Book online in a couple of minutes, or message us and we will sort it out for you.
            Same-day pick-up is usually possible.
          </p>

          <div className="mt-7 flex flex-wrap gap-[3px]">
            <Link
              href="/cars"
              className="bg-[var(--ink-on-signal)] px-6 py-3 text-sm font-bold uppercase tracking-wide text-[var(--pane-signal)] transition hover:bg-white"
            >
              Browse the fleet
            </Link>
            {whatsapp && (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 border-2 border-[var(--ink-on-signal)]/40 px-5 py-3 text-sm font-semibold text-[var(--ink-on-signal)] transition hover:border-[var(--ink-on-signal)]"
              >
                <MessageCircle size={16} />
                Message on WhatsApp
              </a>
            )}
          </div>
        </div>

        {/* Practical details — the footer content that used to open the page */}
        <dl className="pane pane-seeded space-y-4 p-8 text-sm sm:p-10">
          {phone && (
            <div className="flex gap-3">
              <Phone size={16} className="mt-0.5 shrink-0 text-[var(--pane-signal)]" />
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
                  Phone
                </dt>
                <dd>
                  <a
                    href={`tel:${phone.replace(/\s/g, '')}`}
                    className="font-medium text-[var(--ink)] hover:underline"
                  >
                    {phone}
                  </a>
                </dd>
              </div>
            </div>
          )}

          {address && (
            <div className="flex gap-3">
              <MapPin size={16} className="mt-0.5 shrink-0 text-[var(--pane-signal)]" />
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
                  Where to find us
                </dt>
                <dd className="font-medium leading-snug text-[var(--ink)]">
                  {mapsUrl ? (
                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
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
            <Clock size={16} className="mt-0.5 shrink-0 text-[var(--pane-signal)]" />
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
                Opening hours
              </dt>
              <dd className="font-medium text-[var(--ink)] tabular-nums">
                Every day, {openTime} &ndash; {closeTime}
              </dd>
            </div>
          </div>
        </dl>
      </div>
    </section>
  )
}
