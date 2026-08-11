import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createSupabaseMock } from '@/test/supabase-mock'

const { mockCreateAdminClient } = vi.hoisted(() => ({ mockCreateAdminClient: vi.fn() }))

vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: mockCreateAdminClient,
  createClient: mockCreateAdminClient,
}))

import { POST } from './route'

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/admin/cars', {
    method: 'POST',
    body: JSON.stringify(body),
  }) as unknown as Parameters<typeof POST>[0]
}

describe('POST /api/admin/cars', () => {
  beforeEach(() => {
    mockCreateAdminClient.mockReset()
  })

  it('rejects with 403 and makes zero DB writes when there is no authenticated user', async () => {
    // requireAdmin() runs for real here — only the Supabase client factory is
    // mocked — to prove the actual guard executes, not a stand-in that
    // returns whatever the test told it to.
    const mock = createSupabaseMock({ authUser: null })
    mockCreateAdminClient.mockResolvedValue(mock)

    const res = await POST(makeRequest({ make: 'Test', model: 'Car' }))

    expect(res.status).toBe(403)
    expect(mock._fromCalls).not.toContain('cars')
  })

  it('rejects with 403 for an authenticated non-admin user', async () => {
    const mock = createSupabaseMock({
      authUser: { id: 'user-1' },
      profile: { data: { is_admin: false }, error: null },
    })
    mockCreateAdminClient.mockResolvedValue(mock)

    const res = await POST(makeRequest({ make: 'Test', model: 'Car' }))

    expect(res.status).toBe(403)
    expect(mock._fromCalls).not.toContain('cars')
  })
})
