import Image from 'next/image'
import Link from 'next/link'
import { Car } from '@/types'
import { Users, Settings, Luggage, ArrowRight, DoorOpen, Fuel, Bike, Gauge, Zap } from 'lucide-react'
import { specsFor, categoryLabel, placeholderFor, VEHICLE_TYPES, VEHICLE_TYPE_LABEL } from '@/lib/vehicles'

const SPEC_ICONS = {
  users: Users, door: DoorOpen, gauge: Gauge, fuel: Fuel,
  luggage: Luggage, settings: Settings, bike: Bike, zap: Zap,
} as const
import { formatCurrency } from '@/lib/utils'



interface FleetGridProps {
  cars: Car[]
}

export default function FleetGrid({ cars }: FleetGridProps) {
  // The rail reflects what is actually in stock, by vehicle type.
  const types = VEHICLE_TYPES.filter((t) => cars.some((car) => car.vehicle_type === t))

  return (
    <section className="glazing py-[3px]">
      <div className="mx-auto max-w-7xl px-[3px]">
        <div className="pane pane-seeded flex flex-wrap items-end justify-between gap-4 p-6 sm:p-8">
          <div>
            <h2 className="font-display text-3xl text-[var(--ink)] sm:text-4xl">The fleet</h2>
            <p className="mt-1.5 text-sm text-[var(--ink-soft)]">
              Cars, motorbikes and bicycles — serviced between rentals, insured, and ready to go.
            </p>
          </div>

          {/* Category rail — encodes how the inventory is actually organized */}
          <div className="flex flex-wrap items-center gap-1 text-sm">
            {types.map((t) => (
              <Link
                key={t}
                href={`/cars?type=${t}`}
                className="border-2 border-transparent px-3 py-1.5 font-medium text-[var(--ink-soft)] transition hover:border-[var(--bar)] hover:text-[var(--ink)]"
              >
                {VEHICLE_TYPE_LABEL[t]}
              </Link>
            ))}
            <Link
              href="/cars"
              className="ml-1 flex items-center gap-1.5 bg-[var(--bar)] px-3 py-1.5 font-semibold text-[var(--glass-clear)] transition hover:gap-2.5"
            >
              All {cars.length}
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div className="mt-[3px] grid grid-cols-1 gap-[3px] sm:grid-cols-2 lg:grid-cols-3">
          {cars.slice(0, 6).map((car) => {
            const image =
              car.car_images?.find((img) => img.is_primary)?.url ||
              car.car_images?.[0]?.url ||
              placeholderFor(car)

            const priceList =
              car.price_lists?.find((pl) => pl.is_active && !pl.season_start) ||
              car.price_lists?.[0]

            return (
              <article
                key={car.id}
                className="pane group flex flex-col overflow-hidden transition duration-500 hover:animate-pane-light"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-[var(--glass-seeded)]">
                  <Image
                    src={image}
                    alt={`${car.make} ${car.model}`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                  <span className="absolute left-0 top-0 bg-[var(--bar)] px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--glass-clear)]">
                    {categoryLabel(car.vehicle_type, car.category)}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-base font-bold text-[var(--ink)]">
                    {car.make} {car.model}
                  </h3>

                  <ul className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--ink-soft)]">
                    {specsFor(car).slice(0, 3).map((sp) => {
                      const Icon = SPEC_ICONS[sp.icon]
                      return (
                        <li key={sp.label} className="flex items-center gap-1.5">
                          <Icon size={13} className="text-[var(--pane-signal)]" />
                          {sp.label}
                        </li>
                      )
                    })}
                  </ul>

                  <div className="mt-5 flex items-end justify-between border-t-2 border-[var(--bar)] pt-4">
                    <div>
                      <span className="font-display text-2xl text-[var(--ink)] tabular-nums">
                        {priceList ? formatCurrency(priceList.daily_rate) : '—'}
                      </span>
                      <span className="ml-1 text-sm text-[var(--ink-soft)]">/day</span>
                    </div>
                    <Link
                      href={`/cars/${car.slug}`}
                      className="btn-frame px-3.5 py-2 text-sm font-semibold"
                    >
                      View details
                    </Link>
                  </div>
                </div>
              </article>
            )
          })}
        </div>

        {cars.length === 0 && (
          <p className="pane mt-[3px] py-14 text-center text-[var(--ink-soft)]">
            No cars published yet. Add your first vehicle in the admin panel under Cars.
          </p>
        )}
      </div>
    </section>
  )
}
