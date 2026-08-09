import { createClient } from '@/lib/supabase/server'
import { getFleetAvailability } from '@/lib/availability'
import { formatDate } from '@/lib/utils'
import CarCard from '@/components/cars/CarCard'
import { Car } from '@/types'
import { Metadata } from 'next'
import { Car as CarIcon, SlidersHorizontal } from 'lucide-react'
import { absoluteUrl } from '@/lib/site'
import { CATEGORIES_BY_TYPE } from '@/lib/vehicles'
import type { VehicleType } from '@/types'

export const metadata: Metadata = {
  title: 'Our Fleet — Cars, Motorbikes & Bicycles | RentInfra',
  description: 'Browse our full fleet — cars, motorbikes and bicycles. Airport pickup and hotel delivery available.',
  keywords: 'car rental fleet, economy car hire, suv rental, luxury car rental',
  alternates: { canonical: absoluteUrl('/cars') },
}

const VEHICLE_TABS: { value: string; label: string; emoji: string }[] = [
  { value: 'all', label: 'All vehicles', emoji: '🚗' },
  { value: 'car', label: 'Cars', emoji: '🚙' },
  { value: 'motorbike', label: 'Motorbikes', emoji: '🏍️' },
  { value: 'bicycle', label: 'Bicycles', emoji: '🚲' },
]

export default async function CarsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; category?: string; pickup?: string; dropoff?: string; location?: string }>
}) {
  const { type, category, pickup, dropoff, location } = await searchParams
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

  // Filter by vehicle type first, then by the categories that belong to it.
  if (type && type !== 'all') {
    query = query.eq('vehicle_type', type)
  }
  if (category && category !== 'all') {
    query = query.eq('category', category)
  }
  // home_location_id is NULL for most cars in a single-branch deployment —
  // that means "available everywhere," not "unset, so exclude it." Only
  // cars explicitly tied to a different branch are filtered out.
  if (location) {
    query = query.or(`home_location_id.is.null,home_location_id.eq.${location}`)
  }

  const { data: cars } = await query.order('created_at')
  const currentType = type || 'all'
  const currentCategory = category || 'all'

  const { data: selectedLocation } = location
    ? await supabase.from('locations').select('name_en').eq('id', location).single()
    : { data: null }

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
          <h1 className="text-4xl font-extrabold text-white">Find your ride</h1>
          <p className="text-gray-400 mt-2">Cars, motorbikes and bicycles — all serviced, insured and ready to go</p>
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
            {VEHICLE_TABS.map(tab => (
              <a key={tab.value}
                href={(() => {
                  const p = new URLSearchParams(dateParams)
                  if (tab.value !== 'all') p.set('type', tab.value)
                  const qs = p.toString()
                  return qs ? `/cars?${qs}` : '/cars'
                })()}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  currentType === tab.value
                    ? 'bg-[#0A1F44] text-white shadow-sm'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}>
                <span>{tab.emoji}</span>
                {tab.label}
              </a>
            ))}
            <span className="ml-auto text-xs text-gray-400">
              {availability
                ? `${(cars?.length || 0) - unavailableCount} of ${cars?.length || 0} available`
                : `${cars?.length || 0} car${cars?.length !== 1 ? 's' : ''} available`}
            </span>
          </div>

          {/* Sub-filter: categories only make sense within one vehicle type */}
          {currentType !== 'all' && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
              {[{ value: 'all', label: 'All' }, ...CATEGORIES_BY_TYPE[currentType as VehicleType]].map(cat => {
                const p = new URLSearchParams(dateParams)
                p.set('type', currentType)
                if (cat.value !== 'all') p.set('category', cat.value)
                return (
                  <a key={cat.value} href={`/cars?${p.toString()}`}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      currentCategory === cat.value
                        ? 'bg-[#C9A84C] text-[#0A1F44]'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}>
                    {cat.label}
                  </a>
                )
              })}
            </div>
          )}

          {/* Say which dates and location these results are for, and how to widen them. */}
          {(availability || selectedLocation) && (
            <p className="mt-3 border-t border-gray-100 pt-3 text-xs text-gray-500">
              {availability && (
                <>
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
                </>
              )}
              {selectedLocation && (
                <>
                  {availability && ' · '}
                  Available at <span className="font-semibold text-[#0A1F44]">{selectedLocation.name_en}</span>
                  {' '}or from any branch-free car
                </>
              )}
              {' · '}
              <a href={currentType === 'all' ? '/cars' : `/cars?type=${currentType}`} className="text-[#C9A84C] hover:underline">
                Clear {selectedLocation && !availability ? 'location' : availability && !selectedLocation ? 'dates' : 'filters'}
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
            <p className="text-gray-500 text-lg">Nothing available in this category right now.</p>
            <a href="/cars" className="mt-4 inline-block text-[#C9A84C] hover:underline font-medium">View the whole fleet →</a>
          </div>
        )}
      </div>
    </div>
  )
}
