import { createClient } from '@/lib/supabase/server'
import SettingsSection from '@/components/admin/SettingsSection'

const KEYS = ['notify_admin_email', 'notify_new_booking', 'notify_booking_confirm', 'notify_whatsapp_enabled', 'smtp_from_name', 'smtp_from_email']

export default async function NotificationsSettings() {
  const supabase = await createClient()
  const { data } = await supabase.from('settings').select('*').in('key', KEYS)
  const values = Object.fromEntries((data || []).map(s => [s.key, s.value]))

  return (
    <SettingsSection
      title="Notifications"
      description="Configure email and WhatsApp alerts for bookings. Email sending requires SMTP setup in environment variables."
      fields={[
        { key: 'notify_admin_email',     label: 'Admin Alert Email',              type: 'email', placeholder: 'info@rentinfra.com', description: 'Where to send new booking notifications' },
        { key: 'smtp_from_name',         label: 'Email Sender Name',              placeholder: 'RentInfra', description: 'Display name on outgoing emails' },
        { key: 'smtp_from_email',        label: 'Email Sender Address',           type: 'email', placeholder: 'noreply@rentinfra.com' },
        { key: 'notify_new_booking',     label: 'New Booking Alert to Admin',     type: 'toggle', description: 'Send email to admin when a new booking is placed' },
        { key: 'notify_booking_confirm', label: 'Booking Confirmation to Customer', type: 'toggle', description: 'Send confirmation email to customer after booking' },
        { key: 'notify_whatsapp_enabled', label: 'WhatsApp Notification to Customer', type: 'toggle', description: 'Send WhatsApp message on booking (requires Twilio setup)' },
      ]}
      values={values}
    />
  )
}
