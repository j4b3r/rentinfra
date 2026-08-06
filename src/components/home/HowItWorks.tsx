import { Search, CalendarCheck, Package, Key } from 'lucide-react'

const steps = [
  { icon: Search, title: 'Choose Your Car', desc: 'Browse our fleet of economy, SUV and luxury vehicles. Filter by category and compare prices.' },
  { icon: CalendarCheck, title: 'Pick Dates & Location', desc: 'Select pickup and return dates. We deliver to Málaga Airport, your hotel, or our office.' },
  { icon: Package, title: 'Add Extras', desc: 'GPS, full insurance, baby seat, additional driver — everything you need for a perfect trip.' },
  { icon: Key, title: 'Hit the Road', desc: 'Confirm your booking and receive your reference instantly. We take care of everything else.' },
]

export default function HowItWorks() {
  return (
    <section className="py-20 bg-[#F8F9FA] relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.02]"
        style={{ backgroundImage: 'radial-gradient(#0A1F44 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-[#C9A84C] text-sm font-semibold uppercase tracking-widest">Simple Process</span>
          <h2 className="text-4xl font-extrabold text-[#0A1F44] mt-2">How It Works</h2>
          <p className="text-gray-500 mt-3 max-w-md mx-auto">Book your rental car in minutes — online, 24/7, no paperwork needed.</p>
        </div>

        <div className="relative">
          {/* Connecting line */}
          <div className="hidden lg:block absolute top-12 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-transparent via-[#C9A84C]/40 to-transparent" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
            {steps.map((step, i) => (
              <div key={i} className="relative group">
                {/* Step number background */}
                <div className="flex flex-col items-center text-center bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-lift h-full">
                  {/* Icon circle */}
                  <div className="relative mb-5">
                    <div className="w-16 h-16 bg-[#0A1F44] rounded-2xl flex items-center justify-center shadow-lg group-hover:bg-[#C9A84C] transition-colors duration-300">
                      <step.icon size={26} className="text-[#C9A84C] group-hover:text-[#0A1F44] transition-colors duration-300" />
                    </div>
                    {/* Step number badge */}
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#C9A84C] rounded-full flex items-center justify-center">
                      <span className="text-[#0A1F44] text-xs font-extrabold">{i + 1}</span>
                    </div>
                  </div>

                  <h3 className="font-bold text-[#0A1F44] text-base mb-2">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
