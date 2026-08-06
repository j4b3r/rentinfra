import { createClient } from '@/lib/supabase/server'
import { getFleetAvailability } from '@/lib/availability'
import { formatDate } from '@/lib/utils'
import CarCard from '@/components/cars/CarCard'
import { Car } from '@/types'
import { Metadata } from 'next'
import { Car as CarIcon, SlidersHorizontal } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Our Fleet — Car Rental | RentInfra',
  description: 'Browse our full fleet of rental cars. Economy from €45/day, SUV from €85/day, Luxury from €150/day. Airport pickup and hotel delivery.',
  keywords: 'car rental fleet, economy car hire, suv rental, luxury car rental',
  alternates: { canonical: 'https://rentinfra.com/cars' },
}

const categories = [
  { value: 'all', label: 'All Cars', emoji: '🚗' },
  { value: 'economy', label: 'Economy', emoji: '⚡' },
  { value: 'suv', label: 'SUV', emoji: '🚙' },
  { value: 'luxury', label: 'Luxury', emoji: '✨' },
]

export default async function CarsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; pickup?: string; dropoff?: string; location?: string }>
}) {
  const { category, pickup, dropoff, location } = await searchParams
  const supabase = await createClient()

  // Dates chosen on the homepage travel with every link so the booking
  // wizard opens on the range the visitor already picked.
  const dateParams = new URLSearchParams()
  if (pickup) dateParams.set('pickup', pickup)
  if (dropoff) dateParams.set('dropoff', dropoff)
  if (location) dateParams.set('location', location)
  const bookingQuery = dateParams.toString()

  const rentalDays =
    pickup && dropoff
      ? Math.max(
          1,
          Math.round(
            (new Date(`${dropoff}T00:00:00`).getTime() - new Date(`${pickup}T00:00:00`).getTime()) /
              86400000
          )
        )
      : null

  let query = supabase
    .from('cars')
    .select('*, car_images(*), price_lists(*, price_list_discounts(*))')
    .eq('is_active', true)

  if (category && category !== 'all') {
    query = query.eq('category', category)
  }

  const { data: cars } = await query.order('created_at')
  const current = category || 'all'

  // When dates were searched, mark which cars are already taken so the customer
  // sees it here rather than after filling in the whole booking wizard.
  const availability =
    pickup && dropoff ? await getFleetAvailability(supabase, pickup, dropoff) : null
  const unavailableCount = availability
    ? (cars || []).filter(c => availability.has(c.id)).length
    : 0

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Header */}
      <div className="bg-[#0A1F44] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C9A84C]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-[#C9A84C]/20 rounded-lg flex items-center justify-center">
              <CarIcon size={16} className="text-[#C9A84C]" />
            </div>
            <span className="text-[#C9A84C] text-sm font-semibold uppercase tracking-widest">Our Fleet</span>
          </div>
          <h1 className="text-4xl font-extrabold text-white">Find Your Perfect Car</h1>
          <p className="text-gray-400 mt-2">Choose from our handpicked fleet — all serviced, insured and ready to go</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-8">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-gray-400 mr-2">
              <SlidersHorizontal size={14} />
              <span className="text-sm font-medium">Filter:</span>
            </div>
            {categories.map(cat => (
              <a key={cat.value}
                href={(() => {
                  const p = new URLSearchParams(dateParams)
                  if (cat.value !== 'all') p.set('category', cat.value)
                  const qs = p.toString()
                  return qs ? `/cars?${qs}` : '/cars'
                })()}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  current === cat.value
                    ? 'bg-[#0A1F44] text-white shadow-sm'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}>
                <span>{cat.emoji}</span>
                {cat.label}
              </a>
            ))}
            <span className="ml-auto text-xs text-gray-400">
              {availability
                ? `${(cars?.length || 0) - unavailableCount} of ${cars?.length || 0} available`
                : `${cars?.length || 0} car${cars?.length !== 1 ? 's' : ''} available`}
            </span>
          </div>

          {/* Say which dates these results are for, and how to widen them. */}
          {availability && (
            <p className="mt-3 border-t border-gray-100 pt-3 text-xs text-gray-500">
              Showing availability for{' '}
              <span className="font-semibold text-[#0A1F44]">
                {formatDate(pickup!)} – {formatDate(dropoff!)}
              </span>
              {unavailableCount > 0 && (
                <>
                  {' · '}
                  {unavailableCount} car{unavailableCount !== 1 ? 's are' : ' is'} already booked
                </>
              )}
              {' · '}
              <a href={current === 'all' ? '/cars' : `/cars?category=${current}`} className="text-[#C9A84C] hover:underline">
                Clear dates
              </a>
            </p>
          )}
        </div>

        {/* Cars Grid */}
        {cars && cars.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cars.map((car, i) => (
              <div key={car.id} className="animate-fade-up" style={{ animationDelay: `${i * 0.08}s` }}>
                <CarCard
                  car={car as Car}
                  bookingQuery={bookingQuery}
                  rentalDays={rentalDays}
                  unavailable={availability?.has(car.id) ?? false}
                  nextFreeDate={availability?.get(car.id)?.nextFree ?? null}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🚗</div>
            <p className="text-gray-500 text-lg">No cars available in this category right now.</p>
            <a href="/cars" className="mt-4 inline-block text-[#C9A84C] hover:underline font-medium">View all cars →</a>
          </div>
        )}
      </div>
    </div>
  )
}
