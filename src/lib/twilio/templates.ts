import { formatCurrency, formatDate } from '@/lib/utils'

/**
 * WhatsApp/SMS message bodies. Plain text only — unlike email there is no
 * HTML version and no layout, and SMS in particular is cost- and
 * length-sensitive, so these stay short rather than mirroring the fuller
 * email copy.
 */

export interface MessageContext {
  reference: string
  name: string
  companyName: string
  companyPhone?: string
  carName?: string
  pickupDate?: string
  dropoffDate?: string
  totalAmount?: number
}

type Renderer = (ctx: MessageContext) => string

function dates(ctx: MessageContext): string {
  if (!ctx.pickupDate || !ctx.dropoffDate) return ''
  return ` ${formatDate(ctx.pickupDate)}–${formatDate(ctx.dropoffDate)}.`
}

const templates: Record<string, Renderer> = {
  booking_confirmation: ctx =>
    `${ctx.companyName}: Hi ${ctx.name}, we have your booking ${ctx.reference}` +
    `${ctx.carName ? ` (${ctx.carName})` : ''}.${dates(ctx)} We'll confirm shortly.`,

  booking_confirmed: ctx =>
    `${ctx.companyName}: Booking ${ctx.reference} is confirmed` +
    `${ctx.carName ? ` — ${ctx.carName}` : ''}.${dates(ctx)} Bring your licence and the card used to book.`,

  booking_cancelled: ctx =>
    `${ctx.companyName}: Booking ${ctx.reference} has been cancelled. Contact us` +
    `${ctx.companyPhone ? ` at ${ctx.companyPhone}` : ''} if this wasn't expected.`,

  admin_new_booking: ctx =>
    `${ctx.companyName}: New booking ${ctx.reference} from ${ctx.name}` +
    `${ctx.carName ? ` — ${ctx.carName}` : ''}.${dates(ctx)} ${
      typeof ctx.totalAmount === 'number' ? formatCurrency(ctx.totalAmount) : ''
    }`.trim(),
}

export function renderMessage(key: string, ctx: MessageContext): string | null {
  const render = templates[key]
  return render ? render(ctx) : null
}

export const MESSAGE_TEMPLATE_KEYS = Object.keys(templates)
