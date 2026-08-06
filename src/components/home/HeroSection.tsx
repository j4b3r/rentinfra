import Image from 'next/image'
import SearchPanel from './SearchPanel'

interface Location {
  id: string
  name_en: string
}

interface HeroSectionProps {
  locations: Location[]
  fleetCount: number
  fromRate: number | null
  headline?: string
  minAdvanceHours?: number
}

/**
 * The booking counter is the hero: the search panel is the first and largest
 * thing on the page, sitting on the image edge rather than below the fold.
 * Replace the background image with your own — see the `src` below.
 */
export default function HeroSection({
  locations,
  fleetCount,
  fromRate,
  headline,
  minAdvanceHours,
}: HeroSectionProps) {
  return (
    <section className="relative bg-[#0A1F44]">
      {/* Background — TODO: replace with a photo of your own fleet */}
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=2000&q=80"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Keeps the photograph readable behind the type without erasing it:
            heaviest on the left where the headline sits, lighter on the right. */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A1F44]/95 via-[#0A1F44]/75 to-[#0A1F44]/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A1F44] via-transparent to-[#0A1F44]/30" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-16 sm:px-6 sm:pt-20 lg:px-8">
        <div className="max-w-2xl">
          <h1 className="font-display text-4xl leading-[1.1] text-white sm:text-5xl lg:text-[3.5rem]">
            {headline || (
              <>
                Pick your dates.
                <br />
                <span className="text-[#C9A84C]">Drive the same day.</span>
              </>
            )}
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-gray-300">
            Book online in four steps. No deposit held on your card, free cancellation up to 24
            hours before pick-up, and the price you see is the price you pay.
          </p>

          {/* Live inventory, not marketing claims */}
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <span className="flex items-center gap-2 text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C9A84C]" />
              {fleetCount} {fleetCount === 1 ? 'car' : 'cars'} available now
            </span>
            {fromRate !== null && (
              <span className="text-gray-300">
                From{' '}
                <span className="font-display text-lg text-[#C9A84C] tabular-nums">
                  €{fromRate}
                </span>{' '}
                per day
              </span>
            )}
          </div>
        </div>

        {/* Signature: the counter overlapping the image edge */}
        <div className="mt-10 sm:mt-12">
          <SearchPanel locations={locations} minAdvanceHours={minAdvanceHours} />
        </div>
      </div>
    </section>
  )
}
