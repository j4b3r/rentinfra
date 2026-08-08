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
          <h1 className="text-2xl font-extrabold text-[#0A1F44]">Cars</h1>
          <p className="text-gray-400 text-sm mt-0.5">{cars?.length || 0} vehicles in fleet</p>
        </div>
        <Link href="/admin/cars/new"
          className="flex items-center gap-2 bg-[#C9A84C] hover:bg-yellow-400 text-[#0A1F44] px-4 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm">
          <Plus size={15} /> Add Car
        </Link>
      </div>

      {/* Cars list */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {cars && cars.length > 0 ? (
          <div className="divide-y divide-gray-50">
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
                <div key={car.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/60 transition-colors group">
                  {/* Image */}
                  <div className="relative w-20 h-14 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                    <Image src={img} alt={`${car.make} ${car.model}`} fill className="object-cover" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-bold text-[#0A1F44]">{car.make} {car.model}</h3>
                      {car.year && <span className="text-xs text-gray-400">{car.year}</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${categoryBadge[car.category] || 'bg-gray-100 text-gray-600'}`}>
                        {car.category}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {car.seats} seats · {car.transmission === 'auto' ? 'Automatic' : 'Manual'} · <span className="capitalize">{car.fuel_type}</span>
                    </p>
                  </div>

                  {/* Price */}
                  <div className="text-right shrink-0 hidden sm:block">
                    <p className="font-extrabold text-[#0A1F44] text-lg">{price ? formatCurrency(price) : '—'}</p>
                    <p className="text-xs text-gray-400">/day</p>
                  </div>

                  {/* Status badges */}
                  <div className="flex flex-col items-start gap-1.5 shrink-0">
                    <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold ${VEHICLE_STATUS_COLOR[status]}`}>
                      {status === 'maintenance' && <Wrench size={10} />}
                      {VEHICLE_STATUS_LABEL[status]}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {car.is_active
                        ? <ToggleRight size={18} className="text-emerald-500" />
                        : <ToggleLeft size={18} className="text-gray-300" />
                      }
                      <span className={`text-xs font-medium ${car.is_active ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {car.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {car.is_available
                        ? <ToggleRight size={18} className="text-blue-500" />
                        : <ToggleLeft size={18} className="text-gray-300" />
                      }
                      <span className={`text-xs font-medium ${car.is_available ? 'text-blue-600' : 'text-gray-400'}`}>
                        {car.is_available ? 'Available' : 'Booked'}
                      </span>
                    </div>
                  </div>

                  {/* Edit */}
                  <Link href={`/admin/cars/${car.id}`}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#0A1F44] border border-gray-200 hover:border-[#0A1F44] px-3 py-1.5 rounded-lg transition-all shrink-0 opacity-0 group-hover:opacity-100">
                    <Pencil size={12} /> Edit
                  </Link>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Plus size={20} className="text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No cars yet</p>
            <Link href="/admin/cars/new" className="mt-2 inline-block text-sm text-[#C9A84C] hover:underline font-semibold">
              Add your first car →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
