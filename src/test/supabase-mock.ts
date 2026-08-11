import { vi } from 'vitest'

export type MockResult<T = unknown> = { data: T | null; error: { message: string; code?: string } | null }

/**
 * A minimal fake Supabase query builder covering the chains this repo's
 * routes actually use: .from(table).select().eq().in().ilike().single(),
 * and .insert()/.update() with or without a trailing .select().single().
 *
 * `resultsByTable` lets a test script a different response per table name,
 * since a single route often touches several tables in one request (e.g.
 * POST /api/bookings reads `settings` twice, `cars` once, and inserts into
 * `bookings` and `booking_addons`). Each entry can be a single MockResult
 * (returned for every call against that table) or a function of the method
 * name that was invoked (so `.select()` and `.insert()` on the same table
 * can resolve differently).
 */
export function createSupabaseMock(options: {
  resultsByTable?: Record<string, MockResult | ((method: string) => MockResult)>
  rpc?: MockResult | ((fn: string, args: unknown) => MockResult)
  authUser?: { id: string } | null
  profile?: MockResult
} = {}) {
  const { resultsByTable = {}, rpc, authUser = null, profile } = options

  function resolveFor(table: string, method: string): MockResult {
    const entry = resultsByTable[table]
    if (typeof entry === 'function') return entry(method)
    if (entry) return entry
    return { data: null, error: null }
  }

  function makeBuilder(table: string) {
    // Tracks the operation (insert/update/delete/select) distinct from
    // filter/select chaining that follows it — `.insert(x).select().single()`
    // should still resolve as "insert" for a caller distinguishing read vs
    // write results (e.g. the bookings route's insert-error handling).
    let operation = 'select'
    const builder: Record<string, unknown> = {}
    const writeMethods = ['insert', 'update', 'delete']
    const chainMethods = ['select', 'eq', 'in', 'ilike', 'order', 'limit']

    writeMethods.forEach(method => {
      builder[method] = vi.fn((...args: unknown[]) => {
        operation = method
        void args
        return builder
      })
    })
    chainMethods.forEach(method => {
      builder[method] = vi.fn((...args: unknown[]) => {
        void args
        return builder
      })
    })

    builder.single = vi.fn(() => Promise.resolve(
      table === 'profiles' && profile ? profile : resolveFor(table, operation)
    ))

    // Make the builder itself thenable so a bare `await supabase.from(x).insert(y)`
    // (no trailing .select().single()) resolves too, matching how the real
    // supabase-js query builder is a PromiseLike.
    ;(builder as unknown as PromiseLike<MockResult>).then = ((resolve: (v: MockResult) => void) => {
      resolve(table === 'profiles' && profile ? profile : resolveFor(table, operation))
    }) as PromiseLike<MockResult>['then']

    return builder
  }

  const fromCalls: string[] = []
  // One builder per table, reused across repeated .from('same-table') calls
  // in a single request, so a test can assert on e.g.
  // builders.bookings.update.mock.calls.length after the route runs.
  const builders: Record<string, ReturnType<typeof makeBuilder>> = {}

  return {
    from: vi.fn((table: string) => {
      fromCalls.push(table)
      if (!builders[table]) builders[table] = makeBuilder(table)
      return builders[table]
    }),
    // Exposed so tests can assert directly on a table's insert/update/delete
    // mock (e.g. builders.bookings.update).
    _builders: builders,
    rpc: vi.fn((fn: string, args: unknown) => {
      const result = typeof rpc === 'function' ? rpc(fn, args) : rpc ?? { data: [], error: null }
      return Promise.resolve(result)
    }),
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: authUser } })),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => Promise.resolve({ data: null, error: null })),
        remove: vi.fn(() => Promise.resolve({ data: null, error: null })),
        createSignedUrl: vi.fn(() => Promise.resolve({ data: { signedUrl: 'https://example.com/signed' }, error: null })),
      })),
    },
    // Exposed for assertions like "insert on bookings was never called".
    _fromCalls: fromCalls,
  }
}

export type SupabaseMock = ReturnType<typeof createSupabaseMock>
