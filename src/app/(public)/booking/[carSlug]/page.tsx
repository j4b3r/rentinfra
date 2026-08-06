import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import BookingWizard from '@/components/booking/BookingWizard'
import { Car, Addon, Location, Setting } from '@/types'

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ carSlug: string }>
  searchParams: Promise<{ pickup?: string; dropoff?: string; location?: string }>
}) {
  const { carSlug } = await params
  const { pickup, dropoff, location } = await searchParams
  const supabase = await createClient()

  const [carRes, addonsRes, locationsRes, settingsRes, userRes] = await Promise.all([
    supabase
      .from('cars')
      .select('*, car_images(*), price_lists(*, price_list_discounts(*)), car_addons(addon_id)')
      .eq('slug', carSlug)
      .eq('is_active', true)
      .single(),
    supabase.from('addons').select('*').eq('is_active', true),
    supabase.from('locations').select('*').eq('is_active', true),
    supabase.from('settings').select('*'),
    supabase.auth.getUser(),
  ])

  if (!carRes.data) notFound()

  const car = carRes.data as Car & { car_addons?: { addon_id: string }[] }
  const allAddons = (addonsRes.data || []) as Addon[]
  const locations = (locationsRes.data || []) as Location[]
  const settings = Object.fromEntries(
    ((settingsRes.data || []) as Setting[]).map(s => [s.key, s.value])
  )
  const user = userRes.data.user

  // Filter addons: global ones + car-specific ones
  const carAddonIds = car.car_addons?.map((ca: { addon_id: string }) => ca.addon_id) || []
  const availableAddons = allAddons.filter(
    a => a.is_global || carAddonIds.includes(a.id)
  )

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-8">
      <div className="max-w-4xl mx-auto px-4">
        <BookingWizard
          car={car}
          addons={availableAddons}
          locations={locations}
          settings={settings}
          userId={user?.id}
          userEmail={user?.email}
          initialPickupDate={pickup}
          initialDropoffDate={dropoff}
          initialLocationId={location && locations.some(l => l.id === location) ? location : undefined}
        />
      </div>
    </div>
  )
}
