import { createClient } from '@/lib/supabase/server'
import SettingsSection from '@/components/admin/SettingsSection'

const KEYS = ['company_name', 'company_phone', 'company_email', 'company_address', 'company_website', 'google_maps_url', 'currency']

export default async function GeneralSettings() {
  const supabase = await createClient()
  const { data } = await supabase.from('settings').select('*').in('key', KEYS)
  const values = Object.fromEntries((data || []).map(s => [s.key, s.value]))

  return (
    <SettingsSection
      title="General"
      description="Your business name, contact details and regional settings."
      fields={[
        { key: 'company_name',    label: 'Company Name',    placeholder: 'RentInfra' },
        { key: 'company_phone',   label: 'Phone / WhatsApp', placeholder: '+34 697 462 569' },
        { key: 'company_email',   label: 'Contact Email',   type: 'email', placeholder: 'info@rentinfra.com' },
        { key: 'company_website', label: 'Website URL',     type: 'url',   placeholder: 'https://rentinfra.com' },
        { key: 'company_address', label: 'Office Address',  type: 'textarea', placeholder: 'Street, City, Country' },
        { key: 'google_maps_url', label: 'Google Maps Link', type: 'url',  placeholder: 'https://maps.google.com/...' },
        { key: 'currency',        label: 'Currency',        placeholder: 'EUR', description: 'ISO currency code, e.g. EUR, USD, GBP' },
      ]}
      values={values}
    />
  )
}
