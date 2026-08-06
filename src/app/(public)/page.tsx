import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getSettingsMap } from '@/lib/settings'
import HeroSection from '@/components/home/HeroSection'
import ContactMap from '@/components/home/ContactMap'
import FleetGrid from '@/components/home/FleetGrid'
import JourneyBanner from '@/components/home/JourneyBanner'
import FeaturesStrip from '@/components/home/FeaturesStrip'
import HowItWorks from '@/components/home/HowItWorks'
import Testimonials from '@/components/home/Testimonials'
import { Car } from '@/types'

export const metadata: Metadata = {
  title: 'RentInfra — Affordable Car Rental',
  description: 'Rent a car from €45/day. Economy, SUV and luxury vehicles. Airport pickup, hotel delivery. Book online in minutes.',
  keywords: 'car rental, rent a car, cheap car hire, alquiler de coches, airport car rental',
  openGraph: {
    title: 'RentInfra — Affordable Car Rental',
    description: 'Rent a car from €45/day. Airport pickup and hotel delivery available.',
    url: 'https://rentinfra.com',
    siteName: 'RentInfra',
    // TODO: replace with your own logo/OG image
    images: [{ url: 'https://rentinfra.com/og-image.png', width: 800, height: 800, alt: 'RentInfra' }],
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'RentInfra — Affordable Car Rental', description: 'Rent a car from €45/day.' },
  alternates: { canonical: 'https://rentinfra.com' },
}

export default async function HomePage() {
  const supabase = await createClient()

  const [{ data: cars }, settings] = await Promise.all([
    supabase
      .from('cars')
      .select('*, car_images(*), price_lists(*, price_list_discounts(*))')
      .eq('is_active', true)
      .eq('is_available', true)
      .order('created_at', { ascending: true }),
    getSettingsMap(),
  ])

  return (
    <>
      <HeroSection />
      <ContactMap settings={settings} />
      <FleetGrid cars={(cars as Car[]) || []} />
      <JourneyBanner />
      <FeaturesStrip />
      <HowItWorks />
      <Testimonials />
    </>
  )
}
