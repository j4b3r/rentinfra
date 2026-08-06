# RentInfra

An open-source, generic car rental booking platform — a SaaS boilerplate you can fork and customize for your own car rental business.

- **Public site**: browse a fleet, book a car through a 4-step wizard, look up a booking by reference, blog + FAQ pages
- **Admin panel**: manage bookings, cars, addons, users, locations, and settings; generate PDF rental contracts
- **Stack**: Next.js (App Router), TypeScript, Tailwind CSS, Supabase (PostgreSQL + Auth + Storage), next-intl (EN/ES)

## Live demo

**→ [rentinfra.vercel.app](https://rentinfra.vercel.app)**

Sign in to try the full product, including the admin panel:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@rentinfra.demo` | `RentInfraDemo2026!` |
| Customer | `user@rentinfra.demo` | `RentInfraDemo2026!` |

> The demo database is public, shared, and periodically reset — anything you change there may be wiped or altered by other visitors. Don't enter real personal data. The demo fleet and bookings are fake (seeded by the optional `supabase/migrations/006_demo_seed.sql`, which you should skip for a real deployment).

## Deploy your own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/j4b3r/rentinfra&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,NEXT_PUBLIC_SITE_URL&envDescription=Supabase%20credentials%20and%20your%20public%20site%20URL&envLink=https://github.com/j4b3r/rentinfra/blob/main/DEPLOY.md%234-collect-your-environment-variables)

You will still need to create a Supabase project and run the migrations. **[DEPLOY.md](./DEPLOY.md) is the full step-by-step guide** — Supabase setup, migrations, environment variables, Vercel deploy, auth configuration, custom domain, and troubleshooting.

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

Run the SQL migrations in `supabase/migrations/` against your Supabase project (in order, `001` → `005`) via the Supabase SQL editor or CLI. Skip `006_demo_seed.sql` — it only contains fake data for the public demo.

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

## Customizing for your business

- Replace `public/logo.*` and wire it up in `Navbar`, `Footer`, auth pages, and the PDF contract generator (each has a `TODO` marking where)
- Update `messages/en.json` / `messages/es.json` and the `settings` table seed data with your own company details
- Update SEO metadata (`generateMetadata()` calls) across `src/app/(public)/**` with your own keywords and copy
- Review `src/lib/pdf/RentalContract.tsx` for jurisdiction/territory legal language and adjust for your market
