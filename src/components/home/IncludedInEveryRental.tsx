import { ShieldCheck, Gauge, CalendarX2, Headset } from 'lucide-react'

interface IncludedInEveryRentalProps {
  settings?: Record<string, string>
}

/**
 * The terms that decide whether someone books — insurance, mileage,
 * cancellation, support — stated plainly instead of as adjectives.
 * Figures read from the settings table where one exists.
 */
export default function IncludedInEveryRental({ settings = {} }: IncludedInEveryRentalProps) {
  const openTime = settings.office_hours_open || '08:00'
  const closeTime = settings.office_hours_close || '20:00'

  const items = [
    {
      icon: ShieldCheck,
      title: 'Insurance included',
      body: 'Third-party cover and collision damage waiver come as standard. No cover is sold at the counter.',
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
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="font-display text-3xl text-[#0B1220] sm:text-4xl">
          What every rental includes
        </h2>
        <p className="mt-1.5 max-w-xl text-sm text-gray-600">
          No optional extras disguised as requirements. These apply to every car in the fleet.
        </p>

        <dl className="mt-10 grid grid-cols-1 gap-x-8 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ icon: Icon, title, body }) => (
            <div key={title} className="border-t-2 border-[#C9A84C]/70 pt-5">
              <dt className="flex items-center gap-2.5 text-base font-bold text-[#0B1220]">
                <Icon size={18} className="text-[#0A1F44]" strokeWidth={2} />
                {title}
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-gray-600">{body}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
