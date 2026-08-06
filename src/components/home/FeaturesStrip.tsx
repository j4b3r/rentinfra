import { Plane, Calendar, Percent, Shield } from 'lucide-react'

const features = [
  { icon: Plane, title: 'Airport Pickup', desc: 'On time, every time.' },
  { icon: Calendar, title: 'Flexible Booking', desc: 'Same day booking available.' },
  { icon: Percent, title: 'Weekly Discounts', desc: 'Special rates for longer rentals.' },
  { icon: Shield, title: 'Full Insurance', desc: 'Drive with peace of mind.' },
]

export default function FeaturesStrip() {
  return (
    <section className="bg-white border-t border-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#0A1F44] rounded-xl flex items-center justify-center shrink-0">
                <Icon size={18} className="text-[#C9A84C]" />
              </div>
              <div>
                <p className="font-bold text-[#0A1F44] text-sm">{title}</p>
                <p className="text-gray-400 text-xs mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
