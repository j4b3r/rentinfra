import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms & Conditions | RentInfra Demo Car Rental',
  description: 'Read the full terms and conditions for renting a car with RentInfra Demo.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-[#0A1F44] py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-white">Terms & Conditions</h1>
          <p className="text-gray-400 mt-1 text-sm">Last updated: April 2026</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 prose prose-gray max-w-none
          [&_h2]:text-[#0A1F44] [&_h2]:font-bold [&_h2]:text-lg [&_h2]:mt-8 [&_h2]:mb-3
          [&_p]:text-gray-600 [&_p]:leading-relaxed [&_p]:mb-4
          [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-gray-600 [&_ul]:mb-4">

          {/* TODO: replace company name, address and jurisdiction below with your own business details */}
          <p>These Terms and Conditions govern the rental of vehicles from RentInfra Demo, operating from 123 Example Street, Suite 100, 00000 Demo City, Demo Country. By making a booking, you agree to these terms in full.</p>

          <h2>1. Eligibility</h2>
          <ul>
            <li>The driver must be at least 21 years of age and hold a valid driving licence for a minimum of 1 year.</li>
            <li>Drivers aged 21–24 may be subject to a young driver surcharge.</li>
            <li>A valid passport or national ID card must be presented at vehicle collection.</li>
            <li>A credit or debit card in the driver&apos;s name is required for the security deposit.</li>
          </ul>

          <h2>2. Booking & Payment</h2>
          <ul>
            <li>Bookings are confirmed upon receipt of the booking reference number.</li>
            <li>Payment of the rental amount is due at vehicle collection unless otherwise agreed.</li>
            <li>A security deposit will be held at the time of collection and released upon safe return of the vehicle.</li>
            <li>Prices include basic third-party insurance and unlimited mileage unless stated otherwise.</li>
          </ul>

          <h2>3. Vehicle Collection & Return</h2>
          <ul>
            <li>Vehicles must be collected and returned at the agreed time and location.</li>
            <li>Late returns may incur additional charges at the daily rate.</li>
            <li>The vehicle must be returned in the same condition as collected, with the same fuel level.</li>
            <li>After-hours pickups and returns may be subject to an additional fee.</li>
          </ul>

          <h2>4. Cancellations & Modifications</h2>
          <ul>
            <li>Cancellations made more than 48 hours before the rental start date are fully refunded.</li>
            <li>Cancellations made 24–48 hours before: 50% refund.</li>
            <li>Cancellations made less than 24 hours before: no refund.</li>
            <li>To cancel or modify, contact us at +1 000 000 0000.</li>
          </ul>

          <h2>5. Insurance & Liability</h2>
          <ul>
            <li>All vehicles include basic third-party liability insurance as required by local law.</li>
            <li>Optional full coverage (zero excess) insurance is available as an add-on.</li>
            <li>The renter is liable for any damage not covered by the selected insurance.</li>
            <li>Damage caused by negligence, driving under the influence, or off-road use is excluded from all coverage.</li>
          </ul>

          <h2>6. Prohibited Uses</h2>
          <ul>
            <li>Vehicles may not be driven outside the agreed rental territory without prior written consent.</li>
            <li>Vehicles may not be used for racing, off-road driving, or any illegal purpose.</li>
            <li>Smoking is strictly prohibited in all vehicles.</li>
            <li>Subletting or transferring the vehicle to a third party is not permitted.</li>
          </ul>

          <h2>7. Breakdowns & Accidents</h2>
          <ul>
            <li>In the event of a breakdown, contact us immediately at +1 000 000 0000.</li>
            <li>In the event of an accident, call your local emergency services first, then notify us.</li>
            <li>Do not admit liability to third parties without our consent.</li>
            <li>A fully completed accident report form must be submitted within 24 hours.</li>
          </ul>

          <h2>8. Governing Law</h2>
          {/* TODO: set the governing law / jurisdiction for your own deployment */}
          <p>These Terms are governed by the laws of the rental territory as defined in your agreement. Any disputes shall be subject to the jurisdiction of the courts of that territory.</p>

          <h2>9. Contact</h2>
          <p>RentInfra Demo · 123 Example Street, Suite 100 · 00000 Demo City · Demo Country<br />
          Tel: +1 000 000 0000 · Email: info@rentinfra.com</p>
        </div>
      </div>
    </div>
  )
}
