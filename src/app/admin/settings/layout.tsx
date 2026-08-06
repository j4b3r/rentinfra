import SettingsNavLink from '@/components/admin/SettingsNavLink'

const settingsNav = [
  { href: '/admin/settings',                label: 'General',        iconName: 'Building2', desc: 'Company info & contact' },
  { href: '/admin/settings/rental-rules',   label: 'Rental Rules',   iconName: 'Scale',     desc: 'Age, fees & deposits' },
  { href: '/admin/settings/office-hours',   label: 'Office Hours',   iconName: 'Clock',     desc: 'Opening times & fees' },
  { href: '/admin/settings/booking-policy', label: 'Booking Policy', iconName: 'BookOpen',  desc: 'Cancellation & advance limits' },
  { href: '/admin/settings/notifications',  label: 'Notifications',  iconName: 'Bell',      desc: 'Emails & WhatsApp alerts' },
  { href: '/admin/settings/social-media',   label: 'Social Media',   iconName: 'Share2',    desc: 'Facebook, Instagram, TikTok' },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0A1F44]">Settings</h1>
        <p className="text-gray-400 text-sm mt-0.5">Manage your business configuration</p>
      </div>

      <div className="flex gap-5 items-start">
        {/* Sidebar */}
        <nav className="w-52 shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {settingsNav.map(item => (
            <SettingsNavLink key={item.href} {...item} />
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  )
}
