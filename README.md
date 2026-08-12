# RentInfra

[![CI](https://github.com/j4b3r/rentinfra/actions/workflows/ci.yml/badge.svg)](https://github.com/j4b3r/rentinfra/actions/workflows/ci.yml)
[![CodeQL](https://github.com/j4b3r/rentinfra/actions/workflows/codeql.yml/badge.svg)](https://github.com/j4b3r/rentinfra/actions/workflows/codeql.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

An open-source vehicle rental platform — cars, motorbikes and bicycles — free and MIT-licensed,
built to run an actual rental business rather than demo a booking form: real payments, an
availability system that can't be double-booked, vehicle handover with e-signature capture and
licence verification, fleet maintenance, and business reporting computed from real bookings.

- **Public site**: browse cars, motorbikes and bicycles (including EVs), book through a 4-step wizard, pay via Stripe (with 3D Secure), look up a booking by reference, blog + FAQ pages, customer account area
- **Admin panel**: bookings, fleet (with maintenance scheduling), addons, users, locations, testimonials, business reports, and settings; generate PDF rental contracts with a captured e-signature
- **Stack**: Next.js (App Router), TypeScript, Tailwind CSS, Supabase (PostgreSQL + Auth + Storage), Stripe, Resend, Twilio, next-intl (EN/ES), Vitest

## Live demo

**→ [demo.rentinfra.infranomad.com](https://demo.rentinfra.infranomad.com)**

Sign in to try the full product, including the admin panel:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@rentinfra.demo` | `RentInfraDemo2026!` |
| Customer | `user@rentinfra.demo` | `RentInfraDemo2026!` |

> The demo database is public, shared, and periodically reset — anything you change there may be wiped or altered by other visitors. Don't enter real personal data. The demo fleet and bookings are fake (seeded by the optional `supabase/migrations/demo_seed.sql`, which you should skip for a real deployment).

## Deploy your own

**Fastest path, on Vercel:** `vercel link` your fork, then `vercel integration add supabase` —
this provisions a Supabase project and wires its keys into your Vercel project automatically, no
manual Supabase account or env var copying. See **[DEPLOY.md → Fast path](./DEPLOY.md#fast-path-vercel-marketplace)**
for the full sequence, including the one-time Build Command override that applies
`supabase/migrations/*.sql` on first deploy.

Deploying elsewhere, or want to manage Supabase directly? The manual path still works:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/j4b3r/rentinfra&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,NEXT_PUBLIC_SITE_URL,CRON_SECRET&envDescription=Supabase%20credentials%2C%20your%20public%20site%20URL%2C%20and%20a%20secret%20for%20the%20scheduled%20jobs&envLink=https://github.com/j4b3r/rentinfra/blob/main/DEPLOY.md%234-collect-your-environment-variables)

**[DEPLOY.md](./DEPLOY.md) is the full step-by-step guide** for both paths — Supabase setup,
migrations, environment variables, Vercel deploy, auth configuration, custom domain, and
troubleshooting.

**Manual path, in short:**

| Step | What |
|------|------|
| 1 | Create a Supabase project |
| 2 | Run `supabase/migrations/001_schema.sql` through `008_booking_signatures.sql` in numeric order in the SQL editor (skip `demo_seed.sql` — it's demo-only data) |
| 3 | Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`, and `CRON_SECRET` (protects the two scheduled jobs) |
| 4 | Deploy to Vercel (or any Node host) |
| 5 | Set the Supabase **Site URL** and redirect allowlist to your domain |
| 6 | Register an account, then flip `profiles.is_admin` to `true` for it |
| 7 | Optional: connect Resend/Stripe/Twilio in **Admin → Settings → Integrations** |

## What's included

**Fleet**
- Cars, motorbikes and bicycles in one fleet, each showing only the specs that apply
- EV support: range, charging connector and charging time shown when a car or motorbike's fuel type is Electric
- Bicycles skip the licence, minimum age and young-driver surcharge; addons are filtered per vehicle type
- Per-branch fleet: cars can be scoped to a home location, or available everywhere (default)
- Maintenance blocks pull a vehicle from sale for a service window without faking a booking — every existing availability check picks this up automatically

**Booking**
- Date and location search from the homepage, carried through to the booking wizard
- Availability enforced everywhere: booked vehicles are shown as unavailable in search with the date they free up, and a database exclusion constraint makes double-booking impossible
- Unconfirmed bookings hold the vehicle for a configurable window, then release it automatically
- Pricing engine: seasonal rate lists, duration discount tiers, addons, location fees, young-driver surcharge, tax
- Guest booking with a reference (`RIF-YYYY-NNNNN`) plus lookup at `/my-booking`, or a signed-in customer account at `/account` with booking history
- Payment via Stripe Checkout (full or partial deposit) with 3D Secure enabled by default, refunds synced back automatically via webhook

**Vehicle handover & compliance**
- Pickup/return condition photos and staff-raised damage claims, stored in a private Storage bucket with signed URLs (never public)
- Driver's licence capture and staff verify/reject step, in its own private bucket separate from condition photos
- E-signature capture on a tablet/screen at the counter, embedded straight into the PDF contract — falls back to a blank line to sign by hand when no signature was captured

**Admin**
- Bookings with status, payment state, mileage, fuel, deposit method, condition reports, licence verification, signatures and notes
- Vehicles with photos, pricing, discount tiers and maintenance scheduling; addons, testimonials, users, locations — full CRUD
- Business reports: net revenue, utilization, RevPAV, achieved ADR, cancellation rate, addon attach rate
- Two-page A4 rental contract PDF (EN/ES) with damage diagram, captured e-signature and WhatsApp QR
- Every configurable value — including all API keys — lives in the `settings` table, editable from the panel, never in an env var

**Platform**
- Email via Resend, WhatsApp/SMS via Twilio: booking receipt, confirmation, cancellation and admin alerts, queued with retry
- Outbound channel-manager/OTA availability feed (bearer-token authenticated) for connecting a booking aggregator
- API keys managed from the admin panel, stored with row-level security so they never reach the browser
- EN/ES translations, SEO metadata and sitemap driven by your own domain
- Test suite (Vitest) covering pricing/availability/vehicle-status logic and API route auth, plus CI (build/lint/test/dependency audit), CodeQL security scanning and Dependabot dependency updates — see [Testing & CI](#testing--ci)

See **[ROADMAP.md](./ROADMAP.md)** for what's deliberately not built yet and why (inbound OTA sync, deposit pre-authorization, DE/RU translations, per-car addon assignment UI).

## License

MIT — see [LICENSE](./LICENSE). All content in this repo (copy, seed data, placeholder branding) is a generic demo — replace it with your own before going live. See the `TODO` comments throughout the codebase for what to swap in (logo, contact details, jurisdiction/legal text, etc.).

## Quick Start

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local` with your own Supabase project credentials:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Run every file in `supabase/migrations/` against your Supabase project, in numeric order
(`001_schema.sql` through `008_booking_signatures.sql`), via the Supabase SQL editor or CLI —
see [DEPLOY.md → step 3](./DEPLOY.md#3-run-the-database-migrations) for what each file adds.
Skip `demo_seed.sql` — it only contains fake data for the public demo.

After registering an account, promote yourself to admin so `/admin` is reachable:

```sql
update public.profiles set is_admin = true
where id = (select id from auth.users where email = 'you@example.com');
```

Then start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

```bash
npm run dev         # Start dev server on localhost:3000
npm run build       # Production build (always run before deploying)
npm run lint        # Lint check
npm test            # Run the test suite once
npm run test:watch  # Run tests in watch mode
```

## Testing & CI

`npm test` runs a Vitest suite covering pure business logic (pricing math, the availability
overlap check, vehicle status derivation, per-vehicle-type specs) and API route smoke tests
(booking creation, the admin auth guard, the Stripe webhook) via a hand-rolled Supabase mock —
see CLAUDE.md's Testing section for exactly what's covered and what isn't.

If you fork the repo, three GitHub Actions workflows come with it:

- **`ci.yml`** — build, lint, test, and a dependency audit on every push and PR. Doesn't gate
  Vercel's own deploy; it's a separate, visible check.
- **`codeql.yml`** — static security analysis on push/PR to `main` plus weekly.
- **`dependabot.yml`** + **`dependabot-auto-merge.yml`** — weekly dependency-update PRs,
  auto-merged once CI passes for patch/minor bumps; major bumps are left for manual review.

## Roadmap

RentInfra covers the full booking funnel, payments, handover/compliance and admin panel.
**[ROADMAP.md](./ROADMAP.md)** compares it against commercial rental platforms, tracks what's
shipped, and lays out what's left — inbound OTA/channel-manager sync, deposit pre-authorization,
and German/Russian translations.

## Customizing for your business

- Replace `public/logo.*` and wire it up in `Navbar`, `Footer`, auth pages, and the PDF contract generator (each has a `TODO` marking where)
- Update `messages/en.json` / `messages/es.json` and the `settings` table seed data with your own company details
- Update SEO metadata (`generateMetadata()` calls) across `src/app/(public)/**` with your own keywords and copy
- Review `src/lib/pdf/RentalContract.tsx` for jurisdiction/territory legal language and adjust for your market
