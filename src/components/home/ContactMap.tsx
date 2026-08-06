import { MessageCircle, MapPin, Mail, Clock } from 'lucide-react'

interface ContactMapProps {
  settings?: Record<string, string>
}

export default function ContactMap({ settings = {} }: ContactMapProps) {
  const phone = settings.company_phone || '+10000000000'
  const whatsapp = settings.social_whatsapp || `https://wa.me/${phone.replace(/[^0-9]/g, '')}`
  const address = settings.company_address || '123 Example Street, Suite 100, 00000 Demo City, Demo Country'
  const email = settings.company_email || 'info@rentinfra.com'
  const officeHoursOpen = settings.office_hours_open || '08:00'
  const officeHoursClose = settings.office_hours_close || '20:00'
  const mapsUrl = settings.google_maps_url || ''

  return (
    <section className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-2xl overflow-hidden shadow-md border border-gray-200">

          {/* Left: Contact details */}
          <div className="bg-white p-8">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#C9A84C] mb-5">
              Address &amp; Contact Information
            </h2>
            <div className="space-y-5">
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 group"
              >
                <div className="w-9 h-9 bg-green-500 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <MessageCircle size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">WhatsApp / Call</p>
                  <p className="text-[#0A1F44] font-bold group-hover:text-green-600 transition-colors">{phone}</p>
                </div>
              </a>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-red-500 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Address</p>
                  <p className="text-[#0A1F44] font-medium text-sm leading-snug">{address}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-[#0A1F44] rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <Mail size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</p>
                  <a href={`mailto:${email}`} className="text-[#0A1F44] font-medium hover:text-[#C9A84C] transition-colors">
                    {email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-[#C9A84C] rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <Clock size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Working Hours</p>
                  <p className="text-[#0A1F44] font-medium">Mon – Sun {officeHoursOpen} – {officeHoursClose}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Google Maps embed — falls back to a generic placeholder embed if `google_maps_url` setting is empty */}
          <div className="h-64 lg:h-auto min-h-[280px]">
            <iframe
              src={mapsUrl || 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3198.6!2d0!3d0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0!2sRentInfra+Demo!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus&q=RentInfra+Demo,+123+Example+Street,+Demo+City'}
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: '280px' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="RentInfra location"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
