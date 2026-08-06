import Image from 'next/image'
import Link from 'next/link'
import { Car } from '@/types'
import { Users, Settings, ArrowRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const CAR_PLACEHOLDER: Record<string, string> = {
  economy: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=600&q=80',
  suv: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=600&q=80',
  luxury: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=600&q=80',
}

function buildWhatsAppUrl(car: Car, dailyRate?: number) {
  const price = dailyRate ? `from €${dailyRate}/day` : ''
  const text = `Hi! I'm interested in booking the ${car.make} ${car.model} ${price}. Can you help me?`
  return `https://wa.me/34697462569?text=${encodeURIComponent(text)}`
}

interface FleetGridProps {
  cars: Car[]
}

export default function FleetGrid({ cars }: FleetGridProps) {
  return (
    <section className="bg-[#F8F9FA] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-[#0A1F44] uppercase tracking-tight">Our Fleet</h2>
            <p className="text-gray-400 text-sm mt-0.5">Choose from our premium selection of vehicles</p>
          </div>
          <Link
            href="/cars"
            className="flex items-center gap-1.5 border border-[#C9A84C] text-[#C9A84C] hover:bg-[#C9A84C] hover:text-[#0A1F44] transition-colors px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wide"
          >
            View All Vehicles
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {cars.map((car) => {
            const primaryImage =
              car.car_images?.find(img => img.is_primary)?.url ||
              car.car_images?.[0]?.url ||
              CAR_PLACEHOLDER[car.category] ||
              CAR_PLACEHOLDER.economy

            const activePriceList =
              car.price_lists?.find(pl => pl.is_active && !pl.season_start) ||
              car.price_lists?.[0]

            const dailyRate = activePriceList?.daily_rate

            return (
              <div key={car.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                {/* Image */}
                <div className="relative h-36 overflow-hidden bg-gray-100">
                  <Image
                    src={primaryImage}
                    alt={`${car.make} ${car.model}`}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Info */}
                <div className="p-3 flex flex-col flex-1">
                  <h3 className="font-bold text-[#0A1F44] text-sm leading-tight">
                    {car.make} {car.model}
                  </h3>

                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users size={11} className="text-[#C9A84C]" />
                      {car.seats} Seats
                    </span>
                    <span className="flex items-center gap-1">
                      <Settings size={11} className="text-[#C9A84C]" />
                      {car.transmission === 'auto' ? 'Automatic' : 'Manual'}
                    </span>
                  </div>

                  <div className="mt-1.5 text-xs text-gray-500">
                    From{' '}
                    <span className="font-bold text-[#0A1F44] text-sm">
                      {dailyRate ? formatCurrency(dailyRate) : '—'}
                    </span>
                    {' '}/ day
                  </div>

                  <a
                    href={buildWhatsAppUrl(car, dailyRate)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 block w-full text-center bg-[#C9A84C] hover:bg-[#b8963e] text-[#0A1F44] font-bold text-xs py-2 rounded-lg uppercase tracking-wide transition-colors"
                  >
                    Book Now
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
