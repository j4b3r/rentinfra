import { createClient } from '@/lib/supabase/server'
import SettingsSection from '@/components/admin/SettingsSection'

const KEYS = ['min_advance_hours', 'max_booking_days_ahead', 'cancellation_policy_en', 'cancellation_policy_es', 'terms_last_updated']

export default async function BookingPolicySettings() {
  const supabase = await createClient()
  const { data } = await supabase.from('settings').select('*').in('key', KEYS)
  const values = Object.fromEntries((data || []).map(s => [s.key, s.value]))

  return (
    <SettingsSection
      title="Booking Policy"
      description="Advance booking limits and cancellation policy shown to customers."
      fields={[
        { key: 'min_advance_hours',      label: 'Minimum Advance Booking (hours)', type: 'number', placeholder: '2',   description: 'Customers must book at least this many hours before pickup' },
        { key: 'max_booking_days_ahead', label: 'Maximum Days in Advance',         type: 'number', placeholder: '365', description: 'How far ahead customers can make a booking' },
        { key: 'cancellation_policy_en', label: 'Cancellation Policy (English)',   type: 'textarea', placeholder: 'Free cancellation up to 48 hours before pickup...', description: 'Displayed on booking pages and confirmation emails' },
        { key: 'cancellation_policy_es', label: 'Cancellation Policy (Spanish)',   type: 'textarea', placeholder: 'Cancelación gratuita hasta 48 horas antes...', description: 'Shown to Spanish-language customers' },
        { key: 'terms_last_updated',     label: 'Terms Last Updated (date)',       type: 'date', description: 'Shown on the Terms & Conditions page' },
      ]}
      values={values}
    />
  )
}
