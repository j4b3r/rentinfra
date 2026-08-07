import Link from 'next/link'
import { CheckCircle, Clock } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { SITE_HOST } from '@/lib/site'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Payment received | RentInfra',
  robots: { index: false, follow: false },
}

/**
 * Where Stripe returns the customer after a successful payment.
 *
 * The webhook is what actually marks the booking paid, and it can land a
 * moment after the redirect. So this page reads the booking and tells the
 * truth either way rather than claiming success it cannot yet see.
 */
export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>
}) {
  const { ref } = await searchParams

  const supabase = await createAdminClient()
  const { data: booking } = ref
    ? await supabase
        .from('bookings')
        .select('reference, guest_name, payment_status, amount_paid, total_amount, status')
        .eq('reference', ref)
        .single()
    : { data: null }

  const isPaid =
    booking?.payment_status === 'paid' || booking?.payment_status === 'deposit_paid'
  const balance =
    booking && booking.payment_status === 'deposit_paid'
      ? Number(booking.total_amount || 0) - Number(booking.amount_paid || 0)
      : 0

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-12">
      <div className="mx-auto max-w-lg px-4">
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          {isPaid ? (
            <>
              <CheckCircle size={56} className="mx-auto mb-4 text-green-500" />
              <h1 className="mb-2 text-2xl font-bold text-[#0A1F44]">Payment received</h1>
              <p className="mb-6 text-gray-500">
                Thank you{booking?.guest_name ? `, ${booking.guest_name}` : ''}. Your booking is
                confirmed and we have emailed you the details.
              </p>
            </>
          ) : (
            <>
              <Clock size={56} className="mx-auto mb-4 text-[#C9A84C]" />
              <h1 className="mb-2 text-2xl font-bold text-[#0A1F44]">Payment processing</h1>
              <p className="mb-6 text-gray-500">
                Your payment went through and we are just finishing up. This page does not update
                by itself — check your booking in a moment to see it confirmed.
              </p>
            </>
          )}

          {booking && (
            <div className="mb-6 rounded-xl bg-[#0A1F44] p-5 text-white">
              <p className="mb-1 text-xs text-gray-400">Booking reference</p>
              <p className="font-display text-3xl tracking-widest text-[#C9A84C]">
                {booking.reference}
              </p>
              {isPaid && (
                <p className="mt-2 text-xs text-gray-300">
                  Paid {formatCurrency(Number(booking.amount_paid || 0))}
                  {balance > 0 && ` · ${formatCurrency(balance)} due at pick-up`}
                </p>
              )}
            </div>
          )}

          <div className="mb-6 rounded-lg border border-amber-100 bg-amber-50 p-3 text-left text-sm text-amber-800">
            <strong>Keep your reference.</strong> Check your booking any time at{' '}
            <Link href="/my-booking" className="font-medium underline">
              {SITE_HOST}/my-booking
            </Link>
            .
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/my-booking"
              className="flex-1 rounded-lg border-2 border-[#0A1F44] py-2.5 text-center font-semibold text-[#0A1F44] transition-colors hover:bg-[#0A1F44] hover:text-white"
            >
              Track my booking
            </Link>
            <Link
              href="/cars"
              className="flex-1 rounded-lg bg-[#C9A84C] py-2.5 text-center font-semibold text-[#0A1F44] transition-colors hover:bg-yellow-400"
            >
              Browse the fleet
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
