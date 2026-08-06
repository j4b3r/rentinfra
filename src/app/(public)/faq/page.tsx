import { createClient } from '@/lib/supabase/server'
import { Metadata } from 'next'
import FaqAccordion from '@/components/FaqAccordion'
import Link from 'next/link'
import { MessageCircle, Phone } from 'lucide-react'
import { absoluteUrl } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Frequently Asked Questions | RentInfra Car Rental',
  description: 'Find answers to common questions about renting a car with us — age requirements, pickup locations, insurance, deposits and more.',
  keywords: 'car rental faq, rent a car questions, car hire help',
  openGraph: {
    title: 'FAQ — RentInfra Car Rental',
    description: 'Answers to common questions about our car rental service.',
    url: absoluteUrl('/faq'),
  },
}

export default async function FaqPage() {
  const supabase = await createClient()
  const { data: faqs } = await supabase.from('faqs').select('*').eq('is_active', true).order('position')

  const categories = [
    { key: 'requirements', label: 'Requirements' },
    { key: 'delivery', label: 'Pickup & Delivery' },
    { key: 'pricing', label: 'Pricing & Deposits' },
    { key: 'bookings', label: 'Bookings' },
    { key: 'fleet', label: 'Our Fleet' },
    { key: 'support', label: 'Support' },
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs?.map(faq => ({
      '@type': 'Question',
      name: faq.question_en,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer_en },
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="min-h-screen bg-[#F8F9FA]">
        <div className="bg-[#0A1F44] py-12 px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold text-white">Frequently Asked Questions</h1>
            <p className="text-gray-400 mt-2">Everything you need to know about renting a car with us</p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          {categories.map(cat => {
            const catFaqs = faqs?.filter(f => f.category === cat.key) || []
            if (catFaqs.length === 0) return null
            return (
              <div key={cat.key} className="mb-8">
                <h2 className="text-lg font-bold text-[#0A1F44] mb-3 flex items-center gap-2">
                  <span className="w-1 h-5 bg-[#C9A84C] rounded-full inline-block" />
                  {cat.label}
                </h2>
                <FaqAccordion faqs={catFaqs} />
              </div>
            )
          })}

          <div className="mt-10 bg-[#0A1F44] rounded-xl p-6 text-center">
            <p className="text-white font-bold mb-1">Still have questions?</p>
            <p className="text-gray-400 text-sm mb-4">Our team is ready to help</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="https://wa.me/10000000000" target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                <MessageCircle size={16} /> WhatsApp Us
              </a>
              <a href="tel:+10000000000"
                className="flex items-center justify-center gap-2 bg-[#C9A84C] text-[#0A1F44] px-5 py-2.5 rounded-lg hover:bg-yellow-400 transition-colors text-sm font-bold">
                <Phone size={16} /> Call Us
              </a>
              <Link href="/customer-care"
                className="flex items-center justify-center gap-2 border border-gray-500 text-gray-300 px-5 py-2.5 rounded-lg hover:border-white hover:text-white transition-colors text-sm">
                Customer Care
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
