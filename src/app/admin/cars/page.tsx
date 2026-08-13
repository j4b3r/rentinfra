import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { formatCurrency } from '@/lib/utils'
import { Plus, Pencil, ToggleLeft, ToggleRight, Wrench } from 'lucide-react'
import { deriveVehicleStatus, VEHICLE_STATUS_LABEL, VEHICLE_STATUS_COLOR } from '@/lib/vehicle-status'

const CAR_PLACEHOLDER: Record<string, string> = {
  economy: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=200&q=60',
  suv: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=200&q=60',
  luxury: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=200&q=60',
}

const categoryBadge: Record<string, string> = {
  economy: 'bg-blue-50 text-blue-700',
  suv: 'bg-emerald-50 text-emerald-700',
  luxury: 'bg-amber-50 text-amber-700',
}

export default async function AdminCars() {
  const supabase = await createClient()

  const today = new Date().toISOString().slice(0, 10)

  const [{ data: cars }, { data: activeBookings }, { data: activeBlocks }] = await Promise.all([
    supabase
      .from('cars')
      .select('*, car_images(*), price_lists(daily_rate, is_active, season_start)')
      .order('created_at'),
    // "Today" for status purposes: pickup_date <= today < dropoff_date.
    supabase
      .from('bookings')
      .select('car_id, pickup_date, dropoff_date')
      .in('status', ['pending', 'confirmed', 'active'])
      .lte('pickup_date', today)
      .gt('dropoff_date', today),
    supabase
      .from('maintenance_blocks')
      .select('car_id, start_date, end_date')
      .lte('start_date', today)
      .gt('end_date', today),
  ])

  const rentedCarIds = new Set((activeBookings || []).map(b => b.car_id))
  const maintenanceCarIds = new Set((activeBlocks || []).map(b => b.car_id))

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--ink)]">Cars</h1>
          <p className="mt-0.5 text-sm text-[var(--ink-soft)]">{cars?.length || 0} vehicles in fleet</p>
        </div>
        <Link href="/admin/cars/new"
          className="btn-signal flex items-center gap-2 px-4 py-2.5 text-sm font-bold">
          <Plus size={15} /> Add Car
        </Link>
      </div>

      {/* Cars list */}
      <div className="op-panel overflow-hidden">
        {cars && cars.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {cars.map((car: {
              id: string; make: string; model: string; year?: number; category: string;
              transmission: string; seats: number; fuel_type: string;
              is_active: boolean; is_available: boolean;
              car_images?: { url: string; is_primary: boolean }[];
              price_lists?: { daily_rate: number; is_active: boolean; season_start?: string }[]
            }) => {
              const img = car.car_images?.find(i => i.is_primary)?.url || car.car_images?.[0]?.url || CAR_PLACEHOLDER[car.category]
              const price = car.price_lists?.find(pl => pl.is_active && !pl.season_start)?.daily_rate
              const status = deriveVehicleStatus({
                isActive: car.is_active,
                hasActiveBooking: rentedCarIds.has(car.id),
                hasActiveMaintenance: maintenanceCarIds.has(car.id),
              })

              return (
                <div key={car.id} className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[var(--glass-paper)]">
                  {/* Image */}
                  <div className="relative h-14 w-20 shrink-0 overflow-hidden bg-[var(--glass-seeded)]">
                    <Image src={img} alt={`${car.make} ${car.model}`} fill className="object-cover" />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-center gap-2">
                      <h3 className="font-bold text-[var(--ink)]">{car.make} {car.model}</h3>
                      {car.year && <span className="text-xs text-[var(--ink-soft)]">{car.year}</span>}
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${categoryBadge[car.category] || 'bg-gray-100 text-gray-600'}`}>
                        {car.category}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--ink-soft)]">
                      {car.seats} seats &middot; {car.transmission === 'auto' ? 'Automatic' : 'Manual'} &middot; <span className="capitalize">{car.fuel_type}</span>
                    </p>
                  </div>

                  {/* Price */}
                  <div className="hidden shrink-0 text-right sm:block">
                    <p className="text-lg font-bold tabular-nums text-[var(--ink)]">{price ? formatCurrency(price) : '—'}</p>
                    <p className="text-xs text-[var(--ink-soft)]">/day</p>
                  </div>

                  {/* Status badges */}
                  <div className="flex shrink-0 flex-col items-start gap-1.5">
                    <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${VEHICLE_STATUS_COLOR[status]}`}>
                      {status === 'maintenance' && <Wrench size={10} />}
                      {VEHICLE_STATUS_LABEL[status]}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {car.is_active
                        ? <ToggleRight size={18} className="text-[var(--pane-signal)]" />
                        : <ToggleLeft size={18} className="text-gray-300" />
                      }
                      <span className={`text-xs font-medium ${car.is_active ? 'text-[var(--ink)]' : 'text-[var(--ink-soft)]'}`}>
                        {car.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {car.is_available
                        ? <ToggleRight size={18} className="text-[var(--pane-signal)]" />
                        : <ToggleLeft size={18} className="text-gray-300" />
                      }
                      <span className={`text-xs font-medium ${car.is_available ? 'text-[var(--ink)]' : 'text-[var(--ink-soft)]'}`}>
                        {car.is_available ? 'Available' : 'Booked'}
                      </span>
                    </div>
                  </div>

                  {/* Edit */}
                  <Link href={`/admin/cars/${car.id}`}
                    className="btn-frame flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-xs opacity-0 transition-opacity group-hover:opacity-100">
                    <Pencil size={12} /> Edit
                  </Link>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-16 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center bg-[var(--glass-seeded)]">
              <Plus size={20} className="text-[var(--ink-soft)]" />
            </div>
            <p className="font-medium text-[var(--ink-soft)]">No cars yet</p>
            <Link href="/admin/cars/new" className="mt-2 inline-block text-sm font-semibold text-[var(--pane-signal)] hover:underline">
              Add your first car &rarr;
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
