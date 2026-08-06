import { Phone, MessageCircle, MapPin, Clock } from 'lucide-react'
import { getSettingsMap } from '@/lib/settings'

export default async function ContactPage() {
  const settings = await getSettingsMap()
  const phone = settings.company_phone || '+10000000000'
  const whatsapp = settings.social_whatsapp || `https://wa.me/${phone.replace(/[^0-9]/g, '')}`
  const address = settings.company_address || '123 Example Street, Suite 100, 00000 Demo City, Demo Country'
  const companyName = settings.company_name || 'RentInfra Demo'
  const officeHoursOpen = settings.office_hours_open || '08:00'
  const officeHoursClose = settings.office_hours_close || '20:00'
  const mapsUrl = settings.google_maps_url || ''

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-[#0A1F44] py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white">Contact Us</h1>
          <p className="text-gray-400 mt-1">We&apos;re here to help — reach us anytime</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact cards */}
          <a href={`tel:${phone}`}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:border-[#C9A84C] transition-colors group">
            <Phone size={28} className="text-[#C9A84C] mb-3" />
            <h3 className="font-bold text-[#0A1F44] mb-1">Phone</h3>
            <p className="text-xl font-semibold text-gray-700 group-hover:text-[#0A1F44]">{phone}</p>
          </a>

          <a href={whatsapp} target="_blank" rel="noopener noreferrer"
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:border-green-500 transition-colors group">
            <MessageCircle size={28} className="text-green-500 mb-3" />
            <h3 className="font-bold text-[#0A1F44] mb-1">WhatsApp</h3>
            <p className="text-xl font-semibold text-gray-700 group-hover:text-green-600">{phone}</p>
            <p className="text-sm text-gray-400 mt-1">Message us for quick replies</p>
          </a>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <MapPin size={28} className="text-[#C9A84C] mb-3" />
            <h3 className="font-bold text-[#0A1F44] mb-2">Our Office</h3>
            <address className="not-italic text-gray-600 text-sm leading-relaxed">
              {companyName}<br />
              {address}
            </address>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <Clock size={28} className="text-[#C9A84C] mb-3" />
            <h3 className="font-bold text-[#0A1F44] mb-2">Opening Hours</h3>
            <div className="text-gray-600 text-sm space-y-1">
              <div className="flex justify-between">
                <span>Monday – Sunday</span>
                <span className="font-medium">{officeHoursOpen} – {officeHoursClose}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Map — falls back to a generic placeholder embed if `google_maps_url` setting is empty */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <iframe
            title={`${companyName} Location`}
            src={mapsUrl || 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3196.3!2d0!3d0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMMKwMDAnMDAuMCJOIDDCsDAwJzAwLjAiVw!5e0!3m2!1sen!2sus!4v1'}
            width="100%"
            height="300"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
          />
        </div>
      </div>
    </div>
  )
}
