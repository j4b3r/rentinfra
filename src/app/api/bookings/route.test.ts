import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createSupabaseMock, type MockResult } from '@/test/supabase-mock'

const { mockCreateAdminClient } = vi.hoisted(() => ({ mockCreateAdminClient: vi.fn() }))

vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: mockCreateAdminClient,
}))
vi.mock('@/lib/email/send', () => ({
  enqueueEmail: vi.fn(),
  flushEmailQueueInBackground: vi.fn(),
}))
vi.mock('@/lib/twilio/send', () => ({
  enqueueMessage: vi.fn(),
  flushMessageQueueInBackground: vi.fn(),
}))
vi.mock('@/lib/payments/stripe', () => ({
  isPaymentsEnabled: vi.fn().mockResolvedValue(false),
  getUpfrontAmount: vi.fn(),
}))

import { POST } from './route'

const validBody = {
  carId: 'car-1',
  pickupDate: '2026-06-01',
  pickupTime: '10:00',
  dropoffDate: '2026-06-05',
  dropoffTime: '10:00',
  pickupLocationId: null,
  dropoffLocationId: null,
  guestName: 'Jane Doe',
  guestEmail: 'jane@example.com',
  guestPhone: '+34600000000',
  totalDays: 4,
  pricing: { dailyRate: 50, discountPct: 0, addonsTotal: 0, locationFee: 0, youngDriverFee: 0, subtotal: 200, taxAmount: 0, total: 200 },
}

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/bookings', {
    method: 'POST',
    body: JSON.stringify(body),
  }) as unknown as Parameters<typeof POST>[0]
}

/** settings/notify_settings lookups both read from the same 'settings' table. */
const emptySettingsResult: MockResult = { data: [], error: null }

describe('POST /api/bookings', () => {
  beforeEach(() => {
    mockCreateAdminClient.mockReset()
  })

  it('returns 409 with the next free date when the car has a conflicting booking', async () => {
    const mock = createSupabaseMock({
      resultsByTable: { settings: emptySettingsResult },
      rpc: {
        data: [{ car_id: 'car-1', pickup_date: '2026-06-02', dropoff_date: '2026-06-06' }],
        error: null,
      },
    })
    mockCreateAdminClient.mockResolvedValue(mock)

    const res = await POST(makeRequest(validBody))
    const body = await res.json()

    expect(res.status).toBe(409)
    expect(body.error).toMatch(/not available/i)
    expect(body.nextAvailableDate).toBe('2026-06-06')
  })

  it('creates the booking and returns 200 with a reference when dates are free', async () => {
    const mock = createSupabaseMock({
      resultsByTable: {
        settings: emptySettingsResult,
        cars: { data: { make: 'Test', model: 'Car' }, error: null },
        bookings: (method: string) =>
          method === 'insert'
            ? { data: { id: 'booking-1', reference: 'RIF-2026-00001' }, error: null }
            : { data: null, error: null },
      },
      rpc: { data: [], error: null },
    })
    mockCreateAdminClient.mockResolvedValue(mock)

    const res = await POST(makeRequest(validBody))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual({
      reference: 'RIF-2026-00001',
      id: 'booking-1',
      payment: { enabled: false, amountDue: null, isPartial: false },
    })
  })

  it('returns 409 (not 500) when the insert hits the exclusion-constraint race (23P01)', async () => {
    const mock = createSupabaseMock({
      resultsByTable: {
        settings: emptySettingsResult,
        bookings: (method: string) =>
          method === 'insert'
            ? { data: null, error: { message: 'exclusion violation', code: '23P01' } }
            : { data: null, error: null },
      },
      rpc: { data: [], error: null },
    })
    mockCreateAdminClient.mockResolvedValue(mock)

    const res = await POST(makeRequest(validBody))
    const body = await res.json()

    expect(res.status).toBe(409)
    expect(body.error).toMatch(/not available/i)
  })

  it('returns 500 for any other insert error', async () => {
    const mock = createSupabaseMock({
      resultsByTable: {
        settings: emptySettingsResult,
        bookings: (method: string) =>
          method === 'insert'
            ? { data: null, error: { message: 'unexpected db error' } }
            : { data: null, error: null },
      },
      rpc: { data: [], error: null },
    })
    mockCreateAdminClient.mockResolvedValue(mock)

    const res = await POST(makeRequest(validBody))
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBe('Failed to create booking')
  })
})
