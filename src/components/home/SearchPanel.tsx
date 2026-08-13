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
    'w-full border-2 border-[var(--bar)] bg-[var(--glass-clear)] px-3 py-2.5 text-sm text-[var(--ink)] ' +
    'outline-none transition focus:bg-white focus:outline-2 focus:outline-[var(--pane-signal)] focus:outline-offset-[-2px]'

  return (
    <form
      onSubmit={handleSubmit}
      className="glazing grid grid-cols-1 gap-[3px] sm:grid-cols-2 lg:grid-cols-[1.1fr_1fr_1fr_auto]"
      aria-label="Search available cars"
    >
      <div className="pane p-4">
        <label
          htmlFor="search-location"
          className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-soft)]"
        >
          <MapPin size={13} className="text-[var(--pane-signal)]" />
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

      <div className="pane p-4">
        <label
          htmlFor="search-pickup"
          className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-soft)]"
        >
          <CalendarDays size={13} className="text-[var(--pane-signal)]" />
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

      <div className="pane p-4">
        <label
          htmlFor="search-dropoff"
          className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-soft)]"
        >
          <CalendarDays size={13} className="text-[var(--pane-signal)]" />
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

      {/* The lit pane — the one accent color, reserved for the primary action */}
      <div className="pane-lit flex flex-col justify-center p-4">
        <button
          type="submit"
          className="flex h-[42px] w-full items-center justify-center gap-2 bg-[var(--ink-on-signal)] text-sm font-bold uppercase tracking-wide text-[var(--pane-signal)] transition hover:bg-white lg:w-auto lg:px-6"
        >
          <Search size={16} />
          Search
        </button>
        <p className="mt-2.5 text-center text-[11px] text-[var(--ink-on-signal)]/80 lg:text-left">
          {days} {days === 1 ? 'day' : 'days'}
        </p>
      </div>
    </form>
  )
}
