import { formatCurrency, formatDate } from '@/lib/utils'

/**
 * Email bodies for each queue `template_key`.
 *
 * Plain, self-contained HTML with inline styles — email clients strip
 * stylesheets, and half of them will show the text version anyway, so every
 * template returns both.
 */

export interface TemplateContext {
  reference: string
  name: string
  companyName: string
  companyPhone?: string
  companyEmail?: string
  siteUrl: string
  carName?: string
  pickupDate?: string
  dropoffDate?: string
  totalAmount?: number
  cancellationPolicy?: string
}

export interface RenderedEmail {
  subject: string
  html: string
  text: string
}

const NAVY = '#0A1F44'
const GOLD = '#C9A84C'

function layout(companyName: string, heading: string, body: string, footer: string) {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f2f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#0b1220;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f4f7;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:${NAVY};padding:20px 28px;">
          <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:.5px;">${companyName}</span>
        </td></tr>
        <tr><td style="padding:28px;">
          <h1 style="margin:0 0 16px;font-size:20px;color:${NAVY};">${heading}</h1>
          ${body}
        </td></tr>
        <tr><td style="padding:18px 28px;background:#f8f9fa;color:#6b7280;font-size:12px;line-height:1.6;">
          ${footer}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

function detailRows(ctx: TemplateContext) {
  const row = (label: string, value: string) =>
    `<tr>
       <td style="padding:6px 0;color:#6b7280;font-size:14px;">${label}</td>
       <td style="padding:6px 0;color:${NAVY};font-size:14px;font-weight:600;text-align:right;">${value}</td>
     </tr>`

  const rows = [
    row('Reference', ctx.reference),
    ctx.carName ? row('Vehicle', ctx.carName) : '',
    ctx.pickupDate ? row('Pick-up', formatDate(ctx.pickupDate)) : '',
    ctx.dropoffDate ? row('Return', formatDate(ctx.dropoffDate)) : '',
    typeof ctx.totalAmount === 'number' ? row('Total', formatCurrency(ctx.totalAmount)) : '',
  ]
    .filter(Boolean)
    .join('')

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
            style="margin:18px 0;border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;">${rows}</table>`
}

function contactFooter(ctx: TemplateContext) {
  const bits = [ctx.companyPhone, ctx.companyEmail].filter(Boolean).join(' · ')
  return `${ctx.companyName}${bits ? ` · ${bits}` : ''}`
}

function plainDetails(ctx: TemplateContext) {
  return [
    `Reference: ${ctx.reference}`,
    ctx.carName ? `Vehicle: ${ctx.carName}` : '',
    ctx.pickupDate ? `Pick-up: ${formatDate(ctx.pickupDate)}` : '',
    ctx.dropoffDate ? `Return: ${formatDate(ctx.dropoffDate)}` : '',
    typeof ctx.totalAmount === 'number' ? `Total: ${formatCurrency(ctx.totalAmount)}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

type Renderer = (ctx: TemplateContext) => RenderedEmail

const templates: Record<string, Renderer> = {
  /** Sent as soon as a booking is placed — it is a request, not yet confirmed. */
  booking_confirmation: ctx => ({
    subject: `We have your booking — ${ctx.reference}`,
    html: layout(
      ctx.companyName,
      `Thanks, ${ctx.name}`,
      `<p style="margin:0;font-size:15px;line-height:1.6;">
         We have your booking request and will confirm it shortly. Keep this reference — you can
         use it to check your booking at any time.
       </p>
       ${detailRows(ctx)}
       <a href="${ctx.siteUrl}/my-booking"
          style="display:inline-block;background:${GOLD};color:${NAVY};text-decoration:none;
                 padding:11px 20px;border-radius:8px;font-weight:700;font-size:14px;">
         Check my booking
       </a>
       ${ctx.cancellationPolicy ? `<p style="margin:18px 0 0;font-size:13px;color:#6b7280;line-height:1.6;">${ctx.cancellationPolicy}</p>` : ''}`,
      contactFooter(ctx)
    ),
    text: `Thanks, ${ctx.name}

We have your booking request and will confirm it shortly.

${plainDetails(ctx)}

Check your booking: ${ctx.siteUrl}/my-booking

${contactFooter(ctx)}`,
  }),

  /** Sent when staff confirm the booking. */
  booking_confirmed: ctx => ({
    subject: `Booking confirmed — ${ctx.reference}`,
    html: layout(
      ctx.companyName,
      'Your booking is confirmed',
      `<p style="margin:0;font-size:15px;line-height:1.6;">
         You are all set, ${ctx.name}. Bring your driving licence and the card used for the
         booking when you collect the car.
       </p>
       ${detailRows(ctx)}
       <a href="${ctx.siteUrl}/my-booking"
          style="display:inline-block;background:${GOLD};color:${NAVY};text-decoration:none;
                 padding:11px 20px;border-radius:8px;font-weight:700;font-size:14px;">
         View booking
       </a>`,
      contactFooter(ctx)
    ),
    text: `Your booking is confirmed

You are all set, ${ctx.name}. Bring your driving licence and the card used for the booking.

${plainDetails(ctx)}

${ctx.siteUrl}/my-booking

${contactFooter(ctx)}`,
  }),

  /** Sent when a booking is cancelled, including by hold expiry. */
  booking_cancelled: ctx => ({
    subject: `Booking cancelled — ${ctx.reference}`,
    html: layout(
      ctx.companyName,
      'Your booking has been cancelled',
      `<p style="margin:0;font-size:15px;line-height:1.6;">
         Booking ${ctx.reference} has been cancelled. If this was not expected, reply to this
         email or call us and we will sort it out.
       </p>
       ${detailRows(ctx)}`,
      contactFooter(ctx)
    ),
    text: `Your booking has been cancelled

Booking ${ctx.reference} has been cancelled. If this was not expected, get in touch.

${plainDetails(ctx)}

${contactFooter(ctx)}`,
  }),

  /** Internal alert to the business, not the customer. */
  admin_new_booking: ctx => ({
    subject: `New booking ${ctx.reference} — ${ctx.carName || 'vehicle'}`,
    html: layout(
      ctx.companyName,
      'New booking received',
      `<p style="margin:0;font-size:15px;line-height:1.6;">
         ${ctx.name} has booked online. It is pending until you confirm it.
       </p>
       ${detailRows(ctx)}
       <a href="${ctx.siteUrl}/admin/bookings"
          style="display:inline-block;background:${NAVY};color:#ffffff;text-decoration:none;
                 padding:11px 20px;border-radius:8px;font-weight:700;font-size:14px;">
         Open in admin
       </a>`,
      contactFooter(ctx)
    ),
    text: `New booking received

${ctx.name} has booked online. Pending until you confirm it.

${plainDetails(ctx)}

${ctx.siteUrl}/admin/bookings`,
  }),
}

export function renderTemplate(key: string, ctx: TemplateContext): RenderedEmail | null {
  const render = templates[key]
  return render ? render(ctx) : null
}

export const TEMPLATE_KEYS = Object.keys(templates)
