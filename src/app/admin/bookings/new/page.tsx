import { createClient } from '@/lib/supabase/server'
import OfflineBookingForm from '@/components/admin/OfflineBookingForm'
import { Car, Location, Addon, Setting } from '@/types'

export default async function NewOfflineBookingPage() {
  const supabase = await createClient()

  const [carsRes, locationsRes, addonsRes, settingsRes] = await Promise.all([
    supabase.from('cars').select('id, make, model, year, license_plate, price_lists(id, name, daily_rate, is_active, season_start)').eq('is_active', true).order('make'),
    supabase.from('locations').select('*').eq('is_active', true).order('name_en'),
    supabase.from('addons').select('*').eq('is_active', true).order('name_en'),
    supabase.from('settings').select('*'),
  ])

  const settings = Object.fromEntries(
    ((settingsRes.data || []) as Setting[]).map(s => [s.key, s.value])
  )

  return (
    <OfflineBookingForm
      cars={(carsRes.data || []) as (Car & { price_lists: { id: string; name: string; daily_rate: number; is_active: boolean; season_start: string | null }[] })[]}
      locations={(locationsRes.data || []) as Location[]}
      addons={(addonsRes.data || []) as Addon[]}
      settings={settings}
    />
  )
}
