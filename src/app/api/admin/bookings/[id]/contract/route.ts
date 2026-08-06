import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement, type ReactElement } from 'react'
import type { DocumentProps } from '@react-pdf/renderer'
import { RentalContract } from '@/lib/pdf/RentalContract'
import QRCode from 'qrcode'
import fs from 'fs'
import path from 'path'
import { requireAdmin } from '@/lib/auth-guard'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params
  const lang = (req.nextUrl.searchParams.get('lang') || 'es') as 'es' | 'en'

  const supabase = await createClient()

  const { data: b } = await supabase
    .from('bookings')
    .select(`
      *,
      car:cars(make, model, year, license_plate, transmission, fuel_type),
      pickup_location:locations!bookings_pickup_location_id_fkey(name_en, name_es),
      dropoff_location:locations!bookings_dropoff_location_id_fkey(name_en, name_es),
      booking_addons(addon_name_snapshot, pricing_type_snapshot, price_snapshot, quantity, subtotal)
    `)
    .eq('id', id)
    .single()

  if (!b) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Fetch company settings
  const { data: settings } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['company_name', 'company_address', 'company_phone', 'company_email', 'social_whatsapp'])

  const s: Record<string, string> = Object.fromEntries(
    (settings || []).map((r: { key: string; value: string }) => [r.key, r.value])
  )

  // Logo as base64 data URL
  // TODO: add your own logo.jpeg to /public to have it appear on the generated PDF contract
  const logoPath = path.join(process.cwd(), 'public', 'logo.jpeg')
  let logoDataUrl = ''
  try {
    const logoBuffer = fs.readFileSync(logoPath)
    logoDataUrl = `data:image/jpeg;base64,${logoBuffer.toString('base64')}`
  } catch { /* logo missing — skip */ }

  // WhatsApp QR code
  // Build pre-filled message with booking details
  const waPhone = (s.social_whatsapp || '')
    .replace('https://wa.me/', '')
    .replace(/\D/g, '')
  const waMessage = [
    `🚗 ${lang === 'es' ? 'Reserva' : 'Booking'}: ${b.reference}`,
    `👤 ${b.guest_name || ''}`,
    `📅 ${b.pickup_date} → ${b.dropoff_date}`,
    `🚙 ${b.car ? `${b.car.make} ${b.car.model}` : ''}`,
    `💶 €${b.total_amount?.toFixed(2) || '0.00'}`,
  ].filter(Boolean).join('\n')

  const waUrl = waPhone
    ? `https://wa.me/${waPhone}?text=${encodeURIComponent(waMessage)}`
    : `https://wa.me/?text=${encodeURIComponent(waMessage)}`

  let qrDataUrl = ''
  try {
    qrDataUrl = await QRCode.toDataURL(waUrl, { width: 256, margin: 1, color: { dark: '#0A1F44', light: '#ffffff' } })
  } catch { /* QR failed — skip */ }

  const buffer = await renderToBuffer(
    createElement(RentalContract, { booking: b, settings: s, lang, logoDataUrl, qrDataUrl }) as ReactElement<DocumentProps>
  )

  const filename = `contrato-${b.reference}-${lang}.pdf`

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
    },
  })
}
