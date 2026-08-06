import Link from 'next/link'
import { Car } from '@/types'
import CarCard from '@/components/cars/CarCard'
import { ArrowRight, Car as CarIcon } from 'lucide-react'

interface FeaturedCarsProps {
  cars: Car[]
}

export default function FeaturedCars({ cars }: FeaturedCarsProps) {
  return (
    <section className="py-20 bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#C9A84C]/4 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#0A1F44]/3 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-[#0A1F44] rounded-lg flex items-center justify-center">
                <CarIcon size={16} className="text-[#C9A84C]" />
              </div>
              <span className="text-[#C9A84C] text-sm font-semibold uppercase tracking-widest">Our Fleet</span>
            </div>
            <h2 className="text-4xl font-extrabold text-[#0A1F44]">
              Find Your Perfect Car
            </h2>
            <p className="text-gray-500 mt-2 max-w-md">Economy, SUV or luxury — we have the right car for every adventure on the Costa del Sol.</p>
          </div>
          <Link href="/cars"
            className="flex items-center gap-2 text-[#0A1F44] font-semibold hover:text-[#C9A84C] transition-colors group shrink-0">
            View all cars
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Cars grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cars.map((car, i) => (
            <div key={car.id} className="animate-fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <CarCard car={car} />
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <Link href="/cars"
            className="inline-flex items-center gap-3 btn-gold text-[#0A1F44] px-8 py-4 rounded-xl font-bold text-base shadow-lg">
            Browse Full Fleet
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  )
}
