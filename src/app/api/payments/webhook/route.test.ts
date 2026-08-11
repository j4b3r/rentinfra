import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createSupabaseMock } from '@/test/supabase-mock'

const { mockCreateAdminClient, mockGetWebhookSecret, mockGetStripe, mockConstructEvent } = vi.hoisted(() => ({
  mockCreateAdminClient: vi.fn(),
  mockGetWebhookSecret: vi.fn(),
  mockGetStripe: vi.fn(),
  mockConstructEvent: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: mockCreateAdminClient,
}))
vi.mock('@/lib/payments/stripe', () => ({
  getWebhookSecret: mockGetWebhookSecret,
  getStripe: mockGetStripe,
}))
vi.mock('@/lib/email/send', () => ({
  enqueueEmail: vi.fn(),
  flushEmailQueueInBackground: vi.fn(),
}))
vi.mock('@/lib/twilio/send', () => ({
  enqueueMessage: vi.fn(),
  flushMessageQueueInBackground: vi.fn(),
}))

import { POST } from './route'

function makeRequest(body: string, headers: Record<string, string> = { 'stripe-signature': 'sig_test' }) {
  return new Request('http://localhost/api/payments/webhook', {
    method: 'POST',
    headers,
    body,
  }) as unknown as Parameters<typeof POST>[0]
}

describe('POST /api/payments/webhook', () => {
  beforeEach(() => {
    mockCreateAdminClient.mockReset()
    mockGetWebhookSecret.mockReset()
    mockGetStripe.mockReset()
    mockConstructEvent.mockReset()
  })

  it('returns 400 when the stripe-signature header is missing', async () => {
    const res = await POST(makeRequest('{}', {}))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/signature/i)
  })

  it('fails closed with 400 when no webhook secret is configured', async () => {
    mockGetWebhookSecret.mockResolvedValue(null)
    const res = await POST(makeRequest('{}'))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/not configured/i)
  })

  it('returns 400 when signature verification throws', async () => {
    mockGetWebhookSecret.mockResolvedValue('whsec_test')
    mockGetStripe.mockResolvedValue({ webhooks: { constructEvent: mockConstructEvent } })
    mockConstructEvent.mockImplementation(() => {
      throw new Error('invalid signature')
    })

    const res = await POST(makeRequest('raw-body'))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/invalid signature/i)
  })

  it('is idempotent: does not update or re-notify an already-paid booking', async () => {
    mockGetWebhookSecret.mockResolvedValue('whsec_test')
    mockGetStripe.mockResolvedValue({ webhooks: { constructEvent: mockConstructEvent } })
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          payment_status: 'paid',
          metadata: { booking_id: 'booking-1', is_partial: 'false' },
          amount_total: 20000,
          payment_intent: 'pi_test',
        },
      },
    })

    const mock = createSupabaseMock({
      resultsByTable: {
        bookings: (op: string) =>
          op === 'select'
            ? { data: { id: 'booking-1', payment_status: 'paid', guest_email: 'jane@example.com' }, error: null }
            : { data: null, error: null },
      },
    })
    mockCreateAdminClient.mockResolvedValue(mock)

    const res = await POST(makeRequest('raw-body'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual({ received: true })
    // 'bookings' should have been read but never written to, since the
    // booking was already paid — this is the idempotency guarantee that
    // stops a Stripe retry from sending a second confirmation email.
    expect(mock._builders.bookings.update).not.toHaveBeenCalled()
  })

  it('updates payment_status to paid for an unpaid booking on a valid completed session', async () => {
    mockGetWebhookSecret.mockResolvedValue('whsec_test')
    mockGetStripe.mockResolvedValue({ webhooks: { constructEvent: mockConstructEvent } })
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          payment_status: 'paid',
          metadata: { booking_id: 'booking-1', is_partial: 'false' },
          amount_total: 20000,
          payment_intent: 'pi_test',
        },
      },
    })

    const mock = createSupabaseMock({
      resultsByTable: {
        bookings: (op: string) =>
          op === 'select'
            ? { data: { id: 'booking-1', payment_status: 'unpaid', guest_email: null, guest_phone: null }, error: null }
            : { data: null, error: null },
      },
    })
    mockCreateAdminClient.mockResolvedValue(mock)

    const res = await POST(makeRequest('raw-body'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual({ received: true })
    expect(mock._builders.bookings.update).toHaveBeenCalledWith(
      expect.objectContaining({ payment_status: 'paid' })
    )
  })

  it('acknowledges an unhandled event type with 200 and no-op', async () => {
    mockGetWebhookSecret.mockResolvedValue('whsec_test')
    mockGetStripe.mockResolvedValue({ webhooks: { constructEvent: mockConstructEvent } })
    mockConstructEvent.mockReturnValue({ type: 'customer.created', data: { object: {} } })

    const mock = createSupabaseMock()
    mockCreateAdminClient.mockResolvedValue(mock)

    const res = await POST(makeRequest('raw-body'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual({ received: true })
  })
})
