-- ============================================================
-- 005_twilio_settings.sql — WhatsApp & SMS via Twilio (#11)
-- ============================================================
--
-- `notifications_queue.type` already allowed 'whatsapp' and 'sms', and
-- `notify_whatsapp_enabled` already existed as an unused toggle — this
-- finishes the feature those were scaffolded for, following the exact
-- pattern already established for Resend/Stripe: credentials live in
-- `settings` with `is_secret = TRUE`, entered and activated from
-- Settings → Integrations, never in an env var or hardcoded.

INSERT INTO public.settings (key, value, type, description, is_secret) VALUES
  ('twilio_account_sid',    '', 'string',  'Twilio Account SID', TRUE),
  ('twilio_auth_token',     '', 'string',  'Twilio Auth Token', TRUE),
  ('twilio_whatsapp_from',  '', 'string',  'Twilio WhatsApp sender number, e.g. whatsapp:+14155238886', FALSE),
  ('twilio_sms_from',       '', 'string',  'Twilio SMS sender number, e.g. +14155238886', FALSE),
  ('whatsapp_enabled',      'false', 'boolean', 'Send booking WhatsApp messages via Twilio', FALSE),
  ('sms_enabled',           'false', 'boolean', 'Send booking SMS via Twilio', FALSE),
  ('notify_sms_enabled',    'false', 'boolean', 'Send SMS notification to customer on booking', FALSE)
ON CONFLICT (key) DO NOTHING;
