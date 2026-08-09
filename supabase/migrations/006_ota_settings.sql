-- ============================================================
-- 006_ota_settings.sql — Channel/OTA connectivity settings (#23, partial)
-- ============================================================
--
-- No specific channel manager is integrated here — Booking.com Connectivity,
-- SiteMinder, Channex and others differ in auth, payload shape and
-- push-vs-pull direction, and guessing one would ship something that looks
-- connected but isn't. What ships instead: admin-managed credentials
-- (same pattern as Resend/Stripe/Twilio) and an outbound availability feed
-- a channel manager can pull from (see GET /api/ota/availability). Inbound
-- booking ingestion from an OTA is NOT built — see ROADMAP.md.

INSERT INTO public.settings (key, value, type, description, is_secret) VALUES
  ('ota_provider',    '', 'string',  'Name of the connected channel manager / OTA, for display only', FALSE),
  ('ota_api_key',     '', 'string',  'Bearer token a channel manager sends to authenticate against the availability feed', TRUE),
  ('ota_property_id', '', 'string',  'This property''s ID in the channel manager, if it needs one', FALSE),
  ('ota_enabled',     'false', 'boolean', 'Serve the OTA availability feed', FALSE)
ON CONFLICT (key) DO NOTHING;
