import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Users, DoorOpen, Fuel, Settings, Luggage, Wifi, Navigation, Car } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Car as CarType } from '@/types'

const CAR_PLACEHOLDER: Record<string, string> = {
  economy: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&q=80',
  suv: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80',
  luxury: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=800&q=80',
}

export default async function CarDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ pickup?: string; dropoff?: string; location?: string }>
}) {
  const { slug } = await params
  const { pickup, dropoff, location } = await searchParams
  const supabase = await createClient()

  // Keep the searched dates attached so the wizard opens prefilled.
  const bookingParams = new URLSearchParams()
  if (pickup) bookingParams.set('pickup', pickup)
  if (dropoff) bookingParams.set('dropoff', dropoff)
  if (location) bookingParams.set('location', location)
  const bookingQuery = bookingParams.toString()

  const { data: car } = await supabase
    .from('cars')
    .select('*, car_images(*), price_lists(*, price_list_discounts(*))')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!car) notFound()

  const typedCar = car as CarType

  const primaryImage = typedCar.car_images?.find(img => img.is_primary)?.url
    || typedCar.car_images?.[0]?.url
    || CAR_PLACEHOLDER[typedCar.category]

  const activePriceList = typedCar.price_lists?.find(pl => pl.is_active && !pl.season_start)
    || typedCar.price_lists?.[0]

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Images */}
          <div>
            <div className="relative h-72 lg:h-96 rounded-xl overflow-hidden">
              <Image src={primaryImage} alt={`${typedCar.make} ${typedCar.model}`} fill className="object-cover" />
            </div>
          </div>

          {/* Details */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className="text-xs uppercase font-semibold text-[#C9A84C] tracking-wide">{typedCar.category}</span>
                <h1 className="text-2xl font-bold text-[#0A1F44]">{typedCar.make} {typedCar.model}</h1>
                {typedCar.year && <p className="text-gray-400 text-sm">{typedCar.year}</p>}
              </div>
              {activePriceList && (
                <div className="text-right">
                  <div className="text-3xl font-bold text-[#0A1F44]">{formatCurrency(activePriceList.daily_rate)}</div>
                  <div className="text-gray-400 text-sm">per day</div>
                </div>
              )}
            </div>

            {typedCar.description_en && (
              <p className="text-gray-600 text-sm mt-3 mb-5">{typedCar.description_en}</p>
            )}

            {/* Specs grid */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { icon: Users, label: `${typedCar.seats} Seats` },
                { icon: DoorOpen, label: `${typedCar.doors} Doors` },
                { icon: Settings, label: typedCar.transmission === 'auto' ? 'Automatic' : 'Manual' },
                { icon: Fuel, label: typedCar.fuel_type.charAt(0).toUpperCase() + typedCar.fuel_type.slice(1) },
                { icon: Luggage, label: `${typedCar.luggage_small + typedCar.luggage_large} Bags` },
                { icon: typedCar.ac ? Wifi : Car, label: typedCar.ac ? 'Air Conditioning' : 'No AC' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                  <Icon size={15} className="text-[#C9A84C]" /> {label}
                </div>
              ))}
            </div>

            {/* Discounts */}
            {activePriceList?.price_list_discounts && activePriceList.price_list_discounts.length > 0 && (
              <div className="mb-5 p-3 bg-[#0A1F44]/5 rounded-lg">
                <p className="text-xs font-semibold text-[#0A1F44] mb-2">Available Discounts</p>
                <div className="space-y-1">
                  {activePriceList.price_list_discounts.map(d => (
                    <div key={d.id} className="text-xs text-[#C9A84C] font-medium">{d.label_en}</div>
                  ))}
                </div>
              </div>
            )}

            <Link
              href={bookingQuery ? `/booking/${typedCar.slug}?${bookingQuery}` : `/booking/${typedCar.slug}`}
              className="w-full block text-center bg-[#C9A84C] text-[#0A1F44] py-3 rounded-lg font-bold text-lg hover:bg-yellow-400 transition-colors"
            >
              Book This Car
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
