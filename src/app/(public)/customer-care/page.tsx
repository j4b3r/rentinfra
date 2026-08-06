import { Metadata } from 'next'
import Link from 'next/link'
import { Phone, MessageCircle, MapPin, Clock, HelpCircle, FileText, Car } from 'lucide-react'
import { getSettingsMap } from '@/lib/settings'
import { absoluteUrl } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Customer Care | RentInfra Car Rental',
  description: 'Get help with your RentInfra booking. Contact us by phone, WhatsApp or visit our office.',
  keywords: 'car rental customer service, car rental help, contact car rental',
  openGraph: {
    title: 'Customer Care — RentInfra',
    description: 'We\'re here to help. Contact our team by phone, WhatsApp or visit us.',
    url: absoluteUrl('/customer-care'),
  },
}

export default async function CustomerCarePage() {
  const settings = await getSettingsMap()
  const phone = settings.company_phone || '+10000000000'
  const whatsapp = settings.social_whatsapp || `https://wa.me/${phone.replace(/[^0-9]/g, '')}`
  const address = settings.company_address || '123 Example Street, Suite 100, 00000 Demo City, Demo Country'
  const officeHoursOpen = settings.office_hours_open || '08:00'
  const officeHoursClose = settings.office_hours_close || '20:00'

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-[#0A1F44] py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white">Customer Care</h1>
          <p className="text-gray-400 mt-2">We&apos;re here to help — before, during and after your rental</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* Contact options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a href={whatsapp} target="_blank" rel="noopener noreferrer"
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:border-green-400 transition-colors group">
            <MessageCircle size={28} className="text-green-500 mb-3" />
            <h3 className="font-bold text-[#0A1F44] mb-1">WhatsApp — Fastest Response</h3>
            <p className="text-gray-500 text-sm mb-2">Message us any time — we typically reply within minutes.</p>
            <p className="text-green-600 font-semibold text-sm group-hover:underline">{phone}</p>
          </a>

          <a href={`tel:${phone}`}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:border-[#C9A84C] transition-colors group">
            <Phone size={28} className="text-[#C9A84C] mb-3" />
            <h3 className="font-bold text-[#0A1F44] mb-1">Call Us</h3>
            <p className="text-gray-500 text-sm mb-2">Speak directly with our team during office hours.</p>
            <p className="text-[#C9A84C] font-semibold text-sm">{phone}</p>
          </a>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <Clock size={28} className="text-[#0A1F44] mb-3" />
            <h3 className="font-bold text-[#0A1F44] mb-1">Office Hours</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex justify-between"><span>Mon – Sun</span><span className="font-medium">{officeHoursOpen} – {officeHoursClose}</span></div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <MapPin size={28} className="text-[#0A1F44] mb-3" />
            <h3 className="font-bold text-[#0A1F44] mb-1">Our Office</h3>
            <address className="not-italic text-sm text-gray-600 leading-relaxed">
              {address}
            </address>
          </div>
        </div>

        {/* Quick links */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-[#0A1F44] mb-4 text-lg">Quick Help</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link href="/my-booking"
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-[#C9A84C] hover:bg-[#C9A84C]/5 transition-colors">
              <Car size={18} className="text-[#C9A84C] shrink-0" />
              <span className="text-sm font-medium text-[#0A1F44]">Find My Booking</span>
            </Link>
            <Link href="/faq"
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-[#C9A84C] hover:bg-[#C9A84C]/5 transition-colors">
              <HelpCircle size={18} className="text-[#C9A84C] shrink-0" />
              <span className="text-sm font-medium text-[#0A1F44]">FAQ</span>
            </Link>
            <Link href="/terms"
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-[#C9A84C] hover:bg-[#C9A84C]/5 transition-colors">
              <FileText size={18} className="text-[#C9A84C] shrink-0" />
              <span className="text-sm font-medium text-[#0A1F44]">Terms & Conditions</span>
            </Link>
          </div>
        </div>

        {/* Emergency */}
        <div className="bg-red-50 border border-red-100 rounded-xl p-6">
          <h2 className="font-bold text-red-700 mb-2">🚨 Emergency / Breakdown</h2>
          <p className="text-red-600 text-sm mb-3">
            All our vehicles include 24/7 roadside assistance. In an emergency:
          </p>
          <ol className="text-sm text-red-700 space-y-1 list-decimal pl-5">
            <li>Call emergency services if needed: <strong>112</strong></li>
            <li>Call us immediately: <a href={`tel:${phone}`} className="font-bold underline">{phone}</a></li>
            <li>Do not move the vehicle until advised</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
