import Link from 'next/link'
import Image from 'next/image'
import { Car } from '@/types'
import { Users, DoorOpen, Fuel, Settings, Luggage, Zap } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { getDiscountForDays } from '@/lib/pricing'

const CAR_PLACEHOLDER: Record<string, string> = {
  economy: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=600&q=80',
  suv: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=600&q=80',
  luxury: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=600&q=80',
}

const categoryConfig: Record<string, { label: string; color: string; bg: string }> = {
  economy: { label: 'Economy', color: 'text-blue-700', bg: 'bg-blue-50' },
  suv:     { label: 'SUV',     color: 'text-emerald-700', bg: 'bg-emerald-50' },
  luxury:  { label: 'Luxury',  color: 'text-amber-700', bg: 'bg-amber-50' },
}

interface CarCardProps {
  car: Car
  /** Serialized ?pickup=&dropoff=&location= carried over from the search */
  bookingQuery?: string
  /** Length of the searched rental, when the visitor picked dates */
  rentalDays?: number | null
}

export default function CarCard({ car, bookingQuery, rentalDays }: CarCardProps) {
  const primaryImage = car.car_images?.find(img => img.is_primary)?.url
    || car.car_images?.[0]?.url
    || CAR_PLACEHOLDER[car.category]

  const activePriceList = car.price_lists?.find(pl => pl.is_active && !pl.season_start)
    || car.price_lists?.[0]

  const cat = categoryConfig[car.category] || categoryConfig.economy
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden card-lift group">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src={primaryImage}
          alt={`${car.make} ${car.model}`}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cat.bg} ${cat.color}`}>
            {cat.label}
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

        {/* Specs grid */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-gray-500 mb-4 p-3 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-1.5">
            <Users size={12} className="text-[#C9A84C] shrink-0" />
            <span>{car.seats} seats</span>
          </div>
          <div className="flex items-center gap-1.5">
            <DoorOpen size={12} className="text-[#C9A84C] shrink-0" />
            <span>{car.doors} doors</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Settings size={12} className="text-[#C9A84C] shrink-0" />
            <span>{car.transmission === 'auto' ? 'Automatic' : 'Manual'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Fuel size={12} className="text-[#C9A84C] shrink-0" />
            <span className="capitalize">{car.fuel_type}</span>
          </div>
          <div className="flex items-center gap-1.5 col-span-2">
            <Luggage size={12} className="text-[#C9A84C] shrink-0" />
            <span>{car.luggage_small} small + {car.luggage_large} large bag{car.luggage_large !== 1 ? 's' : ''}</span>
          </div>
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
      </div>
    </div>
  )
}
