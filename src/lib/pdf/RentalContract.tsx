import {
  Document, Page, Text, View, StyleSheet, Font, Image
} from '@react-pdf/renderer'
import path from 'path'
import fs from 'fs'

// ─── fonts ───────────────────────────────────────────────────────────────────
const fontDir = path.join(process.cwd(), 'src/lib/pdf/fonts')

Font.register({
  family: 'Inter',
  fonts: [
    { src: `${fontDir}/Inter-Regular.woff`, fontWeight: 400 },
    { src: `${fontDir}/Inter-Bold.woff`,    fontWeight: 700 },
  ],
})

// Disable font hyphenation
Font.registerHyphenationCallback(word => [word])

// ─── translations ─────────────────────────────────────────────────────────────
const T = {
  es: {
    title:           'CONTRATO DE ALQUILER DE VEHÍCULO SIN CONDUCTOR',
    date:            'FECHA',
    client:          'DATOS DEL CLIENTE',
    name:            'Nombre',
    phone:           'Teléfono',
    email:           'Email',
    nie:             'NIE / Pasaporte',
    address:         'Domicilio permanente',
    addressSpain:    'Domicilio en el país de residencia',
    vehicle:         'VEHÍCULO',
    vehicleLabel:    'Vehículo',
    plate:           'Matrícula',
    pickup:          'RECOGIDA',
    dropoff:         'DEVOLUCIÓN',
    dateLabel:       'Fecha',
    timeLabel:       'Hora',
    locationLabel:   'Lugar',
    kmPickup:        'KM actuales',
    kmReturn:        'KM en devolución',
    price:           'PRECIO',
    deposit:         'DEPÓSITO',
    method:          'Método de pago',
    daily:           'Tarifa diaria',
    days:            'días',
    discount:        'Descuento',
    extras:          'Extras',
    locationFee:     'Cargo por ubicación',
    youngDriver:     'Cargo conductor joven',
    tax:             'IVA',
    total:           'TOTAL',
    fuelTitle:       'COMBUSTIBLE',
    fuelText:        'El combustible queda a cargo del arrendatario, que devolverá el vehículo con el mismo nivel. De no ser así se cobrará el combustible más 30€ de repostaje. Controlar niveles de aceite y agua.',
    fuelPickup:      'Combustible entrega',
    fuelReturn:      'Combustible devolución',
    smokingTitle:    'PROHIBIDO FUMAR',
    smokingText:     'Prohibido fumar en todos los vehículos. Se cargará 100€ de limpieza si se ha fumado en el vehículo.',
    kmTitle:         'KILOMETRAJE',
    kmText:          'Límite de 300 km diarios. Superado este límite: 0,60€/km adicional.',
    // TODO: replace with your own territory restriction, or configure via settings
    territoryTitle:  'TERRITORIALIDAD',
    territoryText:   'Solo circulación dentro del territorio de alquiler acordado. Prohibido salir de dicho territorio sin autorización previa por escrito.',
    conditionTitle:  'ESTADO DEL VEHÍCULO',
    conditionText:   'Declaro recibir el vehículo en perfecto estado y me obligo a devolverlo igual. Limpieza extra: 50€.',
    signaturesTitle: 'FIRMAS',
    clientName:      'Nombre cliente',
    clientSign:      'Firma cliente',
    companySign:     'Firma empresa',
    d1:              'Soy el único conductor autorizado. Tengo carnet en vigor, más de 2 años de carnet tipo B y soy mayor de 23 años. El seguro no cubre conductores menores de esa edad.',
    d2:              'He leído los términos y presto mi conformidad, autorizando los cargos a mi tarjeta de crédito por el importe total del alquiler.',
    d3:              'Acepto el seguro con franquicia y la reparación a mi cargo por daños causados por mi negligencia.',
    reference:       'Ref.',
    fuel_full:           'Lleno',
    fuel_three_quarters: '3/4',
    fuel_half:           '1/2',
    fuel_quarter:        '1/4',
    fuel_empty:          'Vacío',
    addons:          'EXTRAS / SERVICIOS',
    qrLabel:         'Escanea para WhatsApp',
    // Page 2
    damageTitle:     'ESTADO DEL VEHÍCULO — INSPECCIÓN DE ENTREGA',
    damageSubtitle:  'Marque con una X los daños existentes en el vehículo en el momento de la entrega.',
    damageNotes:     'Observaciones / Daños existentes:',
    damageConfirm:   'Confirmo haber inspeccionado el vehículo y que los daños marcados arriba reflejan el estado real en el momento de la entrega.',
    page2ClientSign: 'Firma cliente — entrega',
    page2CompSign:   'Firma empresa — entrega',
    page2ClientSignReturn: 'Firma cliente — devolución',
    page2CompSignReturn:   'Firma empresa — devolución',
    returnSection:   'DEVOLUCIÓN DEL VEHÍCULO',
    returnNotes:     'Observaciones / Daños en devolución:',
    returnConfirm:   'Confirmo haber inspeccionado el vehículo a la devolución.',
  },
  en: {
    title:           'VEHICLE RENTAL CONTRACT WITHOUT DRIVER',
    date:            'DATE',
    client:          'CLIENT DETAILS',
    name:            'Name',
    phone:           'Phone',
    email:           'Email',
    nie:             'ID / Passport',
    address:         'Permanent address',
    addressSpain:    'Address in country of residence',
    vehicle:         'VEHICLE',
    vehicleLabel:    'Vehicle',
    plate:           'License plate',
    pickup:          'PICKUP',
    dropoff:         'RETURN',
    dateLabel:       'Date',
    timeLabel:       'Time',
    locationLabel:   'Location',
    kmPickup:        'Current KM',
    kmReturn:        'KM at return',
    price:           'PRICE',
    deposit:         'DEPOSIT',
    method:          'Payment method',
    daily:           'Daily rate',
    days:            'days',
    discount:        'Discount',
    extras:          'Extras',
    locationFee:     'Location fee',
    youngDriver:     'Young driver fee',
    tax:             'Tax',
    total:           'TOTAL',
    fuelTitle:       'FUEL POLICY',
    fuelText:        'Fuel is the renter\'s responsibility. Vehicle must be returned with the same level. Otherwise: fuel cost + €30 refuelling fee. Monitor oil and water levels.',
    fuelPickup:      'Fuel at pickup',
    fuelReturn:      'Fuel at return',
    smokingTitle:    'NO SMOKING',
    smokingText:     'Smoking is prohibited in all vehicles. A €100 cleaning fee applies if smoking occurred.',
    kmTitle:         'MILEAGE',
    kmText:          'Limit of 300 km/day. Beyond this: €0.60 per extra km.',
    // TODO: replace with your own territory restriction, or configure via settings
    territoryTitle:  'TERRITORY',
    territoryText:   'Vehicle use is restricted to the rental territory as defined in your agreement. Leaving that territory without prior written consent is strictly forbidden.',
    conditionTitle:  'VEHICLE CONDITION',
    conditionText:   'I confirm receipt in perfect condition and undertake to return it the same. Extra cleaning: €50.',
    signaturesTitle: 'SIGNATURES',
    clientName:      'Client name',
    clientSign:      'Client signature',
    companySign:     'Company signature',
    d1:              'I am the only authorised driver. I hold a valid licence, have held Category B for 2+ years and am over 23. Insurance does not cover drivers below this age.',
    d2:              'I have read the terms and agree, authorising credit card charges for the total rental amount.',
    d3:              'I accept the insurance excess and undertake to cover repair costs for damage caused by my negligence.',
    reference:       'Ref.',
    fuel_full:           'Full',
    fuel_three_quarters: '3/4',
    fuel_half:           '1/2',
    fuel_quarter:        '1/4',
    fuel_empty:          'Empty',
    addons:          'EXTRAS / SERVICES',
    qrLabel:         'Scan to WhatsApp',
    // Page 2
    damageTitle:     'VEHICLE CONDITION — DELIVERY INSPECTION',
    damageSubtitle:  'Mark with an X any existing damage on the vehicle at the time of delivery.',
    damageNotes:     'Observations / Existing damage:',
    damageConfirm:   'I confirm having inspected the vehicle and that the damage marked above reflects the actual condition at the time of delivery.',
    page2ClientSign: 'Client signature — delivery',
    page2CompSign:   'Company signature — delivery',
    page2ClientSignReturn: 'Client signature — return',
    page2CompSignReturn:   'Company signature — return',
    returnSection:   'VEHICLE RETURN',
    returnNotes:     'Observations / Damage at return:',
    returnConfirm:   'I confirm having inspected the vehicle upon return.',
  },
}

// ─── styles ───────────────────────────────────────────────────────────────────
const NAVY  = '#0A1F44'
const GOLD  = '#C9A84C'
const LIGHT = '#F0F4FF'

const S = StyleSheet.create({
  page:         { fontFamily: 'Inter', fontWeight: 400, fontSize: 8, padding: '28 32 28 32', color: '#111' },

  // Header
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: GOLD },
  logoImg:      { width: 52, height: 52, objectFit: 'contain' },
  companyBlock: { flex: 1, paddingLeft: 10 },
  companyName:  { fontSize: 13, fontWeight: 700, color: NAVY },
  companyInfo:  { fontSize: 7, color: '#666', marginTop: 1.5 },
  titleBlock:   { alignItems: 'flex-end' },
  contractTitle:{ fontSize: 10, fontWeight: 700, color: NAVY, textAlign: 'right' },
  refRow:       { flexDirection: 'row', gap: 14, marginTop: 3 },
  refText:      { fontSize: 7, color: '#888' },

  // Section headers
  sectionTitle: { fontSize: 7.5, fontWeight: 700, color: NAVY, backgroundColor: LIGHT, padding: '3 6', marginBottom: 3, marginTop: 7 },

  // Rows
  row:          { flexDirection: 'row', marginBottom: 2.5 },
  label:        { width: 108, fontSize: 7, color: '#666' },
  value:        { flex: 1, fontSize: 7.5, color: '#111' },

  // Two-col layout
  twoCol:       { flexDirection: 'row', gap: 14 },
  col:          { flex: 1 },

  // Price
  priceRow:     { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 2, marginBottom: 2, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
  priceLabel:   { fontSize: 7.5, color: '#555' },
  priceValue:   { fontSize: 7.5, color: '#111' },
  totalRow:     { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, paddingTop: 4, borderTopWidth: 1.5, borderTopColor: NAVY },
  totalLabel:   { fontSize: 9, fontWeight: 700, color: NAVY },
  totalValue:   { fontSize: 9, fontWeight: 700, color: NAVY },

  // Fuel boxes
  fuelRow:      { flexDirection: 'row', gap: 8, marginTop: 4, marginBottom: 2 },
  fuelBox:      { flex: 1, padding: '4 6', borderWidth: 0.5, borderColor: '#ddd', borderRadius: 3, alignItems: 'center' },
  fuelLabel:    { fontSize: 6.5, color: '#888', marginBottom: 1 },
  fuelValue:    { fontSize: 8.5, fontWeight: 700, color: NAVY },

  // Terms boxes
  termsBox:     { marginTop: 5, padding: '4 6', backgroundColor: '#FAFAFA', borderWidth: 0.5, borderColor: '#ddd' },
  termsTitle:   { fontSize: 7.5, fontWeight: 700, color: NAVY, marginBottom: 2 },
  termsText:    { fontSize: 6.5, color: '#444', lineHeight: 1.45 },

  // Declarations
  declBox:      { marginTop: 7, padding: '5 7', backgroundColor: '#FFF9EC', borderWidth: 0.5, borderColor: GOLD },
  declText:     { fontSize: 6.2, color: '#555', lineHeight: 1.5, marginBottom: 2 },

  // Gold divider
  goldBar:      { height: 1.5, backgroundColor: GOLD, marginTop: 12, marginBottom: 5 },

  // Signatures
  signArea:     { flexDirection: 'row', gap: 12, marginTop: 6, alignItems: 'flex-end' },
  signBox:      { flex: 1 },
  signTop:      { fontSize: 6, color: '#444', marginBottom: 10 },
  signLine:     { borderTopWidth: 0.75, borderTopColor: '#aaa', marginBottom: 2 },
  signImg:      { height: 26, objectFit: 'contain', marginBottom: 2 },
  signLabel:    { fontSize: 6, color: '#888' },

  // QR
  qrImg:        { width: 90, height: 90 },
  qrLabel:      { fontSize: 6.5, color: '#888', textAlign: 'center', marginTop: 3 },
  qrBlock:      { alignItems: 'center' },

  // Page 2 — mini header
  miniHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingBottom: 6, borderBottomWidth: 1.5, borderBottomColor: GOLD },
  miniLogoImg:      { width: 36, height: 36, objectFit: 'contain' },
  miniCompany:      { flex: 1, paddingLeft: 8 },
  miniCompanyName:  { fontSize: 9, fontWeight: 700, color: NAVY },
  miniCompanyInfo:  { fontSize: 6.5, color: '#888', marginTop: 1 },
  miniRef:          { fontSize: 7, color: '#888', textAlign: 'right' },

  // Page 2 — car diagram
  diagramSection:   { alignItems: 'center', marginTop: 6, marginBottom: 8 },
  diagramTitle:     { fontSize: 9, fontWeight: 700, color: NAVY, marginBottom: 4, textAlign: 'center' },
  diagramSubtitle:  { fontSize: 7, color: '#666', marginBottom: 10, textAlign: 'center' },
  diagramImg:       { width: 380, height: 200, objectFit: 'contain' },

  // Page 2 — notes areas
  notesLabel:       { fontSize: 7.5, fontWeight: 700, color: NAVY, marginBottom: 4, marginTop: 10 },
  notesBox:         { borderWidth: 0.75, borderColor: '#ccc', borderRadius: 3, height: 60, padding: 6 },
  notesBoxReturn:   { borderWidth: 0.75, borderColor: '#ccc', borderRadius: 3, height: 50, padding: 6 },

  // Page 2 — confirm text
  confirmText:      { fontSize: 6.5, color: '#555', lineHeight: 1.4, marginTop: 6, marginBottom: 6 },

  // Page 2 — return section
  returnBox:        { marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#ddd' },
})

// ─── helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number | null | undefined) {
  if (n == null) return '—'
  return `€${n.toFixed(2)}`
}
function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}
function fuelLabel(val: string | null | undefined, t: typeof T['es']) {
  if (!val) return '—'
  const map: Record<string, string> = {
    full: t.fuel_full, three_quarters: t.fuel_three_quarters,
    half: t.fuel_half, quarter: t.fuel_quarter, empty: t.fuel_empty,
  }
  return map[val] || val
}

// ─── types ────────────────────────────────────────────────────────────────────
interface Booking {
  reference: string; created_at: string
  guest_name: string | null; guest_email: string | null; guest_phone: string | null
  guest_license: string | null; guest_nie_passport: string | null
  guest_address: string | null; guest_address_spain: string | null; driver_age: number | null
  pickup_date: string; pickup_time: string; dropoff_date: string; dropoff_time: string
  total_days: number; km_at_pickup: number | null; km_at_return: number | null
  fuel_level_pickup: string | null; fuel_level_return: string | null
  daily_rate_snapshot: number | null; discount_applied_pct: number
  addons_total: number; location_fee: number; young_driver_fee: number
  subtotal: number | null; tax_amount: number; total_amount: number | null
  deposit_amount: number; payment_method: string | null; payment_method_deposit: string | null
  car: { make: string; model: string; year?: number; license_plate?: string | null; transmission: string; fuel_type: string } | null
  pickup_location: { name_en: string; name_es: string } | null
  dropoff_location: { name_en: string; name_es: string } | null
  booking_addons?: { addon_name_snapshot: string; price_snapshot: number; quantity: number; subtotal: number }[]
}

interface Props {
  booking: Booking
  settings: Record<string, string>
  lang: 'es' | 'en'
  logoDataUrl: string
  qrDataUrl: string
  /** Keyed `${stage}-${role}`, e.g. "contract-client". Missing key = unsigned, shows a blank line. */
  signatureDataUrls?: Record<string, string>
}

// ─── load car diagram ─────────────────────────────────────────────────────────
const diagramPath = path.join(process.cwd(), 'src/lib/pdf/car-diagram.png')
let carDiagramDataUrl = ''
try {
  const buf = fs.readFileSync(diagramPath)
  carDiagramDataUrl = `data:image/png;base64,${buf.toString('base64')}`
} catch { /* skip if missing */ }

// ─── component ────────────────────────────────────────────────────────────────
// Renders the captured signature image when one exists for this stage/role,
// falling back to the original blank line so print-and-sign-by-hand keeps
// working when e-sign wasn't used. A plain function, not a component defined
// inside RentalContract, so it isn't re-created every render.
function signMark(
  signatureDataUrls: Record<string, string>,
  stage: 'contract' | 'delivery' | 'return',
  role: 'client' | 'company'
) {
  const url = signatureDataUrls[`${stage}-${role}`]
  return url ? <Image src={url} style={S.signImg} /> : <View style={S.signLine} />
}

export function RentalContract({ booking: b, settings, lang, logoDataUrl, qrDataUrl, signatureDataUrls = {} }: Props) {
  const t = T[lang]
  const locName = (loc: { name_en: string; name_es: string } | null) =>
    loc ? (lang === 'es' ? loc.name_es : loc.name_en) : '—'

  return (
    <Document>
      <Page size="A4" style={S.page}>

        {/* ── Header ── */}
        <View style={S.header}>
          {logoDataUrl ? (
            <Image src={logoDataUrl} style={S.logoImg} />
          ) : null}
          <View style={S.companyBlock}>
            <Text style={S.companyName}>{settings.company_name || 'RentInfra'}</Text>
            <Text style={S.companyInfo}>{settings.company_address}</Text>
            <Text style={S.companyInfo}>{settings.company_phone}  ·  {settings.company_email}</Text>
          </View>
          <View style={S.titleBlock}>
            <Text style={S.contractTitle}>{t.title}</Text>
            <View style={S.refRow}>
              <Text style={S.refText}>{t.reference} {b.reference}</Text>
              <Text style={S.refText}>{t.date}: {fmtDate(b.created_at?.substring(0, 10))}</Text>
            </View>
          </View>
        </View>

        {/* ── Client + Vehicle ── */}
        <View style={S.twoCol}>
          <View style={S.col}>
            <Text style={S.sectionTitle}>{t.client}</Text>
            <View style={S.row}><Text style={S.label}>{t.name}</Text><Text style={S.value}>{b.guest_name || '—'}</Text></View>
            <View style={S.row}><Text style={S.label}>{t.phone}</Text><Text style={S.value}>{b.guest_phone || '—'}</Text></View>
            <View style={S.row}><Text style={S.label}>{t.email}</Text><Text style={S.value}>{b.guest_email || '—'}</Text></View>
            <View style={S.row}><Text style={S.label}>{t.nie}</Text><Text style={S.value}>{b.guest_nie_passport || '—'}</Text></View>
            <View style={S.row}><Text style={S.label}>{t.address}</Text><Text style={S.value}>{b.guest_address || '—'}</Text></View>
            <View style={S.row}><Text style={S.label}>{t.addressSpain}</Text><Text style={S.value}>{b.guest_address_spain || '—'}</Text></View>
          </View>

          <View style={S.col}>
            <Text style={S.sectionTitle}>{t.vehicle}</Text>
            <View style={S.row}>
              <Text style={S.label}>{t.vehicleLabel}</Text>
              <Text style={S.value}>{b.car ? `${b.car.make} ${b.car.model}${b.car.year ? ` (${b.car.year})` : ''}` : '—'}</Text>
            </View>
            <View style={S.row}><Text style={S.label}>{t.plate}</Text><Text style={S.value}>{b.car?.license_plate || '—'}</Text></View>
            <View style={S.row}><Text style={S.label}>{t.kmPickup}</Text><Text style={S.value}>{b.km_at_pickup ?? '—'}</Text></View>
            <View style={S.row}><Text style={S.label}>{t.kmReturn}</Text><Text style={S.value}>{b.km_at_return ?? '—'}</Text></View>

            <Text style={S.sectionTitle}>{t.pickup} / {t.dropoff}</Text>
            <View style={S.row}><Text style={S.label}>{t.pickup} {t.dateLabel}</Text><Text style={S.value}>{fmtDate(b.pickup_date)}  {b.pickup_time}</Text></View>
            <View style={S.row}><Text style={S.label}>{t.pickup} {t.locationLabel}</Text><Text style={S.value}>{locName(b.pickup_location)}</Text></View>
            <View style={S.row}><Text style={S.label}>{t.dropoff} {t.dateLabel}</Text><Text style={S.value}>{fmtDate(b.dropoff_date)}  {b.dropoff_time}</Text></View>
            <View style={S.row}><Text style={S.label}>{t.dropoff} {t.locationLabel}</Text><Text style={S.value}>{locName(b.dropoff_location)}</Text></View>
          </View>
        </View>

        {/* ── Fuel levels ── */}
        <View style={S.fuelRow}>
          <View style={S.fuelBox}>
            <Text style={S.fuelLabel}>{t.fuelPickup}</Text>
            <Text style={S.fuelValue}>{fuelLabel(b.fuel_level_pickup, t)}</Text>
          </View>
          <View style={S.fuelBox}>
            <Text style={S.fuelLabel}>{t.fuelReturn}</Text>
            <Text style={S.fuelValue}>{fuelLabel(b.fuel_level_return, t)}</Text>
          </View>
        </View>

        {/* ── Price ── */}
        <Text style={S.sectionTitle}>{t.price}</Text>
        <View style={S.twoCol}>
          <View style={S.col}>
            <View style={S.priceRow}>
              <Text style={S.priceLabel}>{t.daily} × {b.total_days} {t.days}</Text>
              <Text style={S.priceValue}>{fmt(b.daily_rate_snapshot)}</Text>
            </View>
            {b.discount_applied_pct > 0 && (
              <View style={S.priceRow}>
                <Text style={S.priceLabel}>{t.discount} ({b.discount_applied_pct}%)</Text>
                <Text style={S.priceValue}>-{fmt((b.daily_rate_snapshot || 0) * b.total_days * b.discount_applied_pct / 100)}</Text>
              </View>
            )}
            {b.addons_total > 0 && (
              <View style={S.priceRow}>
                <Text style={S.priceLabel}>{t.extras}</Text>
                <Text style={S.priceValue}>{fmt(b.addons_total)}</Text>
              </View>
            )}
            {b.location_fee > 0 && (
              <View style={S.priceRow}>
                <Text style={S.priceLabel}>{t.locationFee}</Text>
                <Text style={S.priceValue}>{fmt(b.location_fee)}</Text>
              </View>
            )}
            {b.young_driver_fee > 0 && (
              <View style={S.priceRow}>
                <Text style={S.priceLabel}>{t.youngDriver}</Text>
                <Text style={S.priceValue}>{fmt(b.young_driver_fee)}</Text>
              </View>
            )}
            <View style={S.priceRow}>
              <Text style={S.priceLabel}>{t.tax}</Text>
              <Text style={S.priceValue}>{fmt(b.tax_amount)}</Text>
            </View>
            <View style={S.totalRow}>
              <Text style={S.totalLabel}>{t.total}</Text>
              <Text style={S.totalValue}>{fmt(b.total_amount)}</Text>
            </View>
          </View>

          <View style={S.col}>
            <View style={S.priceRow}>
              <Text style={S.priceLabel}>{t.deposit}</Text>
              <Text style={S.priceValue}>{fmt(b.deposit_amount)}</Text>
            </View>
            <View style={S.priceRow}>
              <Text style={S.priceLabel}>{t.method} ({t.price.toLowerCase()})</Text>
              <Text style={S.priceValue}>{b.payment_method || '—'}</Text>
            </View>
            <View style={S.priceRow}>
              <Text style={S.priceLabel}>{t.method} ({t.deposit.toLowerCase()})</Text>
              <Text style={S.priceValue}>{b.payment_method_deposit || '—'}</Text>
            </View>
            {b.booking_addons && b.booking_addons.length > 0 && (
              <>
                <Text style={[S.sectionTitle, { marginTop: 5 }]}>{t.addons}</Text>
                {b.booking_addons.map((a, i) => (
                  <View key={i} style={S.priceRow}>
                    <Text style={S.priceLabel}>{a.addon_name_snapshot} ×{a.quantity}</Text>
                    <Text style={S.priceValue}>{fmt(a.subtotal)}</Text>
                  </View>
                ))}
              </>
            )}
          </View>
        </View>

        {/* ── Terms ── */}
        <View style={S.twoCol}>
          <View style={S.col}>
            <View style={S.termsBox}>
              <Text style={S.termsTitle}>{t.fuelTitle}</Text>
              <Text style={S.termsText}>{t.fuelText}</Text>
            </View>
            <View style={S.termsBox}>
              <Text style={S.termsTitle}>{t.smokingTitle}</Text>
              <Text style={S.termsText}>{t.smokingText}</Text>
            </View>
          </View>
          <View style={S.col}>
            <View style={S.termsBox}>
              <Text style={S.termsTitle}>{t.kmTitle}</Text>
              <Text style={S.termsText}>{t.kmText}</Text>
            </View>
            <View style={S.termsBox}>
              <Text style={S.termsTitle}>{t.territoryTitle}</Text>
              <Text style={S.termsText}>{t.territoryText}</Text>
            </View>
            <View style={S.termsBox}>
              <Text style={S.termsTitle}>{t.conditionTitle}</Text>
              <Text style={S.termsText}>{t.conditionText}</Text>
            </View>
          </View>
        </View>

        {/* ── Declarations ── */}
        <View style={S.declBox}>
          <Text style={S.declText}>* {t.d1}</Text>
          <Text style={S.declText}>* {t.d2}</Text>
          <Text style={S.declText}>* {t.d3}</Text>
        </View>

        {/* ── Gold divider ── */}
        <View style={S.goldBar} />

        {/* ── Signatures ── */}
        <Text style={[S.sectionTitle, { marginTop: 0 }]}>{t.signaturesTitle}</Text>
        <View style={S.signArea}>
          <View style={S.signBox}>
            <Text style={S.signTop}>{t.clientName}: {b.guest_name || '____________________'}</Text>
            {signMark(signatureDataUrls, 'contract', 'client')}
            <Text style={S.signLabel}>{t.clientSign}</Text>
          </View>
          <View style={S.signBox}>
            <Text style={S.signTop}>{settings.company_name || 'RentInfra'}</Text>
            {signMark(signatureDataUrls, 'contract', 'company')}
            <Text style={S.signLabel}>{t.companySign}</Text>
          </View>
          {/* QR code */}
          {qrDataUrl ? (
            <View style={S.qrBlock}>
              <Image src={qrDataUrl} style={S.qrImg} />
              <Text style={S.qrLabel}>{t.qrLabel}</Text>
            </View>
          ) : null}
        </View>

      </Page>

      {/* ═══════════════════════════════════════════════════════════════════
          PAGE 2 — Vehicle condition / damage inspection
          ═══════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={S.page}>

        {/* ── Mini header ── */}
        <View style={S.miniHeader}>
          {logoDataUrl ? <Image src={logoDataUrl} style={S.miniLogoImg} /> : null}
          <View style={S.miniCompany}>
            <Text style={S.miniCompanyName}>{settings.company_name || 'RentInfra'}</Text>
            <Text style={S.miniCompanyInfo}>{settings.company_phone}  ·  {settings.company_email}</Text>
          </View>
          <View>
            <Text style={S.miniRef}>{t.reference} {b.reference}</Text>
            <Text style={S.miniRef}>{b.car ? `${b.car.make} ${b.car.model}` : ''}{b.car?.license_plate ? `  |  ${b.car.license_plate}` : ''}</Text>
            <Text style={S.miniRef}>{fmtDate(b.pickup_date)} → {fmtDate(b.dropoff_date)}</Text>
          </View>
        </View>

        {/* ── Diagram ── */}
        <View style={S.diagramSection}>
          <Text style={S.diagramTitle}>{t.damageTitle}</Text>
          <Text style={S.diagramSubtitle}>{t.damageSubtitle}</Text>
          {carDiagramDataUrl ? (
            <Image src={carDiagramDataUrl} style={S.diagramImg} />
          ) : null}
        </View>

        {/* ── Damage notes ── */}
        <Text style={S.notesLabel}>{t.damageNotes}</Text>
        <View style={S.notesBox} />

        {/* ── Delivery confirm + signatures ── */}
        <Text style={S.confirmText}>{t.damageConfirm}</Text>

        <View style={S.goldBar} />
        <View style={S.signArea}>
          <View style={S.signBox}>
            <Text style={S.signTop}>{t.clientName}: {b.guest_name || '____________________'}</Text>
            {signMark(signatureDataUrls, 'delivery', 'client')}
            <Text style={S.signLabel}>{t.page2ClientSign}</Text>
          </View>
          <View style={S.signBox}>
            <Text style={S.signTop}>{settings.company_name || 'RentInfra'}</Text>
            {signMark(signatureDataUrls, 'delivery', 'company')}
            <Text style={S.signLabel}>{t.page2CompSign}</Text>
          </View>
          {qrDataUrl ? (
            <View style={S.qrBlock}>
              <Image src={qrDataUrl} style={S.qrImg} />
              <Text style={S.qrLabel}>{t.qrLabel}</Text>
            </View>
          ) : null}
        </View>

        {/* ── Return section ── */}
        <View style={S.returnBox}>
          <Text style={[S.sectionTitle, { marginTop: 0 }]}>{t.returnSection}</Text>

          <View style={S.twoCol}>
            <View style={S.col}>
              <View style={S.row}><Text style={S.label}>{t.kmReturn}</Text><Text style={S.value}>{b.km_at_return ?? '___________'}</Text></View>
              <View style={S.row}><Text style={S.label}>{t.fuelReturn}</Text><Text style={S.value}>{fuelLabel(b.fuel_level_return, t)}</Text></View>
            </View>
            <View style={S.col}>
              <View style={S.row}><Text style={S.label}>{t.dropoff} {t.dateLabel}</Text><Text style={S.value}>{fmtDate(b.dropoff_date)}  {b.dropoff_time}</Text></View>
              <View style={S.row}><Text style={S.label}>{t.dropoff} {t.locationLabel}</Text><Text style={S.value}>{locName(b.dropoff_location)}</Text></View>
            </View>
          </View>

          <Text style={S.notesLabel}>{t.returnNotes}</Text>
          <View style={S.notesBoxReturn} />

          <Text style={S.confirmText}>{t.returnConfirm}</Text>

          <View style={S.goldBar} />
          <View style={S.signArea}>
            <View style={S.signBox}>
              <Text style={S.signTop}>{t.clientName}: {b.guest_name || '____________________'}</Text>
              {signMark(signatureDataUrls, 'return', 'client')}
              <Text style={S.signLabel}>{t.page2ClientSignReturn}</Text>
            </View>
            <View style={S.signBox}>
              <Text style={S.signTop}>{settings.company_name || 'RentInfra'}</Text>
              {signMark(signatureDataUrls, 'return', 'company')}
              <Text style={S.signLabel}>{t.page2CompSignReturn}</Text>
            </View>
          </View>
        </View>

      </Page>
    </Document>
  )
}
