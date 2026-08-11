'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { CalendarDays, MapPin, Search } from 'lucide-react'

interface Location {
  id: string
  name_en: string
}

interface SearchPanelProps {
  locations: Location[]
  minAdvanceHours?: number
}

/** Local YYYY-MM-DD — avoids the UTC shift that toISOString() introduces. */
function toDateInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export default function SearchPanel({ locations, minAdvanceHours = 2 }: SearchPanelProps) {
  const router = useRouter()

  // Date.now() is impure, so it can't run directly in the render body — the
  // lazy useState initializer form runs it exactly once, on mount, which is
  // what "the earliest bookable date" actually needs. Kept as state (not
  // recomputed per render) so the pickup <input min> and both default dates
  // below all agree on the same "now".
  const [earliest] = useState(() => new Date(Date.now() + minAdvanceHours * 3600 * 1000))
  const [pickup, setPickup] = useState(() => toDateInput(earliest))
  const [dropoff, setDropoff] = useState(() => {
    const defaultDropoff = new Date(earliest)
    defaultDropoff.setDate(defaultDropoff.getDate() + 3)
    return toDateInput(defaultDropoff)
  })
  const [locationId, setLocationId] = useState(locations[0]?.id ?? '')

  // Keep the range valid: a pickup past the return pushes the return with it.
  function handlePickupChange(value: string) {
    setPickup(value)
    if (value >= dropoff) {
      const next = new Date(`${value}T00:00:00`)
      next.setDate(next.getDate() + 1)
      setDropoff(toDateInput(next))
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams({ pickup, dropoff })
    if (locationId) params.set('location', locationId)
    router.push(`/cars?${params.toString()}`)
  }

  const days = Math.max(
    1,
    Math.round(
      (new Date(`${dropoff}T00:00:00`).getTime() - new Date(`${pickup}T00:00:00`).getTime()) / 86400000
    )
  )

  const fieldClass =
    'w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-[#0B1220] ' +
    'outline-none transition focus:border-[#0A1F44] focus:ring-2 focus:ring-[#0A1F44]/15'

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border-t-2 border-t-[#C9A84C] bg-white p-5 shadow-[0_20px_50px_-20px_rgba(10,31,68,0.45)] sm:p-6"
      aria-label="Search available cars"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.1fr_1fr_1fr_auto]">
        <div>
          <label
            htmlFor="search-location"
            className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500"
          >
            <MapPin size={13} className="text-[#C9A84C]" />
            Pick-up location
          </label>
          <select
            id="search-location"
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            className={fieldClass}
          >
            {locations.length === 0 && <option value="">Any location</option>}
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name_en}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="search-pickup"
            className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500"
          >
            <CalendarDays size={13} className="text-[#C9A84C]" />
            Pick-up
          </label>
          <input
            id="search-pickup"
            type="date"
            value={pickup}
            min={toDateInput(earliest)}
            onChange={(e) => handlePickupChange(e.target.value)}
            className={fieldClass}
          />
        </div>

        <div>
          <label
            htmlFor="search-dropoff"
            className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500"
          >
            <CalendarDays size={13} className="text-[#C9A84C]" />
            Return
          </label>
          <input
            id="search-dropoff"
            type="date"
            value={dropoff}
            min={pickup}
            onChange={(e) => setDropoff(e.target.value)}
            className={fieldClass}
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            className="btn-gold flex h-[42px] w-full items-center justify-center gap-2 rounded-lg px-6 text-sm font-bold uppercase tracking-wide text-[#0A1F44] lg:w-auto"
          >
            <Search size={16} />
            Search
          </button>
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-500">
        {days} {days === 1 ? 'day' : 'days'} · Free cancellation up to 24 hours before pick-up
      </p>
    </form>
  )
}
