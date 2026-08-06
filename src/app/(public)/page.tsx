import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getSettingsMap } from '@/lib/settings'
import HeroSection from '@/components/home/HeroSection'
import FleetGrid from '@/components/home/FleetGrid'
import IncludedInEveryRental from '@/components/home/IncludedInEveryRental'
import HowItWorks from '@/components/home/HowItWorks'
import Testimonials, { Testimonial } from '@/components/home/Testimonials'
import ClosingCta from '@/components/home/ClosingCta'
import { Car, Location } from '@/types'

export const metadata: Metadata = {
  title: 'RentInfra — Car Rental Booked in Minutes',
  description:
    'Rent a car with insurance and unlimited mileage included. Free cancellation up to 24 hours before pick-up. Book online in four steps.',
  keywords: 'car rental, rent a car, cheap car hire, alquiler de coches, airport car rental',
  openGraph: {
    title: 'RentInfra — Car Rental Booked in Minutes',
    description:
      'Insurance and unlimited mileage included. Free cancellation up to 24 hours before pick-up.',
    url: 'https://rentinfra.com',
    siteName: 'RentInfra',
    // TODO: replace with your own logo/OG image
    images: [{ url: 'https://rentinfra.com/og-image.png', width: 800, height: 800, alt: 'RentInfra' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RentInfra — Car Rental Booked in Minutes',
    description: 'Insurance and unlimited mileage included. Book online in four steps.',
  },
  alternates: { canonical: 'https://rentinfra.com' },
}

export default async function HomePage() {
  const supabase = await createClient()

  const [{ data: cars }, { data: locations }, { data: reviews }, settings] = await Promise.all([
    supabase
      .from('cars')
      .select('*, car_images(*), price_lists(*, price_list_discounts(*))')
      .eq('is_active', true)
      .eq('is_available', true)
      .order('created_at', { ascending: true }),
    supabase.from('locations').select('id, name_en').eq('is_active', true).order('name_en'),
    supabase
      .from('testimonials')
      .select('id, author_name, author_country, author_country_emoji, rating, quote, car_label')
      .eq('is_published', true)
      .order('position')
      .limit(6),
    getSettingsMap(),
  ])

  const fleet = (cars as Car[]) || []

  // Headline figures come from real inventory, never from hardcoded copy.
  const rates = fleet
    .map(
      (car) =>
        (car.price_lists?.find((pl) => pl.is_active && !pl.season_start) || car.price_lists?.[0])
          ?.daily_rate
    )
    .filter((r): r is number => typeof r === 'number')
  const fromRate = rates.length ? Math.min(...rates) : null

  return (
    <>
      <HeroSection
        locations={(locations as Location[]) || []}
        fleetCount={fleet.length}
        fromRate={fromRate}
        headline={settings.hero_headline_en || undefined}
        minAdvanceHours={Number(settings.min_advance_hours) || 2}
      />
      <FleetGrid cars={fleet} />
      <IncludedInEveryRental settings={settings} />
      <HowItWorks />
      <Testimonials
        testimonials={(reviews as Testimonial[]) || []}
        rating={settings.social_proof_rating}
        reviewCount={settings.social_proof_count}
      />
      <ClosingCta settings={settings} />
    </>
  )
}
