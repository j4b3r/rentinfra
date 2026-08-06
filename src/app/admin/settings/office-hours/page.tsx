import { createClient } from '@/lib/supabase/server'
import SettingsSection from '@/components/admin/SettingsSection'

const KEYS = ['office_hours_open', 'office_hours_close', 'after_hours_fee']

export default async function OfficeHoursSettings() {
  const supabase = await createClient()
  const { data } = await supabase.from('settings').select('*').in('key', KEYS)
  const values = Object.fromEntries((data || []).map(s => [s.key, s.value]))

  return (
    <SettingsSection
      title="Office Hours"
      description="When your office is open and fees for outside-hours requests."
      fields={[
        { key: 'office_hours_open',  label: 'Opening Time', type: 'time', description: 'Shown on website and used for after-hours fee logic' },
        { key: 'office_hours_close', label: 'Closing Time', type: 'time', description: 'Pickups/drop-offs after this time incur the after-hours fee' },
        { key: 'after_hours_fee',    label: 'After-Hours Fee (€)', type: 'number', placeholder: '30', description: 'Added to bookings with pickup or return outside office hours' },
      ]}
      values={values}
    />
  )
}
