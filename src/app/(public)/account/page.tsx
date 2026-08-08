import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Car, Calendar, MapPin, Package, Info } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import ProfileForm from '@/components/account/ProfileForm'
import SignOutButton from '@/components/account/SignOutButton'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Account | RentInfra',
  robots: { index: false, follow: false },
}

/**
 * The normal RLS-scoped client, not the admin one — `bookings_user_own` and
 * `profiles_own` already restrict rows to the signed-in user, so there is no
 * need to filter by user_id in JS (that pattern was the admin API auth gap).
 *
 * This only shows bookings placed while signed in (user_id is set). A
 * booking made as a guest with the same email doesn't link back — that's
 * what /my-booking is for, and this page points there rather than silently
 * looking empty.
 */
export default async function AccountPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const [{ data: profile }, { data: bookings }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('bookings')
      .select(`
        *,
        car:cars(make, model, year, slug),
        pickup_location:locations!bookings_pickup_location_id_fkey(name_en),
        booking_addons(id, addon_name_snapshot, subtotal)
      `)
      .order('created_at', { ascending: false }),
  ])

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-[#0A1F44] px-4 py-10">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold text-white">My Account</h1>
          <p className="mt-1 text-gray-400">{user.email}</p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Profile */}
          <div className="lg:col-span-1">
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-bold text-[#0A1F44]">Your details</h2>
              <ProfileForm
                userId={user.id}
                initial={{
                  full_name: profile?.full_name ?? '',
                  phone: profile?.phone ?? '',
                  nationality: profile?.nationality ?? '',
                  license_number: profile?.license_number ?? '',
                }}
              />
              <div className="mt-6 border-t border-gray-100 pt-4">
                <SignOutButton />
              </div>
            </div>
          </div>

          {/* Bookings */}
          <div className="space-y-4 lg:col-span-2">
            <h2 className="text-sm font-bold text-[#0A1F44]">Your bookings</h2>

            {!bookings || bookings.length === 0 ? (
              <div className="rounded-xl bg-white p-8 text-center shadow-sm">
                <Car size={32} className="mx-auto mb-3 text-gray-300" />
                <p className="mb-1 font-semibold text-[#0A1F44]">No bookings yet</p>
                <p className="mb-4 text-sm text-gray-500">
                  Bookings you make while signed in will show up here.
                </p>
                <Link
                  href="/cars"
                  className="inline-block rounded-lg bg-[#C9A84C] px-5 py-2.5 text-sm font-semibold text-[#0A1F44] transition-colors hover:bg-yellow-400"
                >
                  Browse the fleet
                </Link>
              </div>
            ) : (
              bookings.map(b => (
                <div key={b.id} className="overflow-hidden rounded-xl bg-white shadow-sm">
                  <div className="flex items-center justify-between bg-[#0A1F44] px-5 py-3">
                    <div>
                      <p className="text-[10px] text-gray-400">Reference</p>
                      <p className="font-bold text-[#C9A84C]">{b.reference}</p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${getStatusColor(b.status)}`}
                    >
                      {b.status}
                    </span>
                  </div>
                  <div className="space-y-3 p-5">
                    {b.car && (
                      <div className="flex items-center gap-2.5 text-sm">
                        <Car size={16} className="shrink-0 text-[#C9A84C]" />
                        <span className="font-medium text-[#0A1F44]">
                          {b.car.make} {b.car.model}
                          {b.car.year ? ` (${b.car.year})` : ''}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2.5 text-sm">
                      <Calendar size={16} className="shrink-0 text-[#C9A84C]" />
                      <span className="text-gray-600">
                        {formatDate(b.pickup_date)} → {formatDate(b.dropoff_date)}
                      </span>
                    </div>
                    {b.pickup_location && (
                      <div className="flex items-center gap-2.5 text-sm">
                        <MapPin size={16} className="shrink-0 text-[#C9A84C]" />
                        <span className="text-gray-600">{b.pickup_location.name_en}</span>
                      </div>
                    )}
                    {b.booking_addons && b.booking_addons.length > 0 && (
                      <div className="flex items-start gap-2.5 text-sm">
                        <Package size={16} className="mt-0.5 shrink-0 text-[#C9A84C]" />
                        <span className="text-gray-600">
                          {b.booking_addons.map((a: { id: string; addon_name_snapshot: string }) => a.addon_name_snapshot).join(', ')}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                      <span className="text-sm text-gray-500">Total</span>
                      <span className="font-bold text-[#0A1F44]">
                        {b.total_amount ? formatCurrency(b.total_amount) : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}

            <div className="flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs text-amber-800">
              <Info size={14} className="mt-0.5 shrink-0" />
              <span>
                Booked as a guest, or don&apos;t see a booking here? Look it up at{' '}
                <Link href="/my-booking" className="font-semibold underline">
                  My Booking
                </Link>{' '}
                with your reference and email.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
