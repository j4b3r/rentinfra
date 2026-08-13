# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two audiences, roughly equal weight:

- **Small/independent rental operators** — car, motorbike, or bicycle rental businesses
  (often single-location) evaluating RentInfra to run real bookings and payments without
  building or buying a bespoke system. May fork and deploy it themselves or hand it to
  someone else to stand up.
- **Developers/agencies building for a client** — freelancers or small agencies who fork,
  deploy, and customize RentInfra as the technical stack behind a rental business's public
  site and admin panel, then hand off or maintain it for that client.

Both groups touch the same repo and docs (README, DEPLOY.md, CLAUDE.md); the operator cares
about running the business day-to-day (bookings, fleet, payments, contracts), the
developer/agency cares about forking, deploying, and configuring it correctly.

## Product Purpose

RentInfra is an open-source, MIT-licensed vehicle rental SaaS boilerplate — public booking
site plus admin panel — meant to be forked, deployed, and rebranded into a real, operating
rental business, not evaluated as a demo or portfolio piece. Success is a fork that goes live
and actually takes paid bookings for real vehicles.

## Positioning

Actually runs a rental business, not just a demo. Most open-source booking-form boilerplates
stop at "customer picks dates and submits a form." RentInfra ships the parts that make that
booking real and operational: real Stripe payments (with 3D Secure), a database-level
availability system that is structurally impossible to double-book, e-signature capture and
licence verification at handover, condition-report photos and damage claims, fleet
maintenance scheduling, PDF rental contracts, and WhatsApp/SMS/email notifications. A
competing boilerplate that only has a booking form and a database table cannot truthfully
claim the same.

## Operating Context

- Public site: search by dates/location → filtered fleet (cars, motorbikes, bicycles,
  including EVs) → car detail → 4-step booking wizard (Dates, Extras, Details, Review) →
  Stripe Checkout → confirmation with a `RIF-YYYY-NNNNN` reference → guest lookup by
  reference + email.
- Admin panel: bookings (detail view with condition report, e-signatures, licence
  verification, PDF contract generation), fleet (with maintenance blocks and per-branch home
  location), addons, users, locations, testimonials, business reporting, and settings
  (company info, rental rules, office hours, booking policy, notifications, social media,
  integrations).
- Deployment: fork on GitHub → deploy to Vercel (one-click Marketplace path provisions
  Supabase automatically, or manual Supabase + env var setup) → run numbered SQL migrations
  → register an account → flip `profiles.is_admin` → optionally connect Resend/Stripe/Twilio
  in Settings → Integrations. Everything (payments, email, WhatsApp/SMS) stays inert until
  its own credentials are configured — a fresh deploy is usable with zero integrations
  configured beyond Supabase.
- Multi-language: EN/ES shipped via next-intl; DE/RU are an open roadmap item.
- Live demo (`demo.rentinfra.infranomad.com`) is public, shared, and periodically reset —
  not representative of a real operator's data.

## Capabilities and Constraints

- Vehicle types: cars, motorbikes, bicycles in one fleet table, each showing only the specs
  that apply (bicycles skip licence/seats/transmission fields entirely). EV is a fuel-type
  variant, not a separate vehicle type.
- Availability is enforced at three layers (UI, API, DB exclusion constraint) so double-
  booking is structurally impossible, not just checked in application code.
- Security deposit is a counter-side operation (`payment_method_deposit`), never charged
  online — no saved card exists to charge off-session.
- Per-branch fleet and one-way rentals are supported; tracking where a car currently sits
  after a one-way rental is not (deliberately not stored — would need to be derived).
- Outbound OTA/channel-manager feed exists (publishes availability out); inbound OTA booking
  ingestion does not.
- Genuinely open roadmap items (see ROADMAP.md): German + Russian translations, rate
  management (day-of-week rates, blackout dates, per-location pricing), inbound OTA booking
  ingestion, deposit pre-authorization/release, inter-branch transfer tracking.
- Secrets (`stripe_secret_key`, `resend_api_key`, Twilio credentials) live in the `settings`
  table with `is_secret = TRUE` and are only ever read server-side via `getSecret()` — never
  returned to the client. This is a hard architectural rule a fork must not violate.

## Brand Commitments

No protected brand identity — RentInfra ships **placeholder branding meant to be replaced by
whoever forks it**, not a permanent look to preserve. Confirmed as of this init:

- Navy (`#0A1F44`) / Gold (`#C9A84C`) color system, Inter (body/UI) + Playfair Display
  (hero/display) fonts, and the "RentInfra" name are the current placeholder identity,
  documented in CLAUDE.md's UI Design System section.
- No real logo, wordmark, or custom favicon exists — `public/` only has the Next.js
  scaffold's default SVGs (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`)
  and `src/app/favicon.ico` is the default Next.js favicon, not a designed asset.
- A fork is expected to swap name, palette, fonts, and add its own logo/favicon before going
  live as a real business's site. Future design work should not treat navy/gold/Inter/
  Playfair as sacred — it's a reasonable, coherent starting point, not a locked identity.

## Evidence on Hand

- Live demo at `demo.rentinfra.infranomad.com` with seeded fake fleet/bookings
  (`supabase/migrations/demo_seed.sql`) — real screenshots/flows can be captured there, but
  the data itself (testimonials, bookings, fleet) is fictional and must not be treated as
  real customer evidence in marketing copy.
- No real customer testimonials, press, case studies, or benchmark numbers exist. The
  testimonials feature is built to display real ones an operator enters after deploying —
  the homepage section hides entirely when none exist rather than inventing social proof.
  Future design/copy work must not fabricate testimonials, ratings, or customer counts.

## Product Principles

1. **Real infrastructure over demo-ware.** Every feature should make a fork closer to taking
   a real paid booking, not just look complete — payments, availability integrity, contracts,
   and identity verification are treated as required, not optional polish.
2. **Inert until configured, never fake.** Integrations (payments, email, WhatsApp/SMS, OTA)
   default off and stay silently inert without credentials rather than mocking success —
   a forker should never be misled about what's actually connected.
3. **Placeholder identity, not a locked brand.** The current navy/gold look and "RentInfra"
   name exist to be replaced; design and copy decisions should keep the fork path cheap
   rather than deepen investment in a throwaway identity.
4. **One source of truth per concern.** Availability, pricing, secrets, and n8n-style version
   lists (where applicable) each resolve through a single shared module so surfaces can't
   disagree — a pattern this codebase already enforces and future work should not break.
5. **No invented content.** Social proof, testimonials, and business data render only when
   real data exists; empty states are the honest default, not filled with placeholder claims.

## Accessibility & Inclusion

No product-specific accessibility requirement has been confirmed beyond standard web
practice; not yet established as a binding standard (e.g. WCAG level) for this project.
