# Contributing to RentInfra

RentInfra is MIT-licensed and open to contributions — bug fixes, new features, translations,
documentation. This is a guide to working in the codebase, not a legal agreement.

## Before you start

For anything beyond a small fix, open an issue first describing what you want to change and why.
That avoids duplicated work and lets us agree on approach before you write code — especially for
anything touching `src/lib/availability.ts`, RLS policies, or the pricing engine, where a
seemingly small change can have wide blast radius (see "Where the sharp edges are" below).

## Local setup

```bash
git clone https://github.com/j4b3r/rentinfra.git
cd rentinfra
npm install
cp .env.example .env.local
```

Create a Supabase project and run the migrations in `supabase/migrations/` in numeric order
(`001_schema.sql` → `008_booking_signatures.sql`; skip `demo_seed.sql` unless you want the demo
fleet for local testing). Full steps, including auth configuration, are in
**[DEPLOY.md](./DEPLOY.md)**.

```bash
npm run dev      # http://localhost:3000
npm run build    # must pass before opening a PR
npm run lint
npm test         # must pass before opening a PR
```

## Making changes

- **Match existing conventions.** Route groups, file layout, and the settings/secrets pattern
  (see below) are established — follow them rather than introducing a new pattern for one
  feature.
- **New configurable values go in `settings`**, not env vars or hardcoded constants, with a new
  numbered migration (`00N_description.sql`) — never edit `001_schema.sql` in place, it's a
  fresh-install snapshot. Wire the new setting into the relevant page under
  `/admin/settings/*`.
- **Secrets** (API keys, tokens) are rows in `settings` with `is_secret = true`, read only via
  `getSecret()`/`getSecrets()` (service-role, server-side). Never return a secret in an API
  response, and never read one from `getSettingsMap()` — that function deliberately excludes
  them.
- **Every `/api/admin/*` route** must call `requireAdmin()` from `lib/auth-guard.ts` as its first
  statement. Middleware only protects admin *pages*; API routes use the service-role client and
  bypass RLS, so the guard is the only thing standing between an unauthenticated request and the
  database.
- **Availability logic** lives in one place, `src/lib/availability.ts` — the fleet listing, car
  detail page, and booking API all call the same functions so they can't disagree. If a change
  needs different behavior in one of those call sites, that's a sign the shared function needs a
  new parameter, not a local reimplementation.
- **Log lifecycle events** with `logEvent()` from `lib/events.ts` when adding anything that
  changes a booking's state.
- **Add tests for anything in `src/lib/`** that's a pure function of its arguments — see the
  existing `*.test.ts` files co-located next to their source, and CLAUDE.md's Testing section for
  the mocking pattern used for API route tests (there's no dependency-injection seam in the route
  handlers, so those intercept `@/lib/supabase/server` at the module level via `vi.mock`).

## Where the sharp edges are

These are the places where a change that looks safe in isolation can break something elsewhere:

- `get_car_availability()` (Postgres function) and `bookings_no_overlap` (exclusion constraint)
  are the structural backstop for double-booking prevention. If you change overlap semantics,
  change them in the SQL function and in `src/lib/availability.ts` together, and re-verify both
  the fleet listing and the booking API.
- RLS policies gate every table. If a new table needs to be readable by anonymous visitors,
  prefer a narrow `SECURITY DEFINER` RPC (like `get_car_availability()`) over relaxing RLS on the
  underlying table.
- `condition-photos`, `licence-documents` and `signatures` are private Storage buckets,
  deliberately separate from each other and from the public `car-images` bucket. Don't
  consolidate them — a licence scan is an identity document with a different retention profile
  than vehicle-damage evidence or a captured signature.

## Pull requests

- Keep PRs scoped to one change. Large mixed PRs (feature + refactor + formatting) are hard to
  review and easy to get wrong.
- Run `npm run build`, `npm run lint`, and `npm test` before opening the PR — CI runs all three
  (plus a dependency audit) on every push and PR, so a red check on your PR reflects one of these
  failing.
- Describe what changed and why, not just what — especially for anything touching pricing,
  availability, or RLS.
- If you're adding a new setting, confirm the migration number doesn't collide with one already
  merged on `main`.

## Translations

UI strings live in `messages/en.json` and `messages/es.json` via `next-intl`. German and Russian
(`#12` in [ROADMAP.md](./ROADMAP.md)) are on the roadmap but not started — a PR adding a new
locale should extend both the messages file and the locale-detection logic in
`src/i18n/request.ts`, not just translate strings in isolation.

## Reporting security issues

Don't open a public issue for a security vulnerability. See [SECURITY.md](./SECURITY.md) if
present, or otherwise open a private report via GitHub's "Report a vulnerability" flow.
