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
    <section className="bg-[#F2F4F7] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#0A1F44]/10 pb-5">
          <div>
            <h2 className="font-display text-3xl text-[#0B1220] sm:text-4xl">The fleet</h2>
            <p className="mt-1.5 text-sm text-gray-600">
              Cars, motorbikes and bicycles — serviced between rentals, insured, and ready to go.
            </p>
          </div>

          {/* Category rail — encodes how the inventory is actually organized */}
          <div className="flex items-center gap-1 text-sm">
            {types.map((t) => (
              <Link
                key={t}
                href={`/cars?type=${t}`}
                className="rounded-full px-3 py-1.5 font-medium text-gray-600 transition hover:bg-white hover:text-[#0A1F44]"
              >
                {VEHICLE_TYPE_LABEL[t]}
              </Link>
            ))}
            <Link
              href="/cars"
              className="ml-1 flex items-center gap-1.5 border-b border-[#C9A84C] py-1 font-semibold text-[#0A1F44] transition hover:gap-2.5"
            >
              All {cars.length}
              <ArrowRight size={14} className="text-[#C9A84C]" />
            </Link>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
                className="group flex flex-col overflow-hidden rounded-2xl border border-black/5 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-24px_rgba(10,31,68,0.55)]"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                  <Image
                    src={image}
                    alt={`${car.make} ${car.model}`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition duration-500 group-hover:scale-[1.04]"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-[#0A1F44] shadow-sm">
                    {categoryLabel(car.vehicle_type, car.category)}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-base font-bold text-[#0B1220]">
                    {car.make} {car.model}
                  </h3>

                  <ul className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
                    {specsFor(car).slice(0, 3).map((sp) => {
                      const Icon = SPEC_ICONS[sp.icon]
                      return (
                        <li key={sp.label} className="flex items-center gap-1.5">
                          <Icon size={13} className="text-[#C9A84C]" />
                          {sp.label}
                        </li>
                      )
                    })}
                  </ul>

                  <div className="mt-5 flex items-end justify-between border-t border-gray-100 pt-4">
                    <div>
                      <span className="font-display text-2xl text-[#0B1220] tabular-nums">
                        {priceList ? formatCurrency(priceList.daily_rate) : '—'}
                      </span>
                      <span className="ml-1 text-sm text-gray-500">/day</span>
                    </div>
                    <Link
                      href={`/cars/${car.slug}`}
                      className="rounded-lg border border-[#0A1F44] px-3.5 py-2 text-sm font-semibold text-[#0A1F44] transition hover:bg-[#0A1F44] hover:text-white"
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
          <p className="mt-10 rounded-2xl border border-dashed border-gray-300 bg-white py-14 text-center text-gray-500">
            No cars published yet. Add your first vehicle in the admin panel under Cars.
          </p>
        )}
      </div>
    </section>
  )
}
