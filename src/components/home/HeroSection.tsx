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
 * The first viewport is the glazing wall itself: a black-barred grid of
 * panes, one lit with the signal accent — the searched-and-found car. The
 * search form sits inside the frame, not floating over a stock photo.
 * Replace the photo pane's source with your own fleet photography.
 */
export default function HeroSection({
  locations,
  fleetCount,
  fromRate,
  headline,
  minAdvanceHours,
}: HeroSectionProps) {
  return (
    <section className="glazing">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-[3px] px-[3px] pb-[3px] pt-[3px] lg:grid-cols-[1.15fr_1fr] lg:gap-[3px]">
        {/* Left: headline pane, seeded glass */}
        <div className="pane pane-seeded flex flex-col justify-between p-6 sm:p-10 lg:p-12">
          <div>
            <h1 className="font-display max-w-xl text-[2.5rem] leading-[0.98] text-[var(--ink)] sm:text-6xl lg:text-[3.75rem]">
              {headline || (
                <>
                  Search.
                  <br />
                  <span className="text-[var(--pane-signal)]">One pane lights up.</span>
                  <br />
                  Drive today.
                </>
              )}
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[var(--ink-soft)]">
              Book online in four steps. No deposit held on your card, free cancellation up to 24
              hours before pick-up, and the price you see is the price you pay.
            </p>
          </div>

          {/* Live inventory as a status readout, not marketing copy */}
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t-2 border-[var(--bar)] pt-5 text-sm">
            <span className="flex items-center gap-2 font-medium text-[var(--ink)]">
              <span className="h-2 w-2 bg-[var(--pane-signal)]" aria-hidden="true" />
              {fleetCount} {fleetCount === 1 ? 'vehicle' : 'vehicles'} available now
            </span>
            {fromRate !== null && (
              <span className="text-[var(--ink-soft)]">
                From{' '}
                <span className="font-display text-lg text-[var(--ink)] tabular-nums">
                  &euro;{fromRate}
                </span>{' '}
                per day
              </span>
            )}
          </div>
        </div>

        {/* Right: photo pane — a real fleet photo behind the grid, not a mood shot */}
        <div className="pane relative min-h-[280px] overflow-hidden lg:min-h-0">
          <Image
            src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1600&q=80"
            alt=""
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-[var(--bar)]/10" />
          {/* Corner tab reads like a specimen label on the pane */}
          <span className="absolute bottom-4 left-4 bg-[var(--bar)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--glass-clear)]">
            The fleet, today
          </span>
        </div>
      </div>

      {/* Search — its own row of the wall, full width, signature moment */}
      <div className="mx-auto max-w-7xl px-[3px] pb-[3px]">
        <SearchPanel locations={locations} minAdvanceHours={minAdvanceHours} />
      </div>
    </section>
  )
}
