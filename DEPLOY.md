# Deploying RentInfra

A complete, start-to-finish guide to running RentInfra on **Vercel** with a **Supabase** backend.

Estimated time: ~20 minutes.

- [Try the live demo first](#try-the-live-demo-first)
- [1. Prerequisites](#1-prerequisites)
- [2. Create a Supabase project](#2-create-a-supabase-project)
- [3. Run the database migrations](#3-run-the-database-migrations)
- [4. Collect your environment variables](#4-collect-your-environment-variables)
- [5. Deploy to Vercel](#5-deploy-to-vercel)
- [6. Configure Supabase Auth (required)](#6-configure-supabase-auth-required)
- [7. Create your admin user](#7-create-your-admin-user)
- [8. Custom domain](#8-custom-domain)
- [9. Post-deploy checklist](#9-post-deploy-checklist)
- [Troubleshooting](#troubleshooting)

---

## Try the live demo first

Before deploying your own, you can explore a fully working instance — public site and admin panel — at **[rentinfra.vercel.app](https://rentinfra.vercel.app)**.

Sign in at [`/auth/login`](https://rentinfra.vercel.app/auth/login) with either account:

| Role | Email | Password | What you can see |
|------|-------|----------|------------------|
| **Admin** | `admin@rentinfra.demo` | `RentInfraDemo2026!` | The full admin panel at `/admin` — bookings, cars, addons, users, locations, settings, and PDF rental contracts |
| **Customer** | `user@rentinfra.demo` | `RentInfraDemo2026!` | The customer view — profile and booking history |

You can also browse the public site, complete the booking wizard, and look up a booking at `/my-booking` without signing in at all.

> ⚠️ **The demo is public and shared.** Its database is open to everyone and periodically reset — anything you change may be wiped or altered by other visitors. **Do not enter real personal data.** The fleet and bookings are fake, seeded by the optional `supabase/migrations/006_demo_seed.sql` (skip that file in a real deployment — see [step 3](#3-run-the-database-migrations)).

These credentials exist **only on the demo deployment**. Your own instance starts with no users at all — you register normally and then promote yourself to admin, as described in [step 7](#7-create-your-admin-user).

---

## 1. Prerequisites

- A [GitHub](https://github.com) account (to fork this repo)
- A [Supabase](https://supabase.com) account — the free tier is enough
- A [Vercel](https://vercel.com) account — the free Hobby tier is enough
- Node.js 20+ if you want to run it locally first

Fork or clone the repo:

```bash
git clone https://github.com/j4b3r/rentinfra.git
cd rentinfra
npm install
```

---

## 2. Create a Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
2. Pick an organization, give it a name (e.g. `my-car-rental`), and choose a **region close to your customers** — this is the single biggest factor in how fast your site feels.
3. Set a strong database password and **save it somewhere safe**. You will not be shown it again, and you need it for direct database access.
4. Wait until the project status is **Active / Healthy** (usually 1–2 minutes). Migrations will fail against a project that is still provisioning.

---

## 3. Run the database migrations

The SQL files in `supabase/migrations/` create every table, row-level security policy, trigger and the storage bucket. **Run them in numerical order** — later files depend on earlier ones.

### Option A — Supabase SQL Editor (simplest)

For each file `001` → `005` and then `007` → `009`, in order:

1. Open your project → **SQL Editor** → **New query**.
2. Paste the entire contents of the file.
3. Click **Run**. Confirm it reports success before moving to the next file.

| File | What it creates |
|------|-----------------|
| `001_initial_schema.sql` | All core tables (cars, bookings, price lists, addons, locations, profiles, settings…), RLS policies, the `is_admin()` function, the `handle_new_user()` signup trigger, booking-reference trigger, and baseline seed data (3 cars, 3 locations, 5 addons, settings) |
| `002_blog_faq.sql` | `blog_posts` and `faqs` tables + seed content |
| `003_settings_expansion.sql` | Additional settings keys |
| `004_car_images_storage.sql` | The public `car-images` storage bucket + its RLS policies |
| `005_booking_contract_fields.sql` | Rental-contract fields (license plate, NIE/passport, KM and fuel readings, deposit method) |
| `007_testimonials.sql` | `testimonials` table + RLS, and the homepage social-proof settings keys |
| `008_availability.sql` | `get_car_availability()` so the public site can compute availability without read access to booking records, plus the exclusion constraint that makes double-booking impossible |
| `009_booking_holds.sql` | `hold_expires_at` + the job that releases cars held by unconfirmed bookings |

Run `007`, `008` and `009` as well — they are part of the base schema, not demo data. It ships with **no rows**, and the homepage hides the reviews section entirely until you publish one from `/admin/testimonials`.

`006_demo_seed.sql` is **optional and for the public demo only** — it inserts fake cars, photos and bookings. **Skip it** if you are setting up a real business. It is safe to re-run and safe to ignore.

### Option B — Supabase CLI

```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

> Note: the migration files use plain `001_…`-style names rather than the CLI's timestamp convention, so the SQL Editor route (Option A) is the more predictable one.

### Verify

Go to **Table Editor**. You should see 15 tables including `cars`, `bookings` and `settings`, and `cars` should already contain 3 rows.

---

## 4. Collect your environment variables

RentInfra needs exactly four variables.

In your Supabase project, go to **Project Settings → API Keys**:

| Variable | Where it comes from | Public? |
|----------|--------------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → Data API → **Project URL** (`https://<ref>.supabase.co`) | Yes — visible in the browser |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API Keys → **anon / public** | Yes — safe to expose, RLS protects your data |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API Keys → **service_role** | **NO — secret** |
| `NEXT_PUBLIC_SITE_URL` | Your final public URL, e.g. `https://your-domain.com` | Yes |

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
- [ ] The PDF rental contract downloads in both EN and ES
- [ ] `/sitemap.xml` and `/robots.txt` return 200

### Make it yours

Before taking real bookings, replace the placeholder content:

- **Settings** — company name, phone, email, address, tax rate, deposit %, rental rules, and social links are all editable at `/admin/settings`. Nothing there is hardcoded.
- **Branding** — swap `public/logo.*`; look for `TODO` comments marking each spot.
- **Copy and SEO** — `messages/en.json`, `messages/es.json`, and the `generateMetadata()` exports under `src/app/(public)/**`.
- **Legal** — `/terms` and `/privacy`, plus the jurisdiction and territory clauses in `src/lib/pdf/RentalContract.tsx`. **Have a lawyer review these for your market.**

### Not included

RentInfra ships without payment processing or transactional email. Bookings are recorded, but nothing is charged and no email is sent. Wiring up Stripe/PayPal and an SMTP or Resend sender is left to you.

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
Confirm `004_car_images_storage.sql` ran and that a public `car-images` bucket exists under **Storage**. `next.config.ts` already allows `*.supabase.co`, so no change is needed there when you fork.

**Supabase free-tier project got paused**
Free projects pause after a week of inactivity. Restore it from the dashboard, or upgrade for anything customer-facing.

**Build fails on Vercel but works locally**
Run `npm run build` locally against a clean install (`rm -rf .next node_modules && npm install`). Also confirm all four env vars exist for the **Production** environment, not just Development.
