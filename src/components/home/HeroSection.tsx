'use client'

export default function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden" style={{ height: '380px' }}>
      {/* Generic coastal road background — TODO: replace with your own hero image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1591293771866-3e96a60916a5?w=1600&q=90')`,
        }}
      />
      {/* Subtle warm overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-black/10" />

      {/* Centered wordmark — TODO: replace with your own logo image */}
      <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
        <span className="text-white text-5xl sm:text-6xl font-black drop-shadow-2xl tracking-tight">
          RentInfra
        </span>
        <span className="text-white/90 text-lg mt-2 drop-shadow-lg">
          Affordable Car Rental
        </span>
      </div>
    </section>
  )
}
