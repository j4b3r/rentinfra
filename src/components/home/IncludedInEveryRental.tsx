import { ShieldCheck, Gauge, CalendarX2, Headset } from 'lucide-react'

interface IncludedInEveryRentalProps {
  settings?: Record<string, string>
}

/**
 * The terms that decide whether someone books — insurance, mileage,
 * cancellation, support — stated plainly instead of as adjectives.
 * Figures read from the settings table where one exists.
 *
 * The lead term (insurance) gets the lit pane and a wider span — the one
 * thing in this list that most changes whether someone trusts the booking —
 * so the section reads as a graded elevation, not four identical tiles.
 */
export default function IncludedInEveryRental({ settings = {} }: IncludedInEveryRentalProps) {
  const openTime = settings.office_hours_open || '08:00'
  const closeTime = settings.office_hours_close || '20:00'

  const items = [
    {
      icon: ShieldCheck,
      title: 'Insurance included',
      body: 'Third-party cover and collision damage waiver come as standard. No cover is sold at the counter.',
      lead: true,
    },
    {
      icon: Gauge,
      title: 'Unlimited mileage',
      body: 'Drive as far as you like. No per-kilometre charges and no distance cap on any rental.',
    },
    {
      icon: CalendarX2,
      title: 'Free cancellation',
      body: 'Cancel up to 24 hours before pick-up at no cost. Change your dates at any point before that.',
    },
    {
      icon: Headset,
      title: 'Real people, same day',
      body: `Reach us on WhatsApp or by phone between ${openTime} and ${closeTime}, seven days a week.`,
    },
  ]

  return (
    <section className="glazing py-[3px]">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-[3px] px-[3px] sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        {items.map(({ icon: Icon, title, body, lead }) => (
          <div
            key={title}
            className={`p-6 transition duration-500 sm:p-7 ${
              lead ? 'pane-lit lg:row-span-1' : 'pane hover:animate-pane-light'
            }`}
          >
            <Icon
              size={lead ? 26 : 20}
              className={lead ? 'text-[var(--ink-on-signal)]' : 'text-[var(--pane-signal)]'}
              strokeWidth={2}
            />
            <h3
              className={`mt-3 font-bold ${
                lead ? 'text-xl text-[var(--ink-on-signal)]' : 'text-base text-[var(--ink)]'
              }`}
            >
              {title}
            </h3>
            <p
              className={`mt-2 text-sm leading-relaxed ${
                lead ? 'max-w-sm text-[var(--ink-on-signal)]/85' : 'text-[var(--ink-soft)]'
              }`}
            >
              {body}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
