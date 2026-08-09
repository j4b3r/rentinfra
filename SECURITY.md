# Security Policy

## Reporting a vulnerability

If you find a security issue in RentInfra — an RLS gap, an auth bypass, a way to reach an
admin-only route without `requireAdmin()`, exposure of a secret, or anything else — please
**do not open a public GitHub issue**.

Instead, use GitHub's private **"Report a vulnerability"** flow on this repo (Security tab →
Advisories → Report a vulnerability), or email the maintainer directly if you don't have a
GitHub account. Include:

- What you found and where (file/route)
- Steps to reproduce
- What you think the impact is (data exposure, privilege escalation, etc.)

We'll acknowledge reports as quickly as we can and credit you in the fix, unless you'd rather
stay anonymous.

## Scope notes for this project

RentInfra is a boilerplate that real businesses fork and deploy with their own Supabase project,
Stripe account, and customer data. A few things worth knowing if you're auditing it:

- **Secrets** (Stripe, Resend, Twilio, OTA keys) live in the `settings` table with
  `is_secret = true` and are only ever read server-side via `getSecret()`/`getSecrets()`. If
  you find a path where a secret reaches a client component or an API response, that's a real
  finding.
- **Admin routes**: every route under `/api/admin/*` is expected to call `requireAdmin()` as its
  first statement. Middleware protects admin *pages*, not API routes — a route that skips the
  guard is exploitable directly, bypassing the page-level check entirely.
- **RLS**: enabled on all tables. `is_admin()` gates admin-only rows. If you find a table or
  policy that leaks data to an unauthenticated or non-admin session, that's in scope.
- **Private Storage buckets** (`condition-photos`, `licence-documents`) should never be reachable
  by a public URL — every read goes through a short-lived signed URL generated at request time.
  A stored/public URL to either bucket is a vulnerability.
- **Payments**: the Stripe webhook (`/api/payments/webhook`) verifies Stripe's signature over the
  raw request body. A bypass of that check, or a way to mark a booking paid without a real
  Stripe event, is a high-severity finding.
- **Not yet encrypted at rest**: instance-level secrets in demo/deployment data are stored as
  plaintext columns where noted in code comments — this is a known gap, not something you need
  to report, but PRs improving it are welcome.

Out of scope: the shared public demo at demo.rentinfra.infranomad.com is reset periodically and
intentionally has no real customer data — issues specific to that instance (rather than the
codebase itself) aren't a priority to report.
