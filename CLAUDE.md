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

### Vehicle types (`src/lib/vehicles.ts`)
The fleet holds cars, motorbikes and bicycles in one `cars` table, keyed by `vehicle_type`.
Categories are validated per type by a DB constraint (car: economy/suv/luxury; motorbike:
scooter/motorcycle/touring; bicycle: city/mountain/electric/road). `specsFor()` returns only the
specs that apply, so a bicycle shows frame size and gears rather than seats and transmission.
`requires_license = false` (bicycles) removes the licence field, the minimum age check and the
young-driver surcharge. Addons carry an optional `vehicle_type` so helmets only appear on bikes.
EV is a `fuel_type` variant (`'electric'`), not a separate `vehicle_type`/category — cars and
motorbikes get three optional spec columns (`ev_range_km`, `ev_charging_connector`,
`ev_charging_time_hours`, `supabase/migrations/007_ev_specs.sql`) shown in `CarForm` only when
fuel type is Electric and rendered by `specsFor()` alongside the other specs. A future
per-rental EV charging fee is better modeled as an `Addon` (already `vehicle_type`-scoped) than
a `pricing.ts` special case — not built.

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

**Bookings** (`/admin/bookings/[id]`): full detail view — guest info, vehicle, dates, extras, price breakdown, timeline. Left column includes a **condition report** panel (pickup/return photo capture, staff-raised damage claims citing specific photos — see below). Right sidebar: change booking status, payment status, KM at pickup/return, fuel level at pickup/return, deposit payment method, internal notes. Buttons at top generate PDF contract in ES or EN.

**Condition reports** (`ConditionReportPanel`, mounted on the booking detail page): captures photos at pickup and return into a **private** `condition-photos` Storage bucket — unlike `car-images`, never public; every read goes through `createSignedUrl()` at request time (10 min TTL), never a stored public URL. Staff can select photos and raise a **damage claim** (description, amount, cited photo IDs, status open/resolved/waived) via `booking_damage_claims`. A claim is a record for staff to act on at the counter — it does **not** charge or refund anything automatically, because the Stripe Checkout Session used for payment runs with no `customer`/`setup_future_usage`, so there is no saved card to charge off-session. The security deposit stays what it already was: a counter-side operation in `payment_method_deposit`. Not built (deliberately, separate follow-up): marked-diagram damage overlay (the printed PDF contract already covers this on paper) and digital signature capture.

**Licence verification** (`LicencePanel`, right sidebar of the booking detail page, hidden when `car.requires_license === false`): front/back photo capture into a **private** `licence-documents` Storage bucket — a separate bucket/table from condition photos on purpose, since a licence scan is an identity document with a different retention profile than vehicle-damage evidence. Same signed-URL pattern (10 min TTL, no stored public URL). Capture happens at the counter (staff-operated), not during online checkout — adding a file-upload step to the booking wizard was judged a conversion risk for what is fundamentally a staff check. Verification (`bookings.licence_verified_at`/`licence_verified_by`/`licence_rejection_reason`) lives on `bookings`, not the photo rows, since it's a fact about the driver after a visual check, not something an individual photo carries. Uploading a replacement resets verification. Automated scanning/face-match is a paid third-party integration and out of scope; no automatic retention/deletion cron exists yet, so removing old licence scans is manual.

**Cars** (`/admin/cars`): list with image, price, status (including the derived vehicle-status badge — see fleet maintenance below). Add/edit at `/admin/cars/new` and `/admin/cars/[id]`. CarForm covers all fields + pricing + discount tiers + photo upload + maintenance blocks (edit mode only) + Home Branch (`home_location_id` — leave as "Any location" unless the operator runs multiple branches). Photos managed via `CarImageUploader` — drag/drop, set cover, delete.

**Per-branch fleet**: `cars.home_location_id` is nullable and NULL means "available at every location," not "unset." The public fleet listing (`/cars?location=`) filters with `home_location_id.is.null OR home_location_id.eq.<requested>`, so an unconfigured (single-branch) deployment shows its whole fleet regardless of the location param. One-way rentals (different pickup/dropoff location) already worked before this — `bookings.pickup_location_id`/`dropoff_location_id` are independent and `lib/pricing.ts` sums both `extra_fee`s. **Not built**: tracking where a car currently sits after a one-way rental — deliberately not a stored column (same drift risk avoided in `lib/vehicle-status.ts`); would need to be derived from the most recent booking's dropoff location.

**Addons** (`/admin/addons`): list + full create/edit/delete at `/admin/addons/new` and `/admin/addons/[id]` via `AddonForm`. Delete is blocked (409) if the addon is linked to specific cars through `car_addons` — deactivate instead; a `booking_addons` reference never blocks it, since that table snapshots name/price at booking time. Per-car addon assignment (the `car_addons` join for non-global addons) has no UI yet.

**Locations** (`/admin/locations`): list + full create/edit/delete at `/admin/locations/new` and `/admin/locations/[id]` via `LocationForm`. Delete relies on the existing FK constraint on `bookings.pickup_location_id`/`dropoff_location_id` (no `ON DELETE` clause) — the API catches the `23503` violation and returns "used by existing bookings, deactivate instead."

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

**WhatsApp & SMS**: `lib/twilio/send.ts` mirrors the email module exactly — `enqueueMessage({channel: 'whatsapp' | 'sms', ...})` writes to the same `notifications_queue` (`type` column already allowed both), `processMessageQueue()` sends via Twilio's REST API (plain `fetch`, no SDK) with 3 attempts, `flushMessageQueueInBackground()` sends immediately. Plain-text templates in `lib/twilio/templates.ts` (short, unlike email's HTML — SMS is length/cost sensitive). Credentials (`twilio_account_sid`, `twilio_auth_token`) and sender numbers (`twilio_whatsapp_from`, `twilio_sms_from`) are admin-managed settings from Settings → Integrations, same pattern as Resend/Stripe. Two independent gates before a message sends: the channel must be connected (`whatsapp_enabled`/`sms_enabled` in Integrations) **and** the specific notification must be turned on (`notify_whatsapp_enabled`/`notify_sms_enabled` in Notifications) — so "is WhatsApp connected at all" and "should booking-confirmation use it" are separate questions. The daily cron (`/api/cron/send-emails`) drains both the email and message queues in one call rather than getting its own Hobby-plan cron slot.

**OTA / channel manager feed**: `GET /api/ota/availability?start=&end=` — a public route (not under `/api/admin/*`) authenticated by its own bearer-token check (`ota_api_key`, compared with Node's `timingSafeEqual`) rather than `requireAdmin()`, since a channel manager has no admin session. `lib/ota/availability.ts` builds the per-car, per-day availability+rate response from `getConflictingBookings()` over the whole range in one call — backed by the same `get_car_availability()` RPC used everywhere else, so `maintenance_blocks` is respected automatically. No specific provider (Booking.com Connectivity, SiteMinder, etc.) is wired in — `ota_provider`/`ota_api_key`/`ota_property_id`/`ota_enabled` are admin-managed settings, same pattern as every other integration; the operator sets their own bearer token and hands the same value to whichever channel manager they connect. **One-way only** — publishes availability out, does not import bookings from an OTA.

**Payments** (`lib/payments/stripe.ts`): Stripe Checkout for the booking payment. The client is
built per request from `getSecret('stripe_secret_key')` — never at module scope from env, since
the key is admin-managed. `deposit_percentage` decides whether checkout takes the full total or a
part-payment (`payment_status` becomes `paid` vs `deposit_paid`). The **security deposit is not
charged online** — it stays a counter operation in `payment_method_deposit`. The webhook at
`/api/payments/webhook` is public: its auth is Stripe's signature over the **raw** body
(`req.text()`, never `req.json()`), and it is idempotent on the unpaid→paid transition so retries
do not resend email. **A paid booking must never be swept by hold expiry** — the SQL guards on
`payment_status = 'unpaid'` and the webhook also clears `hold_expires_at`.

**Settings rule**: When adding any new feature that has a configurable value (fee, toggle, text, limit), add it as a row in the `settings` table and wire it to the appropriate settings sub-page. Run a new migration `00X_...sql` for any new keys.

Setting keys as of the initial P0–P2 build (not exhaustive — later migrations, including 005, add more; check `settings` directly for the full list): `social_proof_rating`, `social_proof_count`, `hero_headline_en`, `hero_headline_es`, `company_name`, `company_phone`, `company_email`, `company_address`, `company_website`, `google_maps_url`, `currency`, `min_driver_age`, `min_license_years`, `young_driver_surcharge_per_day`, `second_driver_fee`, `deposit_percentage`, `tax_rate`, `after_hours_fee`, `office_hours_open`, `office_hours_close`, `min_advance_hours`, `max_booking_days_ahead`, `cancellation_policy_en`, `cancellation_policy_es`, `terms_last_updated`, `notify_admin_email`, `notify_new_booking`, `notify_booking_confirm`, `notify_whatsapp_enabled`, `notify_sms_enabled`, `smtp_from_name`, `smtp_from_email`, `social_facebook`, `social_instagram`, `social_tiktok`, `social_whatsapp`, `resend_api_key`, `email_from_address`, `email_enabled`, `stripe_secret_key`, `stripe_publishable_key`, `stripe_webhook_secret`, `payments_enabled`, `twilio_account_sid`, `twilio_auth_token`, `twilio_whatsapp_from`, `twilio_sms_from`, `whatsapp_enabled`, `sms_enabled`

### Database Schema (Supabase)
Key tables: `cars`, `car_images`, `price_lists`, `price_list_discounts`, `addons`, `car_addons`, `locations`, `bookings`, `booking_addons`, `profiles`, `settings`, `notifications_queue`, `translations`, `blog_posts`, `faqs`, `testimonials`, `maintenance_blocks`

Migrations live in `supabase/migrations/`:
- `001_schema.sql` — the entire base schema in one file: all tables, RLS policies, triggers, functions and storage buckets as of 2026-08-08. Consolidated from what were previously 13 incremental migrations (initial schema; blog/FAQ; settings expansion; car-images storage; contract fields — license plate, NIE/passport, KM/fuel readings, deposit method; testimonials; `get_car_availability()` + the `bookings_no_overlap` exclusion constraint; booking holds + `expire_stale_booking_holds()`; `settings.is_secret` + Resend/Stripe credential rows; notification queue retry tracking; vehicle types — car/motorbike/bicycle, per-type categories/specs, hourly rates, per-type addons; Stripe payment columns + the paid-booking guard on hold expiry; condition-report photos and damage claims + the private `condition-photos` bucket).
- `002_maintenance_blocks.sql` — `maintenance_blocks` table + redefines `get_car_availability()` to union blocks with bookings.
- `003_licence_documents.sql` — `booking_licence_documents` table + private `licence-documents` bucket + `bookings.licence_verified_*` columns.
- `004_car_home_location.sql` — `cars.home_location_id`, nullable, NULL = available everywhere (never "excluded").
- `005_twilio_settings.sql` — Twilio credential/sender/toggle settings rows for WhatsApp + SMS.
- `006_ota_settings.sql` — OTA/channel-manager settings rows (`ota_provider`, `ota_api_key`, `ota_property_id`, `ota_enabled`).
- `demo_seed.sql` — **optional**, demo-only fleet/photos/bookings. Skip for real deployments.

Run `001_schema.sql` then any later-numbered files, in order, against a fresh Supabase project. When adding new schema going forward, start a new incrementally-numbered file rather than editing `001_schema.sql` in place — that file is a fresh-install snapshot, and `002` establishes the pattern for what comes after it.

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
- Handover condition reports: pickup/return photo capture (private Storage bucket, signed URLs), staff-raised damage claims citing specific photos — see `ConditionReportPanel` on the admin booking detail page
- Customer account area (`/account`): profile edit (writes directly via RLS, no API route needed), sign out, and bookings placed while signed in — guest bookings aren't linked, page points to `/my-booking` instead
- Business reporting (`/admin/reports`, `src/lib/reporting.ts`): net revenue, fleet utilization, RevPAV, achieved ADR, cancellation rate (customer-cancelled vs expired-hold, kept separate), addon attach rate, revenue by month, utilization by category — pure functions over existing `bookings`/`cars` data, no new tables
- Fleet maintenance blocks: `maintenance_blocks` table (separate from `bookings` — see `supabase/migrations/002_maintenance_blocks.sql`), `get_car_availability()` unions blocks with bookings so all existing availability call sites pick it up automatically. Derived (not stored) vehicle status — `src/lib/vehicle-status.ts` — shown on `/admin/cars`; managed via `MaintenancePanel` on the car edit page

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
