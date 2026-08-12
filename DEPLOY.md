# Deploying RentInfra

A complete, start-to-finish guide to running RentInfra on **Vercel** with a **Supabase** backend.

Estimated time: ~20 minutes.

- [Try the live demo first](#try-the-live-demo-first)
- [Fast path: Vercel Marketplace](#fast-path-vercel-marketplace)
- [1. Prerequisites (manual path)](#1-prerequisites-manual-path)
- [2. Create a Supabase project](#2-create-a-supabase-project)
- [3. Run the database migrations](#3-run-the-database-migrations)
- [4. Collect your environment variables](#4-collect-your-environment-variables)
- [5. Deploy to Vercel](#5-deploy-to-vercel)
- [5b. Connect email and payments (optional)](#5b-connect-email-and-payments-optional)
- [6. Configure Supabase Auth (required)](#6-configure-supabase-auth-required)
- [7. Create your admin user](#7-create-your-admin-user)
- [8. Custom domain](#8-custom-domain)
- [9. Post-deploy checklist](#9-post-deploy-checklist)
- [10. Tests and CI (if you forked the repo)](#10-tests-and-ci-if-you-forked-the-repo)
- [Troubleshooting](#troubleshooting)

---

## Try the live demo first

Before deploying your own, you can explore a fully working instance — public site and admin panel — at **[demo.rentinfra.infranomad.com](https://demo.rentinfra.infranomad.com)**.

Sign in at [`/auth/login`](https://demo.rentinfra.infranomad.com/auth/login) with either account:

| Role | Email | Password | What you can see |
|------|-------|----------|------------------|
| **Admin** | `admin@rentinfra.demo` | `RentInfraDemo2026!` | The full admin panel at `/admin` — bookings, cars, addons, users, locations, settings, and PDF rental contracts |
| **Customer** | `user@rentinfra.demo` | `RentInfraDemo2026!` | The customer view — profile and booking history |

You can also browse the public site, complete the booking wizard, and look up a booking at `/my-booking` without signing in at all.

> ⚠️ **The demo is public and shared.** Its database is open to everyone and periodically reset — anything you change may be wiped or altered by other visitors. **Do not enter real personal data.** The fleet and bookings are fake, seeded by the optional `supabase/migrations/demo_seed.sql` (skip that file in a real deployment — see [step 3](#3-run-the-database-migrations)).

These credentials exist **only on the demo deployment**. Your own instance starts with no users at all — you register normally and then promote yourself to admin, as described in [step 7](#7-create-your-admin-user).

---

## Fast path: Vercel Marketplace

If you're deploying on Vercel, this is the shortest route to a running instance — Vercel
provisions the Supabase project for you and wires the environment variables into your project
automatically. It skips manual Supabase account creation and manual env var copying, but two
things still need a minute of manual setup afterward (Supabase Auth URLs, and promoting your
first admin) — see below for why those can't be automated away.

1. Fork the repo on GitHub, then link it as a new Vercel project:
   ```bash
   npm i -g vercel@latest
   git clone https://github.com/<you>/rentinfra.git
   cd rentinfra
   vercel link
   ```
2. Provision Supabase through the Marketplace — this creates a Supabase project and injects its
   URL/keys as environment variables on your linked Vercel project, no copy-pasting:
   ```bash
   vercel integration add supabase
   ```
   Confirm it worked and check the exact variable names: `vercel env ls`. This app reads
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (falling back to
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` if the anon key isn't present under that name), and
   `SUPABASE_SERVICE_ROLE_KEY` (falling back to `SUPABASE_SECRET_KEY`) — see
   `src/lib/supabase/env.ts`. The Marketplace integration has changed its injected names before
   and may again, so if `vercel env ls` shows something that matches none of those, add an
   explicit alias: `vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production` (paste the value
   from whichever var the integration actually injected). Also confirm a `POSTGRES_URL_NON_POOLING`
   is present — step 4 below needs it.
3. Set `NEXT_PUBLIC_SITE_URL` and `CRON_SECRET` too — the Marketplace integration only knows
   about Supabase, not the rest of the app's env vars:
   ```bash
   vercel env add NEXT_PUBLIC_SITE_URL production   # your vercel.app URL for now
   vercel env add CRON_SECRET production             # any random string, e.g. `openssl rand -hex 24`
   ```
4. **For the first deploy only**, override the Build Command so the fresh, schema-empty Supabase
   project gets `supabase/migrations/*.sql` applied before the app builds: Vercel → your project
   → **Settings → Build & Development → Build Command** → set to
   ```
   npm run db:migrate && npm run build
   ```
   Deploy (`vercel --prod`, or push to trigger one), and check the build log for
   `[migrate] done` with each file listed as applied.
5. **Put the Build Command back to `next build`** (or delete the override) once that first
   deploy succeeds. `db:migrate` is idempotent and safe to leave in place, but there's no reason
   to open a database connection on every routine push once the schema exists — see
   `scripts/migrate.ts` for what it does if you ever want to re-run it by hand instead
   (`npm run db:migrate` locally, pointed at `POSTGRES_URL_NON_POOLING` from `vercel env pull`).
6. Finish the two steps that can't be automated, because the Vercel-assigned URL doesn't exist
   until step 4 deploys, and admin promotion is deliberately not exposed as an API a fork could
   leave unguarded: [step 6, Configure Supabase Auth](#6-configure-supabase-auth-required) and
   [step 7, Create your admin user](#7-create-your-admin-user).

From here, skip straight to [step 8, Custom domain](#8-custom-domain) — steps 1–5 below describe
the manual path (a separate Supabase account, useful if you want to manage Supabase directly, or
you're not deploying on Vercel at all) and don't need repeating.

---

## 1. Prerequisites (manual path)

- A [GitHub](https://github.com) account (to fork this repo)
- A [Supabase](https://supabase.com) account — the free tier is enough
- A [Vercel](https://vercel.com) account — the free Hobby tier is enough
- Node.js 22+ if you want to run it locally first (matches what CI uses — see `.github/workflows/ci.yml`)

Fork or clone the repo:

```bash
git clone https://github.com/j4b3r/rentinfra.git
cd rentinfra
npm install
```

> Already used the [fast path](#fast-path-vercel-marketplace) above? Skip to
> [step 8, Custom domain](#8-custom-domain) — everything below is the manual alternative.

---

## 2. Create a Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
2. Pick an organization, give it a name (e.g. `my-car-rental`), and choose a **region close to your customers** — this is the single biggest factor in how fast your site feels.
3. Set a strong database password and **save it somewhere safe**. You will not be shown it again, and you need it for direct database access.
4. Wait until the project status is **Active / Healthy** (usually 1–2 minutes). Migrations will fail against a project that is still provisioning.

---

## 3. Run the database migrations

The SQL files in `supabase/migrations/` create every table, row-level security policy, trigger and the storage bucket.

### Option A — Supabase SQL Editor (simplest)

For each file in `supabase/migrations/` in numeric order:

1. Open your project → **SQL Editor** → **New query**.
2. Paste the entire contents of the file.
3. Click **Run**. Confirm it reports success before moving to the next file.

| File | Adds |
|------|------|
| `001_schema.sql` | The base schema — every table, RLS policy, trigger, function and storage bucket, consolidated into one file. Ships with **no rows** other than baseline seed data (3 cars, 3 locations, 5 addons, default settings); the homepage hides the reviews section entirely until you publish a testimonial from `/admin/testimonials`. |
| `002_maintenance_blocks.sql` | Fleet maintenance blocks (`maintenance_blocks` table), unioned into availability checks. |
| `003_licence_documents.sql` | Driver licence capture — `booking_licence_documents` table + private `licence-documents` bucket. |
| `004_car_home_location.sql` | Per-branch fleet — `cars.home_location_id`. |
| `005_twilio_settings.sql` | WhatsApp/SMS credential settings rows (Twilio). |
| `006_ota_settings.sql` | Channel-manager/OTA feed credential settings rows. |
| `007_ev_specs.sql` | EV spec columns on `cars` (range, charging connector, charging time). |
| `008_booking_signatures.sql` | E-signature capture — `booking_signatures` table + private `signatures` bucket. |

Run them all, in order — each one builds on the last.

`demo_seed.sql` is **optional and for the public demo only** — it inserts fake cars, photos and bookings on top of the schema. **Skip it** if you are setting up a real business. It is safe to re-run and safe to ignore.

### Option B — Supabase CLI

```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

> Note: the migration file uses a plain `001_…`-style name rather than the CLI's timestamp convention, so the SQL Editor route (Option A) is the more predictable one.

### Verify

Go to **Table Editor**. You should see the full set of tables including `cars`, `bookings` and `settings`, and `cars` should already contain 3 rows.

---

## 4. Collect your environment variables

RentInfra needs four required variables, plus one strongly recommended secret for the two scheduled jobs.

In your Supabase project, go to **Project Settings → API Keys**:

| Variable | Where it comes from | Public? |
|----------|--------------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → Data API → **Project URL** (`https://<ref>.supabase.co`) | Yes — visible in the browser |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API Keys → **anon / public** | Yes — safe to expose, RLS protects your data |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API Keys → **service_role** | **NO — secret** |
| `NEXT_PUBLIC_SITE_URL` | Your final public URL, e.g. `https://your-domain.com` | Yes |
| `CRON_SECRET` | Any random string, e.g. `openssl rand -hex 24`. Recommended — it stops anyone from triggering the two scheduled jobs (`/api/cron/expire-holds`, `/api/cron/send-emails`, both defined in `vercel.json`) by hitting the URL directly. Vercel sends it automatically for real cron runs. | **NO — secret** |

> ⚠️ **The `service_role` key bypasses all row-level security.** Never commit it, never put it in a `NEXT_PUBLIC_*` variable, and never expose it to the browser. It is used only in server-side code (`src/lib/supabase/server.ts`).

### Local development

```bash
cp .env.example .env.local
```

Fill in the four values, using `NEXT_PUBLIC_SITE_URL=http://localhost:3000`, then:

```bash
npm run dev
```

`.env.local` is gitignored and will never be committed.

---

## 5. Deploy to Vercel

### Option A — One-click

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/j4b3r/rentinfra&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,NEXT_PUBLIC_SITE_URL&envDescription=Supabase%20credentials%20and%20your%20public%20site%20URL&envLink=https://github.com/j4b3r/rentinfra/blob/main/DEPLOY.md%234-collect-your-environment-variables)

Vercel will clone the repo and prompt for the four variables during import.

### Option B — Import from GitHub

1. [vercel.com/new](https://vercel.com/new) → **Import** your fork.
2. Framework preset is detected automatically as **Next.js**. Leave the build settings alone.
3. Expand **Environment Variables** and add all four. Apply each to **Production**, **Preview**, and **Development**.
4. Click **Deploy**.

> For `NEXT_PUBLIC_SITE_URL` on the very first deploy you may not know your URL yet. Use the `*.vercel.app` URL Vercel assigns, then update it once your custom domain is live (step 8) and redeploy.

### Option C — Vercel CLI

```bash
npm i -g vercel@latest
vercel link

# Add each variable (repeat for preview / development)
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add NEXT_PUBLIC_SITE_URL production

vercel --prod
```

> `NEXT_PUBLIC_*` variables are inlined into the JavaScript bundle **at build time**. Changing one requires a **redeploy** to take effect — editing it in the dashboard alone does nothing to the already-built site.

### Deployment protection

New Vercel projects may enable **Deployment Protection**, which puts every URL behind a Vercel login — visitors get redirected to an SSO page instead of your site. If your deployment returns a `302` to `vercel.com/sso-api`, turn it off under **Project → Settings → Deployment Protection → Vercel Authentication → Disabled**.

---

## 5b. Connect email and payments (optional)

RentInfra keeps third-party credentials in the database, not in environment variables, so you
manage them from **Admin → Settings → Integrations** after deploying. Nothing here is required
to take bookings — without it, bookings are recorded but no email is sent and no payment is
collected.

**Email (Resend)**

1. Create an account at [resend.com](https://resend.com) and verify the domain you want to send from.
2. Create an API key under **API Keys**.
3. In RentInfra, go to **Settings → Integrations**, paste the key, set **Send from** to an
   address on your verified domain, and press **Test connection**.
4. Once the test passes, tick **Enable email** and save.

Customers then receive a booking receipt and a confirmation when you confirm the booking, and
you get an alert at `notify_admin_email` for each new booking.

**Payments (Stripe)**

1. In the [Stripe dashboard](https://dashboard.stripe.com/apikeys), copy your **secret key**.
   Start with a test key (`sk_test_…`) — test mode moves no real money.
2. Add a webhook endpoint at **Developers → Webhooks** pointing to
   `https://your-domain.com/api/payments/webhook`, subscribed to
   `checkout.session.completed`, `checkout.session.expired` and `charge.refunded`.
   Copy its **signing secret** (`whsec_…`).
3. Paste both into **Settings → Integrations**, press **Test connection**, then tick
   **Enable payments**.

How much is charged is set by **`deposit_percentage`** in Settings → Rental Rules: `100` (or
`0`) takes the full amount at checkout, `20` takes a 20% deposit with the balance due at
pick-up. The **security deposit** is separate and stays a counter operation — it is recorded
against the booking at handover, not charged online.

Refunds are issued by staff from the booking detail page, full or partial. They are deliberately
not automatic: the cancellation policy is free text, so only a human can decide what is owed.
A refund issued directly in the Stripe dashboard syncs back automatically.

> Bookings work perfectly well with payments switched off — they are simply recorded as unpaid
> and settled at the counter.

> Keys are stored with `is_secret` set, which hides them from every non-admin via row-level
> security. They are shown masked after saving and are never sent to the public site. Anyone
> with admin access to your panel can still replace them, so keep admin accounts limited.

---

## 6. Configure Supabase Auth (required)

Login, signup and email confirmation all break if this is skipped.

In Supabase → **Authentication → URL Configuration**:

- **Site URL** — your production URL, e.g. `https://your-domain.com`
- **Redirect URLs** — add both:
  - `https://your-domain.com/**`
  - `http://localhost:3000/**`

### Google OAuth (optional)

The login and register pages include a **Continue with Google** button. It will error until you enable the provider:

1. Create an OAuth client in the [Google Cloud Console](https://console.cloud.google.com/apis/credentials) (type: *Web application*).
2. Add `https://<your-project-ref>.supabase.co/auth/v1/callback` as an authorized redirect URI.
3. In Supabase → **Authentication → Providers → Google**, enable it and paste the client ID and secret.

If you would rather not offer Google sign-in, remove the button from `src/app/auth/login/page.tsx` and `src/app/auth/register/page.tsx`.

---

## 7. Create your admin user

The `/admin` panel is gated by middleware on `profiles.is_admin`. Every new signup gets `is_admin = false`, so you must promote your own account once, by hand.

1. Go to your deployed site and **register normally** at `/auth/register`.
2. In Supabase → **SQL Editor**, run:

```sql
update public.profiles
set is_admin = true
where id = (select id from auth.users where email = 'you@example.com');
```

3. Sign out and back in. `/admin` is now accessible.

> Repeat for each staff member who needs admin access. There is deliberately no way to grant admin from inside the UI.

---

## 8. Custom domain

1. Vercel → **Project → Settings → Domains → Add**, and enter your domain.
2. At your DNS provider, add the record Vercel shows you:
   - Apex (`example.com`) → `A` record to `76.76.21.21`
   - Subdomain (`www`) → `CNAME` to `cname.vercel-dns.com`
3. Wait for verification. TLS certificates are issued automatically.
4. **Update `NEXT_PUBLIC_SITE_URL`** to the new domain and **redeploy**.
5. **Update the Supabase Site URL and Redirect URLs** (step 6) to match, or auth will bounce users to the old URL.

---

## 9. Post-deploy checklist

- [ ] Home page loads and the fleet grid shows cars
- [ ] A car detail page opens and the booking wizard reaches the Review step
- [ ] Completing a booking returns a reference (`RIF-YYYY-NNNNN`)
- [ ] That reference plus the guest email works at `/my-booking`
- [ ] Register + login work; confirmation email arrives and its link points at your domain
- [ ] `/admin` redirects anonymous visitors to `/auth/login`
- [ ] `/admin` loads for your promoted admin account
- [ ] Uploading a car photo in the admin panel succeeds and displays on the public site
- [ ] The PDF rental contract downloads in both EN and ES, and shows a captured e-signature if you took one on the booking's detail page
- [ ] `/sitemap.xml` and `/robots.txt` return 200
- [ ] If you connected Stripe: a test-mode checkout completes and the booking's payment status updates via webhook
- [ ] If you forked the repo (not just deployed a clone): a push to your fork triggers `.github/workflows/ci.yml` (build, lint, test, audit) and shows up green under the **Actions** tab

### Make it yours

Before taking real bookings, replace the placeholder content:

- **Settings** — company name, phone, email, address, tax rate, deposit %, rental rules, and social links are all editable at `/admin/settings`. Nothing there is hardcoded.
- **Branding** — swap `public/logo.*`; look for `TODO` comments marking each spot.
- **Copy and SEO** — `messages/en.json`, `messages/es.json`, and the `generateMetadata()` exports under `src/app/(public)/**`.
- **Legal** — `/terms` and `/privacy`, plus the jurisdiction and territory clauses in `src/lib/pdf/RentalContract.tsx`. **Have a lawyer review these for your market.**

### Optional, off until you connect it

Bookings work with zero of this configured — they're simply recorded unpaid and no email/message goes out. Everything below is a real, shipped feature, admin-managed from **Settings → Integrations**, not something you need to build:

- **Payments** (Stripe Checkout, full or partial deposit) — see [step 5b](#5b-connect-email-and-payments-optional)
- **Email** (Resend — booking receipts, confirmations, admin alerts) — see [step 5b](#5b-connect-email-and-payments-optional)
- **WhatsApp / SMS** (Twilio) — same settings page, independent on/off switches per channel and per notification type
- **Channel-manager / OTA availability feed** — a bearer-token-authenticated outbound feed at `/api/ota/availability`, for connecting a booking aggregator (publishes availability only, does not import bookings)

See [ROADMAP.md](./ROADMAP.md) for what's genuinely **not built yet** — inbound OTA booking sync, deposit pre-authorization/release, and German/Russian translations are the main gaps.

---

## 10. Tests and CI (if you forked the repo)

Only relevant if you forked on GitHub rather than deploying a one-off clone — this doesn't affect
Vercel's own deploy in any way, it's a separate signal that runs alongside it.

- `npm test` runs the test suite locally (`npm run test:watch` for watch mode). See CLAUDE.md's
  Testing section for what's covered.
- `.github/workflows/ci.yml` runs build, lint, test, and a dependency audit
  (`npm audit --audit-level=critical`) on every push and pull request. It does **not** gate
  Vercel's auto-deploy from `main` — Vercel deploys regardless of whether this is green. It's a
  visible check on the commit/PR, nothing more, unless you turn on GitHub branch protection
  yourself.
- `.github/workflows/codeql.yml` runs a static security scan on push/PR to `main` plus weekly;
  results show up under the repo's **Security → Code scanning** tab.
- `.github/dependabot.yml` opens weekly PRs for outdated npm and GitHub Actions dependencies.
  `.github/workflows/dependabot-auto-merge.yml` auto-merges the ones that are patch/minor version
  bumps once CI passes; major version bumps are left open for you to review by hand.

None of this is required to deploy — it's there so a fork that keeps evolving has a way to catch
a regression before it ships, not a gate you have to satisfy to get your first deploy live.

---

## Troubleshooting

**Every URL redirects to a Vercel login page**
Deployment Protection is on. See the note at the end of [step 5](#deployment-protection).

**"Invalid API key" / "Failed to fetch" in the browser**
`NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` is wrong or missing. Because these are inlined at build time, fix the value **and redeploy**.

**Pages load but every list is empty**
The migrations did not run, or ran against a different project than the one your env vars point at. Check the Table Editor for rows in `cars`.

**Login succeeds but `/admin` bounces back to the site**
`profiles.is_admin` is still `false` for your account. See [step 7](#7-create-your-admin-user). Sign out and back in after changing it — the session carries the stale value until refreshed.

**Confirmation emails link to `localhost:3000`**
The Supabase **Site URL** is still the default. Fix it in [step 6](#6-configure-supabase-auth-required).

**Car images 404 or fail to load**
Confirm `001_schema.sql` ran and that a public `car-images` bucket exists under **Storage**. `next.config.ts` already allows `*.supabase.co`, so no change is needed there when you fork.

**Supabase free-tier project got paused**
Free projects pause after a week of inactivity. Restore it from the dashboard, or upgrade for anything customer-facing.

**Build fails on Vercel but works locally**
Run `npm run build` locally against a clean install (`rm -rf .next node_modules && npm install`). Also confirm all four env vars exist for the **Production** environment, not just Development.
