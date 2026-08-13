import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RentInfra – Affordable Car Rental',
  description: 'Rent a car for your next trip. Economy, SUV and luxury vehicles available. Airport pickup and hotel delivery.',
  keywords: 'car rental, rent a car, cheap car hire, alquiler de coches',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} className="h-full">
      <body className="min-h-full flex flex-col antialiased">
        {/*
          THESIS: availability itself is the interface — a glazed grid of panes
          refuses the stock-photo-hero-plus-search-bar template every rental
          site ships.
          OWN-WORLD: matte-black true-thickness glazing bars as the only
          structural ink; clear/seeded glass at rest; one reserved signal-blue
          pane for what matters now; frosted translucent for unavailable
          (surfaces on /cars search results, where "unavailable" is a real
          state — the homepage fleet only ever lists available cars).
          Archivo Expanded display, Space Grotesk UI/body.
          STORY: a visitor sees the wall, searches, and one pane lights up —
          the fastest, most legible "yes, this car, these dates" a rental
          site can show.
          FIRST VIEWPORT: headline pane (seeded glass) beside a fleet photo
          pane, a full-width lit search row beneath, primary action always
          the one signal-blue pane in the grid.
          FORM: assigned direction, index 6 of 7 grounded candidates
          (glazier's color-field partition wall), seed key f9769704.
          FINISH: unreviewed and undocumented is unfinished; this build ends
          with the finish review, the verdict, and DESIGN.md.
        */}
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  )
}
