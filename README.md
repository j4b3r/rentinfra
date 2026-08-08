# RentInfra

An open-source vehicle rental booking platform — cars, motorbikes and bicycles — a SaaS boilerplate you can fork and customize for your own car rental business.

- **Public site**: browse cars, motorbikes and bicycles, book through a 4-step wizard, look up a booking by reference, blog + FAQ pages
- **Admin panel**: manage bookings, the fleet, addons, users, locations, testimonials and settings; generate PDF rental contracts
- **Stack**: Next.js (App Router), TypeScript, Tailwind CSS, Supabase (PostgreSQL + Auth + Storage), next-intl (EN/ES)

## Live demo

**→ [demo.rentinfra.infranomad.com](https://demo.rentinfra.infranomad.com)**

Sign in to try the full product, including the admin panel:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@rentinfra.demo` | `RentInfraDemo2026!` |
| Customer | `user@rentinfra.demo` | `RentInfraDemo2026!` |

> The demo database is public, shared, and periodically reset — anything you change there may be wiped or altered by other visitors. Don't enter real personal data. The demo fleet and bookings are fake (seeded by the optional `supabase/migrations/demo_seed.sql`, which you should skip for a real deployment).

## Deploy your own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/j4b3r/rentinfra&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,NEXT_PUBLIC_SITE_URL&envDescription=Supabase%20credentials%20and%20your%20public%20site%20URL&envLink=https://github.com/j4b3r/rentinfra/blob/main/DEPLOY.md%234-collect-your-environment-variables)

You will still need to create a Supabase project and run the migrations. **[DEPLOY.md](./DEPLOY.md) is the full step-by-step guide** — Supabase setup, migrations, environment variables, Vercel deploy, auth configuration, custom domain, and troubleshooting.

**In short:**

| Step | What |
|------|------|
| 1 | Create a Supabase project |
| 2 | Run `supabase/migrations/001` → `005`, then `007` → `012` in the SQL editor (skip `006`, it is demo data) |
| 3 | Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL` |
| 4 | Deploy to Vercel (or any Node host — nothing is Vercel-specific except the cron schedule) |
| 5 | Set the Supabase **Site URL** and redirect allowlist to your domain |
| 6 | Register an account, then flip `profiles.is_admin` to `true` for it |
| 7 | Optional: connect Resend for email in **Admin → Settings → Integrations** |

## What's included

**Fleet**
- Cars, motorbikes and bicycles in one fleet, each showing only the specs that apply
- Bicycles skip the licence, minimum age and young-driver surcharge; addons are filtered per vehicle type

**Booking**
- Date and location search from the homepage, carried through to the booking wizard
- Availability enforced everywhere: booked vehicles are shown as unavailable in search with the date they free up, and a database exclusion constraint makes double-booking impossible
- Unconfirmed bookings hold the vehicle for a configurable window, then release it automatically
- Pricing engine: seasonal rate lists, duration discount tiers, addons, location fees, young-driver surcharge, tax
- Guest booking with a reference (`RIF-YYYY-NNNNN`) plus lookup at `/my-booking`

**Admin**
- Bookings with status, payment state, mileage, fuel, deposit method and notes
- Vehicles with photos, pricing and discount tiers; testimonials; users; locations
- Two-page A4 rental contract PDF (EN/ES) with damage diagram and WhatsApp QR
- Every configurable value lives in the `settings` table, editable from the panel

**Platform**
- Email via Resend: booking receipt, confirmation, cancellation and admin alert, queued with retry
- API keys managed from the admin panel, stored with row-level security so they never reach the browser
- EN/ES translations, SEO metadata and sitemap driven by your own domain

Not yet included: payment collection, condition-report photos, and a customer account area. See **[ROADMAP.md](./ROADMAP.md)**.

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

Run `supabase/migrations/001_schema.sql` against your Supabase project via the Supabase SQL editor or CLI — it's the full schema in one file. Skip `demo_seed.sql` — it only contains fake data for the public demo.

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
npm run dev      # Start dev server on localhost:3000
npm run build    # Production build (always run before deploying)
npm run lint     # Lint check
```

## Roadmap

RentInfra covers the full booking funnel and admin panel, but it is not yet a complete rental
operation — there is no payment collection yet. **[ROADMAP.md](./ROADMAP.md)**
compares it against commercial rental platforms and lays out what to build next, in order.

## Customizing for your business

- Replace `public/logo.*` and wire it up in `Navbar`, `Footer`, auth pages, and the PDF contract generator (each has a `TODO` marking where)
- Update `messages/en.json` / `messages/es.json` and the `settings` table seed data with your own company details
- Update SEO metadata (`generateMetadata()` calls) across `src/app/(public)/**` with your own keywords and copy
- Review `src/lib/pdf/RentalContract.tsx` for jurisdiction/territory legal language and adjust for your market
