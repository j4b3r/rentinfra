import Link from 'next/link'

export default function JourneyBanner() {
  return (
    <section className="relative overflow-hidden" style={{ minHeight: '220px' }}>
      {/* Background: coastal road at dusk — TODO: replace with your own banner image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1571504211935-1c936b327411?w=1600&q=85')`,
        }}
      />
      <div className="absolute inset-0 bg-[#0A1F44]/70" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight">
            YOUR ROAD.<br />
            <span className="text-[#C9A84C] italic">YOUR JOURNEY.</span>
            <br />YOUR STYLE.
          </h2>
          <p className="text-gray-300 text-sm mt-3 max-w-xs leading-relaxed">
            Drive further. Live the vibe. Premium cars for unforgettable days on the road.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
          <a
            href="https://wa.me/10000000000?text=Hi%2C+I%27d+like+to+book+a+car"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3.5 rounded-xl font-bold text-sm shadow-lg transition-colors"
          >
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M11.998 0C5.372 0 0 5.373 0 12c0 2.117.554 4.103 1.522 5.827L.057 23.882a.5.5 0 0 0 .614.641l6.228-1.634A11.945 11.945 0 0 0 12 24c6.626 0 12-5.373 12-12S18.624 0 11.998 0zM12 22c-1.891 0-3.658-.523-5.168-1.433l-.371-.22-3.844 1.008 1.026-3.744-.241-.386A9.935 9.935 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
            </svg>
            Book Now on WhatsApp
          </a>
          <Link
            href="/cars"
            className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white px-6 py-3.5 rounded-xl font-bold text-sm transition-colors"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/>
              <rect x="9" y="11" width="14" height="10" rx="2"/>
              <circle cx="12" cy="16" r="1"/>
              <circle cx="20" cy="16" r="1"/>
            </svg>
            View Fleet
          </Link>
        </div>
      </div>
    </section>
  )
}
