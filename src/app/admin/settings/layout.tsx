import SettingsNavLink from '@/components/admin/SettingsNavLink'

const settingsNav = [
  { href: '/admin/settings',                label: 'General',        iconName: 'Building2', desc: 'Company info & contact' },
  { href: '/admin/settings/rental-rules',   label: 'Rental Rules',   iconName: 'Scale',     desc: 'Age, fees & deposits' },
  { href: '/admin/settings/office-hours',   label: 'Office Hours',   iconName: 'Clock',     desc: 'Opening times & fees' },
  { href: '/admin/settings/booking-policy', label: 'Booking Policy', iconName: 'BookOpen',  desc: 'Cancellation & advance limits' },
  { href: '/admin/settings/notifications',  label: 'Notifications',  iconName: 'Bell',      desc: 'Emails & WhatsApp alerts' },
  { href: '/admin/settings/social-media',   label: 'Social Media',   iconName: 'Share2',    desc: 'Facebook, Instagram, TikTok' },
  { href: '/admin/settings/integrations',   label: 'Integrations',   iconName: 'Plug',      desc: 'Email & payment keys' },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[var(--ink)]">Settings</h1>
        <p className="mt-0.5 text-sm text-[var(--ink-soft)]">Manage your business configuration</p>
      </div>

      <div className="flex items-start gap-5">
        {/* Sidebar */}
        <nav className="op-panel w-52 shrink-0 overflow-hidden">
          {settingsNav.map(item => (
            <SettingsNavLink key={item.href} {...item} />
          ))}
        </nav>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {children}
        </div>
      </div>
    </div>
  )
}
