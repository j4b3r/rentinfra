import { createClient } from '@/lib/supabase/server'
import SettingsSection from '@/components/admin/SettingsSection'

const KEYS = ['social_facebook', 'social_instagram', 'social_tiktok', 'social_whatsapp']

export default async function SocialMediaSettings() {
  const supabase = await createClient()
  const { data } = await supabase.from('settings').select('*').in('key', KEYS)
  const values = Object.fromEntries((data || []).map(s => [s.key, s.value]))

  return (
    <SettingsSection
      title="Social Media"
      description="Links shown in the website footer and contact pages."
      fields={[
        { key: 'social_facebook',  label: 'Facebook URL',  type: 'url', placeholder: 'https://facebook.com/rentinfra' },
        { key: 'social_instagram', label: 'Instagram URL', type: 'url', placeholder: 'https://instagram.com/rentinfra' },
        { key: 'social_tiktok',    label: 'TikTok URL',    type: 'url', placeholder: 'https://tiktok.com/@rentinfra' },
        { key: 'social_whatsapp',  label: 'WhatsApp Link', type: 'url', placeholder: 'https://wa.me/34697462569', description: 'Format: https://wa.me/[country code][number]' },
      ]}
      values={values}
    />
  )
}
