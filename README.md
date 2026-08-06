# RentInfra

An open-source, generic car rental booking platform — a SaaS boilerplate you can fork and customize for your own car rental business.

- **Public site**: browse a fleet, book a car through a 4-step wizard, look up a booking by reference, blog + FAQ pages
- **Admin panel**: manage bookings, cars, addons, users, locations, and settings; generate PDF rental contracts
- **Stack**: Next.js (App Router), TypeScript, Tailwind CSS, Supabase (PostgreSQL + Auth + Storage), next-intl (EN/ES)

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

Run the SQL migrations in `supabase/migrations/` against your Supabase project (in order, `001` → `005`) via the Supabase SQL editor or CLI.

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
