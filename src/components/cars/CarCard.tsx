import Link from 'next/link'
import Image from 'next/image'
import { Car } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getDiscountForDays } from '@/lib/pricing'
import { specsFor, categoryLabel, placeholderFor } from '@/lib/vehicles'
import { Users, DoorOpen, Fuel, Settings, Luggage, Zap, Bike, Gauge } from 'lucide-react'

const SPEC_ICONS = {
  users: Users, door: DoorOpen, gauge: Gauge, fuel: Fuel,
  luggage: Luggage, settings: Settings, bike: Bike, zap: Zap,
} as const



const TYPE_STYLE: Record<string, { color: string; bg: string }> = {
  car:       { color: 'text-blue-700',    bg: 'bg-blue-50' },
  motorbike: { color: 'text-orange-700',  bg: 'bg-orange-50' },
  bicycle:   { color: 'text-emerald-700', bg: 'bg-emerald-50' },
}

interface CarCardProps {
  car: Car
  /** Serialized ?pickup=&dropoff=&location= carried over from the search */
  bookingQuery?: string
  /** Length of the searched rental, when the visitor picked dates */
  rentalDays?: number | null
  /** Already booked for the searched dates */
  unavailable?: boolean
  /** First date it frees up again, when unavailable */
  nextFreeDate?: string | null
}

export default function CarCard({
  car,
  bookingQuery,
  rentalDays,
  unavailable = false,
  nextFreeDate,
}: CarCardProps) {
  const primaryImage = car.car_images?.find(img => img.is_primary)?.url
    || car.car_images?.[0]?.url
    || placeholderFor(car)

  const activePriceList = car.price_lists?.find(pl => pl.is_active && !pl.season_start)
    || car.price_lists?.[0]

  const cat = TYPE_STYLE[car.vehicle_type] || TYPE_STYLE.car
  const catLabel = categoryLabel(car.vehicle_type, car.category)
  const isElectricOrHybrid = car.fuel_type === 'electric' || car.fuel_type === 'hybrid'

  // When the visitor searched dates, show what the rental actually costs for
  // that range — using the same discount tiers the booking wizard applies.
  const stayDiscount =
    rentalDays && activePriceList ? getDiscountForDays(activePriceList, rentalDays).pct : 0
  const stayTotal =
    rentalDays && activePriceList
      ? activePriceList.daily_rate * rentalDays * (1 - stayDiscount / 100)
      : null

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border overflow-hidden group ${
        unavailable ? 'border-gray-200' : 'border-gray-100 card-lift'
      }`}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src={primaryImage}
          alt={`${car.make} ${car.model}`}
          fill
          className={`object-cover transition-transform duration-500 ${
            unavailable ? 'grayscale opacity-60' : 'group-hover:scale-105'
          }`}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Booked for the searched dates */}
        {unavailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/40">
            <span className="rounded-full bg-[#0A1F44] px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-lg">
              Booked for these dates
            </span>
          </div>
        )}

        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cat.bg} ${cat.color}`}>
            {catLabel}
          </span>
        </div>

        {/* Eco badge */}
        {isElectricOrHybrid && (
          <div className="absolute top-3 right-3">
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
              <Zap size={10} /> Eco
            </span>
          </div>
        )}

        {/* Unavailable overlay */}
        {!car.is_available && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white font-bold bg-red-500/80 px-3 py-1 rounded-full text-sm">Not Available</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="mb-3">
          <h3 className="font-bold text-[#0A1F44] text-lg leading-tight">{car.make} {car.model}</h3>
          {car.year && <p className="text-gray-400 text-xs mt-0.5">{car.year}</p>}
        </div>

        {/* Specs grid — only what applies to this vehicle type */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-gray-500 mb-4 p-3 bg-gray-50 rounded-xl">
          {specsFor(car).map(sp => {
            const Icon = SPEC_ICONS[sp.icon]
            return (
              <div key={sp.label} className="flex items-center gap-1.5">
                <Icon size={12} className="text-[#C9A84C] shrink-0" />
                <span>{sp.label}</span>
              </div>
            )
          })}
        </div>

        {/* Discount badges */}
        {activePriceList?.price_list_discounts && activePriceList.price_list_discounts.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-3">
            {activePriceList.price_list_discounts.slice(0, 2).map(d => (
              <span key={d.id} className="text-xs bg-[#C9A84C]/10 text-[#C9A84C] font-medium px-2 py-0.5 rounded-full">
                {d.label_en}
              </span>
            ))}
          </div>
        )}

        {/* Price & CTA */}
        {unavailable ? (
          <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
            <div>
              <span className="text-xs text-gray-400">
                {activePriceList ? formatCurrency(activePriceList.daily_rate) : '—'}/day
              </span>
              <p className="text-sm font-semibold text-[#0A1F44]">
                {nextFreeDate ? `Free from ${formatDate(nextFreeDate)}` : 'Not available'}
              </p>
            </div>
            <Link
              href={
                nextFreeDate
                  ? `/cars/${car.slug}?pickup=${nextFreeDate}`
                  : `/cars/${car.slug}`
              }
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-[#0A1F44] hover:text-[#0A1F44]"
            >
              {nextFreeDate ? 'See later dates' : 'View details'}
            </Link>
          </div>
        ) : (
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            <span className="text-xs text-gray-400">{stayTotal ? `Total, ${rentalDays} days` : 'From'}</span>
            <div className="flex items-baseline gap-1">
              <span className="text-[#0A1F44] font-extrabold text-2xl tabular-nums">
                {stayTotal
                  ? formatCurrency(stayTotal)
                  : activePriceList ? formatCurrency(activePriceList.daily_rate) : '—'}
              </span>
              <span className="text-sm text-gray-400">{stayTotal ? '' : '/day'}</span>
            </div>
            {stayTotal && activePriceList && (
              <p className="text-xs text-gray-400">
                {formatCurrency(activePriceList.daily_rate)}/day
                {stayDiscount > 0 && (
                  <span className="text-green-600 font-medium"> · {stayDiscount}% off</span>
                )}
              </p>
            )}
          </div>
          <Link
            href={bookingQuery ? `/cars/${car.slug}?${bookingQuery}` : `/cars/${car.slug}`}
            className="btn-gold text-[#0A1F44] px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm"
          >
            View details
          </Link>
        </div>
        )}
      </div>
    </div>
  )
}
