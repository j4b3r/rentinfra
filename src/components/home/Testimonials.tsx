import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    name: 'James & Sarah T.',
    country: '🇬🇧 United Kingdom',
    rating: 5,
    text: 'Absolutely brilliant service. The car was delivered to our hotel — spotless and exactly as described. Best car rental experience we\'ve had. Will definitely book again next summer.',
    car: 'Toyota RAV4',
  },
  {
    name: 'Klaus M.',
    country: '🇩🇪 Germany',
    rating: 5,
    text: 'Sehr professionell und zuverlässig. The team was responsive on WhatsApp and the airport pickup was smooth. Great price for a luxury car — the Mercedes was perfect for our week-long trip.',
    car: 'Mercedes C-Class',
  },
  {
    name: 'María G.',
    country: '🇪🇸 Spain',
    rating: 5,
    text: 'Llevamos usando este servicio tres años consecutivos para nuestras vacaciones. Siempre puntuales, los coches en perfecto estado y el precio muy competitivo. El servicio de entrega en el hotel es comodísimo.',
    car: 'Renault Clio',
  },
  {
    name: 'David L.',
    country: '🇮🇪 Ireland',
    rating: 5,
    text: 'Rented for 10 days. The booking process was simple, the car was immaculate, and when we had a minor query, the WhatsApp response was within minutes. Highly recommend to anyone visiting the area.',
    car: 'Toyota RAV4',
  },
  {
    name: 'Sophie & Marc B.',
    country: '🇫🇷 France',
    rating: 5,
    text: 'Service impeccable. Le véhicule était livré à notre villa à temps. Prix très compétitif par rapport aux grandes agences. Nous reviendrons certainement l\'année prochaine.',
    car: 'Mercedes C-Class',
  },
  {
    name: 'Anna K.',
    country: '🇵🇱 Poland',
    rating: 5,
    text: 'Fantastic experience from start to finish. The online booking was easy, the car was ready, and the staff were so friendly. The GPS addon was well worth it for exploring the local mountain roads.',
    car: 'Renault Clio',
  },
]

export default function Testimonials() {
  return (
    <section className="py-20 bg-[#0A1F44] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#C9A84C]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#C9A84C]/5 rounded-full blur-3xl" />
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-[#C9A84C] text-sm font-semibold uppercase tracking-widest">What Our Customers Say</span>
          <h2 className="text-4xl font-extrabold text-white mt-2">Trusted by Travellers</h2>
          <div className="flex items-center justify-center gap-1 mt-3">
            {[...Array(5)].map((_, i) => <Star key={i} size={18} className="text-[#C9A84C] fill-[#C9A84C]" />)}
            <span className="text-gray-400 text-sm ml-2">5.0 · 500+ happy customers</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <div key={i} className="glass rounded-2xl p-6 card-lift">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex gap-0.5 mb-1">
                    {[...Array(t.rating)].map((_, j) => (
                      <Star key={j} size={14} className="text-[#C9A84C] fill-[#C9A84C]" />
                    ))}
                  </div>
                  <p className="font-bold text-white text-sm">{t.name}</p>
                  <p className="text-gray-400 text-xs">{t.country} · {t.car}</p>
                </div>
                <Quote size={20} className="text-[#C9A84C]/40 shrink-0" />
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">&ldquo;{t.text}&rdquo;</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
