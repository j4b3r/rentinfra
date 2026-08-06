-- ============================================================
-- 010_secret_settings.sql — safe storage for API keys
-- ============================================================
-- Integration credentials (Resend, Stripe) are managed from the admin panel
-- rather than environment variables, so they live in `settings`. But that
-- table is world-readable:
--
--   CREATE POLICY "settings_public_read" ON settings FOR SELECT USING (TRUE);
--
-- and getSettingsMap() hands the whole map to client components such as the
-- navbar. A secret key stored there would be published to every visitor.
--
-- This marks which rows are secret, hides them from everyone except admins,
-- and leaves the public rows (company name, phone, opening hours) readable as
-- before so the public site keeps working.
-- ============================================================

ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS is_secret BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.settings.is_secret IS
  'Never expose this value to non-admins. Read it server-side via getSecret().';

-- Replace the blanket public read with one that withholds secrets.
DROP POLICY IF EXISTS "settings_public_read" ON public.settings;
CREATE POLICY "settings_public_read" ON public.settings
  FOR SELECT USING (is_secret = FALSE OR public.is_admin());

-- ------------------------------------------------------------
-- Integration credentials. All start empty and inactive: a fresh install
-- sends no email and takes no payments until someone fills these in.
-- ------------------------------------------------------------
INSERT INTO public.settings (key, value, type, description, is_secret) VALUES
  -- Email (Resend)
  ('resend_api_key',      '', 'string',  'Resend API key. Create one at resend.com/api-keys.', TRUE),
  ('email_enabled',       'false', 'boolean', 'Send booking emails. Requires a working Resend API key.', FALSE),
  ('email_from_address',  '', 'string',  'Address emails are sent from. Must be on a domain verified in Resend.', FALSE),

  -- Payments (Stripe)
  ('stripe_secret_key',      '', 'string',  'Stripe secret key (sk_live_… or sk_test_…). Never shown in full once saved.', TRUE),
  ('stripe_webhook_secret',  '', 'string',  'Stripe webhook signing secret (whsec_…).', TRUE),
  ('stripe_publishable_key', '', 'string',  'Stripe publishable key (pk_live_… or pk_test_…). Safe to expose.', FALSE),
  ('payments_enabled',       'false', 'boolean', 'Collect payment during booking. Requires working Stripe keys.', FALSE)
ON CONFLICT (key) DO NOTHING;

-- Any credential added later by another migration should also be marked.
UPDATE public.settings
SET is_secret = TRUE
WHERE key IN ('resend_api_key', 'stripe_secret_key', 'stripe_webhook_secret')
  AND is_secret = FALSE;
