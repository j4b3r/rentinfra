import { Metadata } from 'next'
import { getSettingsMap } from '@/lib/settings'

export const metadata: Metadata = {
  title: 'Privacy Policy | RentInfra Demo Car Rental',
  description: 'Learn how RentInfra Demo collects, uses and protects your personal data in accordance with applicable data protection law.',
}

export default async function PrivacyPage() {
  // Contact details come from Settings → General so a fork does not publish
  // someone else's address in its legal pages.
  const settings = await getSettingsMap()
  const company = settings.company_name || 'RentInfra'
  const address = settings.company_address || ''
  const email = settings.company_email || ''
  const phone = settings.company_phone || ''
  const contactLine = [email, phone].filter(Boolean).join(' · ')

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-[#0A1F44] py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
          <p className="text-gray-400 mt-1 text-sm">Last updated: April 2026</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 prose prose-gray max-w-none
          [&_h2]:text-[#0A1F44] [&_h2]:font-bold [&_h2]:text-lg [&_h2]:mt-8 [&_h2]:mb-3
          [&_p]:text-gray-600 [&_p]:leading-relaxed [&_p]:mb-4
          [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-gray-600 [&_ul]:mb-4">

          {/* TODO: replace with your own company details, and update GDPR/local law references as needed for your jurisdiction */}
          <p>RentInfra Demo (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to protecting your personal data. This Privacy Policy explains how we collect, use and safeguard your information in accordance with applicable data protection law (e.g. GDPR, or your local equivalent).</p>

          <h2>1. Data Controller</h2>
          <p>{company}{address ? `, ${address}` : ''}.<br />
          {contactLine && <>Contact: {contactLine}</>}</p>

          <h2>2. Data We Collect</h2>
          <ul>
            <li><strong>Account data:</strong> name, email address, phone number, password (encrypted)</li>
            <li><strong>Booking data:</strong> rental dates, pickup/return locations, driver age, driving licence number</li>
            <li><strong>Payment data:</strong> we do not store card details — payments are processed by Stripe/PayPal</li>
            <li><strong>Technical data:</strong> IP address, browser type, pages visited (via cookies)</li>
          </ul>

          <h2>3. How We Use Your Data</h2>
          <ul>
            <li>To process and manage your car rental booking</li>
            <li>To communicate with you about your booking (confirmation, reminders)</li>
            <li>To comply with legal obligations (insurance, tax records)</li>
            <li>To improve our website and services</li>
            <li>To send marketing communications (only with your explicit consent)</li>
          </ul>

          <h2>4. Legal Basis for Processing</h2>
          <ul>
            <li><strong>Contract performance:</strong> processing your booking</li>
            <li><strong>Legal obligation:</strong> insurance and tax requirements</li>
            <li><strong>Legitimate interest:</strong> fraud prevention, website security</li>
            <li><strong>Consent:</strong> marketing communications</li>
          </ul>

          <h2>5. Data Retention</h2>
          <p>We retain booking records for as long as required by applicable tax law in your jurisdiction (commonly several years). Account data is retained until you request deletion. Marketing consent records are retained until withdrawn.</p>

          <h2>6. Your Rights</h2>
          <p>Depending on your jurisdiction, you may have the right to:</p>
          <ul>
            <li>Access the personal data we hold about you</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion (&quot;right to be forgotten&quot;)</li>
            <li>Object to processing for marketing purposes</li>
            <li>Data portability</li>
            <li>Lodge a complaint with your local data protection authority</li>
          </ul>

          <h2>7. Cookies</h2>
          <p>We use essential cookies to maintain your session and language preference. We may also use analytics cookies (with your consent) to understand how visitors use our website. You can withdraw consent at any time via your browser settings.</p>

          <h2>8. Third Parties</h2>
          <p>We share your data with: Supabase (database hosting), Vercel (website hosting), Stripe/PayPal (payment processing). All processors are GDPR compliant. We do not sell your data to third parties.</p>

          <h2>9. Contact</h2>
          <p>For any data protection enquiries{contactLine ? <>: {contactLine}</> : null}</p>
        </div>
      </div>
    </div>
  )
}
