# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RentInfra — an open-source car rental SaaS boilerplate. It ships as a full car rental booking website (public site, booking wizard, admin panel) with generic placeholder branding and content, meant to be forked/deployed and customized for a real car rental business. Deployed on Vercel, database on Supabase.

- **Live demo**: https://demo.rentinfra.infranomad.com (replace with your own domain)
- **Stack**: Next.js 14 (App Router), Tailwind CSS, Supabase (PostgreSQL + Auth + Storage), next-intl (EN/ES)
- **Repo**: github.com/j4b3r/rentinfra
- **License**: MIT

## Commands

```bash
npm run dev      # Start dev server on localhost:3000
npm run build    # Production build (always run before pushing)
npm run lint     # Lint check
```

Always run `npm run build` before pushing — Vercel auto-deploys from main.

## Architecture

### Route Groups
- `src/app/(public)/` — public-facing website with Navbar + Footer layout
- `src/app/admin/` — admin panel, protected by middleware (is_admin check)
- `src/app/api/` — API routes (bookings POST, bookings/lookup GET)

### Key Files
- `src/middleware.ts` — protects `/admin` routes, refreshes Supabase session
- `src/lib/supabase/client.ts` — browser Supabase client
- `src/lib/supabase/server.ts` — server Supabase client + admin client (service role)
- `src/lib/pricing.ts` — all pricing logic (daily rate, discounts, addons, fees)
- `src/lib/utils.ts` — formatCurrency, formatDate, cn(), status colors
- `src/types/index.ts` — all TypeScript types
- `src/i18n/request.ts` — locale detection via cookie
- `messages/en.json` + `messages/es.json` — UI translations

### Availability (`src/lib/availability.ts`)
Single source of truth for overlap rules — used by `/cars`, the car detail page and
`POST /api/bookings` so they can never disagree. Reads through the `get_car_availability()`
RPC because RLS hides `bookings` from anonymous visitors. Overlap uses strict inequalities,
so same-day turnaround stays bookable. `bookings_no_overlap` enforces it in the DB regardless.

### Booking Flow
Homepage `SearchPanel` (dates + location) → `/cars?pickup=&dropoff=&location=` → car detail → `/booking/[carSlug]?pickup=&dropoff=&location=` → `BookingWizard` (4 steps: Dates, Extras, Details, Review) → POST `/api/bookings` → Confirmation page with reference (CMB-YYYY-NNNNN)

Guest lookup: `/my-booking` → GET `/api/bookings/lookup?reference=&email=`

### Pricing Engine (`src/lib/pricing.ts`)
- `getActivePriceList()` — picks seasonal or standard price list for a car
- `getDiscountForDays()` — finds matching discount tier (e.g. 3+ days = 10%)
- `calculateBookingPrice()` — returns full breakdown: daily rate, discount, addons, location fee, young driver surcharge, tax, total

### Admin Panel (`/admin`)
Sidebar nav: Dashboard, Bookings, Cars, Addons, Users, Locations, Testimonials, Settings, Translations.

**Testimonials** (`/admin/testimonials`): CRUD for homepage reviews. Only `is_published` rows render publicly, and the homepage section is hidden entirely when none exist — a fresh install ships no invented social proof. Aggregate figures come from the `social_proof_rating` / `social_proof_count` settings keys and only show when both are set.

**Bookings** (`/admin/bookings/[id]`): full detail view — guest info, vehicle, dates, extras, price breakdown, timeline. Right sidebar: change booking status, payment status, KM at pickup/return, fuel level at pickup/return, deposit payment method, internal notes. Buttons at top generate PDF contract in ES or EN.

**Cars** (`/admin/cars`): list with image, price, status. Add/edit at `/admin/cars/new` and `/admin/cars/[id]`. CarForm covers all fields + pricing + discount tiers + photo upload (edit mode only). Photos managed via `CarImageUploader` — drag/drop, set cover, delete.

**Rental Contract PDF** (`GET /api/admin/bookings/[id]/contract?lang=es|en`):
- 2-page A4 PDF using `@react-pdf/renderer` with Inter font (woff, supports full unicode/Spanish accents)
- Page 1: company header with logo, client details, vehicle, pickup/return dates, fuel levels, price breakdown, terms (fuel, no smoking, km limit, Andalucía territory), declarations, signatures + WhatsApp QR
- Page 2: mini header, car damage diagram (top/front/rear/side views) for marking existing damage, delivery notes box, delivery signatures + QR, return section (KM, fuel, notes, return signatures)
- WhatsApp QR pre-fills a message with booking ref, guest, dates, car and total; uses `social_whatsapp` from settings
- PDF assets: `src/lib/pdf/fonts/Inter-Regular.woff`, `Inter-Bold.woff`, `car-diagram.png`

Settings stored as key-value in `settings` table. Settings panel has 6 sub-pages with sidebar nav:
- `/admin/settings` — General (company name, phone, email, address, website, currency)
- `/admin/settings/rental-rules` — Min age, license years, young driver fee, second driver fee, deposit %, tax, after-hours fee
- `/admin/settings/office-hours` — Open/close time, after-hours fee
- `/admin/settings/booking-policy` — Min advance hours, max days ahead, cancellation policy EN/ES, terms date
- `/admin/settings/notifications` — Admin alert email, toggle: new booking alert, booking confirmation, WhatsApp; SMTP sender name/email
- `/admin/settings/social-media` — Facebook, Instagram, TikTok, WhatsApp URLs
- `/admin/settings/integrations` — Resend + Stripe credentials, with a connection test. Secrets shown masked.

**Secrets rule**: API keys live in `settings` with `is_secret = TRUE`. Read them **only** via
`getSecret()`/`getSecrets()` (service-role, server-side). `getSettingsMap()` excludes them and is
the only thing safe to pass to client components. Never return a secret in an API response.

**Admin API rule**: every route under `/api/admin/*` must call `requireAdmin()` from
`lib/auth-guard.ts` as its first statement. Middleware only protects `/admin` *pages*, and these
routes use the service-role client, which bypasses RLS.

**Email**: `enqueueEmail()` writes to `notifications_queue`; `processEmailQueue()` sends via
Resend with 3 attempts. Callers enqueue then call `flushEmailQueueInBackground()` (waitUntil) so
delivery never blocks a response. Templates live in `lib/email/templates.ts`. All of it is inert
until a key + sender + `email_enabled` are set in Settings → Integrations.

**Settings rule**: When adding any new feature that has a configurable value (fee, toggle, text, limit), add it as a row in the `settings` table and wire it to the appropriate settings sub-page. Run a new migration `00X_...sql` for any new keys.

Current setting keys: `social_proof_rating`, `social_proof_count`, `hero_headline_en`, `hero_headline_es`, `company_name`, `company_phone`, `company_email`, `company_address`, `company_website`, `google_maps_url`, `currency`, `min_driver_age`, `min_license_years`, `young_driver_surcharge_per_day`, `second_driver_fee`, `deposit_percentage`, `tax_rate`, `after_hours_fee`, `office_hours_open`, `office_hours_close`, `min_advance_hours`, `max_booking_days_ahead`, `cancellation_policy_en`, `cancellation_policy_es`, `terms_last_updated`, `notify_admin_email`, `notify_new_booking`, `notify_booking_confirm`, `notify_whatsapp_enabled`, `smtp_from_name`, `smtp_from_email`, `social_facebook`, `social_instagram`, `social_tiktok`, `social_whatsapp`

### Database Schema (Supabase)
Key tables: `cars`, `car_images`, `price_lists`, `price_list_discounts`, `addons`, `car_addons`, `locations`, `bookings`, `booking_addons`, `profiles`, `settings`, `notifications_queue`, `translations`, `blog_posts`, `faqs`, `testimonials`

Migrations:
- `001_initial_schema.sql` — full base schema
- `002_blog_faq.sql` — blog_posts, faqs tables
- `003_settings_expansion.sql` — additional settings keys
- `004_car_images_storage.sql` — `storage_path` on car_images, `car-images` bucket + RLS
- `005_booking_contract_fields.sql` — `cars.license_plate`; bookings: `guest_nie_passport`, `guest_address`, `guest_address_spain`, `km_at_pickup`, `km_at_return`, `fuel_level_pickup`, `fuel_level_return`, `payment_method_deposit`
- `006_demo_seed.sql` — **optional**, demo-only fleet/photos/bookings. Skip for real deployments.
- `007_testimonials.sql` — `testimonials` table + RLS + homepage social-proof settings keys
- `008_availability.sql` — `get_car_availability()` (SECURITY DEFINER, lets the public site check availability without reading booking records) + `bookings_no_overlap` exclusion constraint
- `009_booking_holds.sql` — `hold_expires_at`, `booking_hold_*` settings, `expire_stale_booking_holds()`
- `010_secret_settings.sql` — `settings.is_secret` + narrowed read policy; Resend/Stripe credential rows
- `011_notification_delivery.sql` — `attempts`/`last_attempt`/`subject` on `notifications_queue`

- Booking references auto-generated by DB trigger: `CMB-YYYY-NNNNN`
- RLS enabled on all tables. `is_admin()` function checks `profiles.is_admin`
- `handle_new_user()` trigger auto-creates a profile on signup

### SEO Strategy
- Every page exports `generateMetadata()` with title, description, keywords, openGraph, twitter cards
- `src/app/sitemap.ts` — auto-generated sitemap at `/sitemap.xml`
- `src/app/robots.ts` — robots.txt
- Blog posts at `/blog/[slug]` with full article schema (JSON-LD)
- Target keywords: "car rental marbella", "rent a car costa del sol", "alquiler coches marbella", "cheap car hire marbella airport"
- All pages have canonical URLs, og:image, structured data where applicable
- Images use descriptive alt text with location keywords

### Auth
- Email/password via Supabase Auth
- Google OAuth via Supabase Auth (provider must be enabled in Supabase dashboard)
- Register page: country code flag selector (libphonenumber-js), password strength meter
- Profile page: avatar, personal details, license info, booking history

### UI Design System

**Fonts**: Inter (body/UI), Playfair Display (hero/display headings) — loaded via Google Fonts in `globals.css`

**Colors**:
- Navy: `#0A1F44` (backgrounds, text)
- Gold: `#C9A84C` (accents, CTAs)
- Background: `#F8F9FA`

**CSS utility classes** (defined in `globals.css`):
- `.gradient-text` — animated gold shimmer gradient text
- `.btn-gold` — gold gradient button with hover position shift
- `.glass` — frosted glass card (backdrop-blur, white/10 bg)
- `.card-lift` — hover: translateY(-4px) + shadow
- `.animate-fade-up` — fade + slide-up animation, use `style={{ animationDelay: '...' }}` for stagger

**Component conventions**:
- Section backgrounds alternate: `#F8F9FA` → `bg-white` → navy (`#0A1F44`) → repeat
- Cards: `rounded-2xl shadow-sm border border-gray-100` on white
- Icons: gold (`text-[#C9A84C]`) on light sections; white/gold on dark
- All primary CTAs use `.btn-gold text-[#0A1F44]`
- Section headers: small gold uppercase label + bold white/navy h2 + gray description
- Decorative blobs: `bg-[#C9A84C]/5` circles with `blur-3xl` for depth

### Social Media
- Facebook, Instagram, TikTok links in footer (configured via settings table)

## Environment Variables

Required in `.env.local` and Vercel:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=
```

## Completed
- Full public website: home, cars listing, car detail, booking wizard, confirmation, my-booking lookup
- Blog section with 3 seed posts + SEO metadata + JSON-LD Article schema
- FAQ page with category grouping + FAQ schema JSON-LD
- Customer Care, Terms & Conditions, Privacy Policy pages
- EN/ES translations (next-intl)
- Google OAuth + email/password auth, country flag phone input, password strength meter
- Admin panel scaffold: Dashboard, Bookings, Cars, Addons, Users, Locations, Settings, Translations
- Full UI design system: Google Fonts, CSS animations, utility classes (.btn-gold, .card-lift, .animate-fade-up, .gradient-text, .glass)
- Testimonials section, redesigned all home sections
- Logo tracked in git and deployed to Vercel
- ~~**[#1]**~~ Admin Car CRUD (add/edit/delete + price list + discount tiers + license plate)
- ~~**[#2]**~~ Admin Car photo upload (Supabase Storage `car-images` bucket)
- ~~**[#3]**~~ Admin Booking detail page (status, payment, KM, fuel, deposit method, notes)
- ~~**[#8]**~~ Connected custom domain to Vercel
- Rental contract PDF (2-page A4, EN + ES, logo, Inter font, WhatsApp QR, damage inspection diagram)

## Planned / Todo

See **[ROADMAP.md](./ROADMAP.md)** for the full gap analysis against commercial rental
platforms, with rationale and suggested build order.

**P0 — blocks real use** ✅ done
- ~~**[#13]** Availability check inverted~~ · ~~**[#14]** availability shown in search~~ · ~~**[#15]** exclusion constraint~~ · ~~**[#16]** hold expiry~~ — **P0 complete 2026-08-07**

**P1 — needed to operate**
- ~~**[#9]** Email notifications~~ — done 2026-08-07 (Resend, admin-managed key, queue worker with retry)
- **[#10]** Payments (Stripe/PayPal) + deposit pre-authorization and release
- **[#17]** Vehicle handover: condition photos, damage markers, signature, deposit deductions
- **[#7]** User profile page + booking history (/account)

**P2 — competitive**
- **[#18]** Fleet ops: maintenance schedule, richer vehicle status, fleet calendar
- **[#19]** Reporting: utilization, RevPAV, ADR, cancellation and attach rates
- **[#20]** Rate management: day-of-week rates, blackout dates, per-location pricing
- **[#4]** Admin: Addon CRUD
- **[#5]** Admin: Location CRUD
- **[#6]** Admin: Offline booking form

**P3 — later**
- **[#21]** Driver licence verification (store + staff-verify; automated check is third-party)
- **[#22]** Multi-location logistics: one-way rentals, inter-branch transfers
- **[#11]** WhatsApp notifications via Twilio
- **[#12]** German + Russian translations
- **[#23]** Channel/OTA sync
