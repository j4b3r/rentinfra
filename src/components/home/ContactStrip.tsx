import { Phone, MessageCircle, MapPin, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function ContactStrip() {
  return (
    <section className="py-16 bg-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-[#F8F9FA] via-white to-[#F8F9FA]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#0A1F44] rounded-3xl p-8 md:p-12 relative overflow-hidden">
          {/* Background decoration inside card */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#C9A84C]/8 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-20 w-48 h-48 bg-[#C9A84C]/5 rounded-full blur-2xl translate-y-1/2" />

          <div className="relative flex flex-col lg:flex-row items-center justify-between gap-8">
            <div>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-2">
                Need help choosing<br />
                <span className="gradient-text">the right car?</span>
              </h2>
              <p className="text-gray-400 max-w-sm">Our team is ready to help you find the perfect vehicle for your Costa del Sol adventure.</p>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3 shrink-0">
              <a href="https://wa.me/34697462569" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white px-6 py-3.5 rounded-xl font-semibold transition-all hover:-translate-y-0.5 shadow-lg">
                <MessageCircle size={18} />
                <span>WhatsApp Us</span>
              </a>
              <a href="tel:+34697462569"
                className="flex items-center gap-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-3.5 rounded-xl font-semibold transition-all hover:-translate-y-0.5">
                <Phone size={18} className="text-[#C9A84C]" />
                <span>+34 697 462 569</span>
              </a>
              <Link href="/contact"
                className="flex items-center gap-3 btn-gold text-[#0A1F44] px-6 py-3.5 rounded-xl font-bold transition-all">
                <MapPin size={18} />
                <span>Our Office</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
