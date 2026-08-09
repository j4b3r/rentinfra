import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Car, MapPin, User, CreditCard, Calendar, Clock, FileText } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import BookingActions from '@/components/admin/BookingActions'
import RefundPanel from '@/components/admin/RefundPanel'
import ConditionReportPanel from '@/components/admin/ConditionReportPanel'
import LicencePanel from '@/components/admin/LicencePanel'

const statusColor: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  active: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-red-100 text-red-600',
}

const paymentColor: Record<string, string> = {
  unpaid: 'bg-red-100 text-red-600',
  deposit_paid: 'bg-amber-100 text-amber-700',
  paid: 'bg-emerald-100 text-emerald-700',
  refunded: 'bg-gray-100 text-gray-500',
  partial_refund: 'bg-orange-100 text-orange-700',
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 font-medium shrink-0 w-36">{label}</span>
      <span className="text-sm text-gray-700 text-right">{value || '—'}</span>
    </div>
  )
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-[#0A1F44]/5 flex items-center justify-center">
          <Icon size={14} className="text-[#0A1F44]" />
        </div>
        <h2 className="font-bold text-[#0A1F44] text-sm">{title}</h2>
      </div>
      {children}
    </div>
  )
}

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: b } = await supabase
    .from('bookings')
    .select(`
      *,
      car:cars(make, model, year, category, transmission, fuel_type, requires_license),
      pickup_location:locations!bookings_pickup_location_id_fkey(name_en, type, extra_fee),
      dropoff_location:locations!bookings_dropoff_location_id_fkey(name_en, type, extra_fee),
      booking_addons(addon_name_snapshot, pricing_type_snapshot, price_snapshot, quantity, subtotal)
    `)
    .eq('id', id)
    .single()

  if (!b) notFound()

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/bookings" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-extrabold text-[#0A1F44]">{b.reference}</h1>
            <a
              href={`/api/admin/bookings/${b.id}/contract?lang=es`}
              target="_blank"
              className="flex items-center gap-1.5 text-xs border border-gray-200 hover:border-[#0A1F44] text-gray-500 hover:text-[#0A1F44] px-3 py-1.5 rounded-lg transition-all font-semibold"
            >
              <FileText size={12} /> Contrato ES
            </a>
            <a
              href={`/api/admin/bookings/${b.id}/contract?lang=en`}
              target="_blank"
              className="flex items-center gap-1.5 text-xs border border-gray-200 hover:border-[#0A1F44] text-gray-500 hover:text-[#0A1F44] px-3 py-1.5 rounded-lg transition-all font-semibold"
            >
              <FileText size={12} /> Contract EN
            </a>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusColor[b.status]}`}>
              {b.status}
            </span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${paymentColor[b.payment_status]}`}>
              {b.payment_status.replace('_', ' ')}
            </span>
            {b.booking_type === 'offline' && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">offline</span>
            )}
          </div>
          <p className="text-gray-400 text-xs mt-0.5">
            Created {new Date(b.created_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column — details */}
        <div className="lg:col-span-2 space-y-5">

          {/* Guest */}
          <Section icon={User} title="Guest">
            <Row label="Name" value={b.guest_name} />
            <Row label="Email" value={b.guest_email
              ? <a href={`mailto:${b.guest_email}`} className="text-[#C9A84C] hover:underline">{b.guest_email}</a>
              : null}
            />
            <Row label="Phone" value={b.guest_phone
              ? <a href={`tel:${b.guest_phone}`} className="text-[#C9A84C] hover:underline">{b.guest_phone}</a>
              : null}
            />
            <Row label="Driver age" value={b.driver_age ? `${b.driver_age} years` : null} />
            <Row label="License" value={b.guest_license} />
            <Row label="NIE / Passport" value={b.guest_nie_passport} />
            <Row label="Home address" value={b.guest_address} />
            <Row label="Address in Spain" value={b.guest_address_spain} />
          </Section>

          {/* Car */}
          <Section icon={Car} title="Vehicle">
            <Row label="Car" value={b.car ? `${b.car.make} ${b.car.model}${b.car.year ? ` (${b.car.year})` : ''}` : null} />
            <Row label="Category" value={b.car?.category} />
            <Row label="Transmission" value={b.car?.transmission === 'auto' ? 'Automatic' : 'Manual'} />
          </Section>

          {/* Handover condition */}
          <ConditionReportPanel bookingId={b.id} />

          {/* Dates & Locations */}
          <Section icon={Calendar} title="Rental Period">
            <Row label="Pickup date" value={`${b.pickup_date} at ${b.pickup_time}`} />
            <Row label="Return date" value={`${b.dropoff_date} at ${b.dropoff_time}`} />
            <Row label="Total days" value={`${b.total_days} day${b.total_days !== 1 ? 's' : ''}`} />
            <Row label="Pickup location" value={b.pickup_location?.name_en} />
            <Row label="Return location" value={b.dropoff_location?.name_en} />
            {b.hotel_name && <Row label="Hotel" value={`${b.hotel_name}${b.hotel_address ? ` — ${b.hotel_address}` : ''}`} />}
          </Section>

          {/* Addons */}
          {b.booking_addons && b.booking_addons.length > 0 && (
            <Section icon={Clock} title="Extras">
              {b.booking_addons.map((a: {
                addon_name_snapshot: string
                pricing_type_snapshot: string
                price_snapshot: number
                quantity: number
                subtotal: number
              }, i: number) => (
                <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm text-gray-700">{a.addon_name_snapshot}</p>
                    <p className="text-xs text-gray-400">
                      {formatCurrency(a.price_snapshot)} × {a.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-[#0A1F44]">{formatCurrency(a.subtotal)}</span>
                </div>
              ))}
            </Section>
          )}

          {/* Price breakdown */}
          <Section icon={CreditCard} title="Price Breakdown">
            <Row label="Daily rate" value={b.daily_rate_snapshot ? formatCurrency(b.daily_rate_snapshot) : null} />
            {b.discount_applied_pct > 0 && (
              <Row label="Discount" value={`−${b.discount_applied_pct}%`} />
            )}
            {b.addons_total > 0 && <Row label="Extras" value={formatCurrency(b.addons_total)} />}
            {b.location_fee > 0 && <Row label="Location fee" value={formatCurrency(b.location_fee)} />}
            {b.young_driver_fee > 0 && <Row label="Young driver fee" value={formatCurrency(b.young_driver_fee)} />}
            {b.subtotal && <Row label="Subtotal" value={formatCurrency(b.subtotal)} />}
            <Row label="Tax" value={formatCurrency(b.tax_amount)} />
            <div className="flex items-center justify-between pt-3 mt-1 border-t border-gray-100">
              <span className="text-sm font-bold text-[#0A1F44]">Total</span>
              <span className="text-lg font-extrabold text-[#0A1F44]">
                {b.total_amount ? formatCurrency(b.total_amount) : '—'}
              </span>
            </div>
            {b.deposit_amount > 0 && (
              <p className="text-xs text-gray-400 mt-1 text-right">
                Deposit: {formatCurrency(b.deposit_amount)}
                {b.deposit_paid_at ? ` · paid ${new Date(b.deposit_paid_at).toLocaleDateString('en-GB')}` : ''}
              </p>
            )}
          </Section>

          {/* Cancellation */}
          {b.cancellation_reason && (
            <Section icon={MapPin} title="Cancellation">
              <Row label="Cancelled at" value={b.cancelled_at ? new Date(b.cancelled_at).toLocaleString('en-GB') : null} />
              <Row label="Reason" value={b.cancellation_reason} />
            </Section>
          )}
        </div>

        {/* Right column — actions */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-[#0A1F44] text-sm mb-4">Actions</h2>
            <BookingActions
              bookingId={b.id}
              initialStatus={b.status}
              initialPaymentStatus={b.payment_status}
              initialNotes={b.notes}
              initialKmPickup={b.km_at_pickup}
              initialKmReturn={b.km_at_return}
              initialFuelPickup={b.fuel_level_pickup}
              initialFuelReturn={b.fuel_level_return}
              initialPaymentMethodDeposit={b.payment_method_deposit}
            />
          </div>

          <RefundPanel
            bookingId={b.id}
            amountPaid={Number(b.amount_paid || 0)}
            refundedAmount={Number(b.refunded_amount || 0)}
            hasStripePayment={Boolean(b.stripe_payment_intent_id)}
          />

          {/* Bicycles have no licence requirement — nothing to verify */}
          {b.car?.requires_license !== false && <LicencePanel bookingId={b.id} />}

          {/* Timestamps */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <h2 className="font-bold text-[#0A1F44] text-sm mb-1">Timeline</h2>
            {[
              { label: 'Created', val: b.created_at },
              { label: 'Confirmed', val: b.confirmed_at },
              { label: 'Cancelled', val: b.cancelled_at },
              { label: 'Updated', val: b.updated_at },
            ].filter(t => t.val).map(t => (
              <div key={t.label} className="flex items-start justify-between">
                <span className="text-xs text-gray-400">{t.label}</span>
                <span className="text-xs text-gray-600 text-right">
                  {new Date(t.val!).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
