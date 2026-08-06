import { createClient } from '@/lib/supabase/server'
import SettingsSection from '@/components/admin/SettingsSection'

const KEYS = ['min_driver_age', 'min_license_years', 'young_driver_surcharge_per_day', 'second_driver_fee', 'deposit_percentage', 'tax_rate', 'after_hours_fee']

export default async function RentalRulesSettings() {
  const supabase = await createClient()
  const { data } = await supabase.from('settings').select('*').in('key', KEYS)
  const values = Object.fromEntries((data || []).map(s => [s.key, s.value]))

  return (
    <SettingsSection
      title="Rental Rules"
      description="Driver requirements, surcharges, deposits and tax settings."
      fields={[
        { key: 'min_driver_age',               label: 'Minimum Driver Age',             type: 'number', placeholder: '21', description: 'Drivers below this age cannot book' },
        { key: 'min_license_years',            label: 'Minimum License Years',          type: 'number', placeholder: '1',  description: 'Minimum years the driver must hold a license' },
        { key: 'young_driver_surcharge_per_day', label: 'Young Driver Surcharge (€/day)', type: 'number', placeholder: '10', description: 'Extra daily charge for drivers under 25' },
        { key: 'second_driver_fee',            label: 'Second Driver Fee (€)',          type: 'number', placeholder: '50', description: 'Flat fee for adding a second driver' },
        { key: 'deposit_percentage',           label: 'Deposit Percentage (%)',         type: 'number', placeholder: '20', description: 'Percentage of total booking taken as deposit' },
        { key: 'after_hours_fee',              label: 'After-Hours Fee (€)',            type: 'number', placeholder: '30', description: 'Extra fee for pickup/delivery outside office hours' },
        { key: 'tax_rate',                     label: 'Tax Rate / IVA (%)',             type: 'number', placeholder: '0',  description: 'Applied to total booking amount' },
      ]}
      values={values}
    />
  )
}
