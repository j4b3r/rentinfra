-- ============================================================
-- Migration 003: Expand settings for full admin settings panel
-- ============================================================

INSERT INTO public.settings (key, value, type, description) VALUES

-- General
('company_name',        'RentInfra Demo',                          'string',  'Business trading name'),
('company_website',     'https://rentinfra.com',               'string',  'Public website URL'),
('google_maps_url',     '',                                        'string',  'Google Maps link to office'),

-- Booking Policy
('min_advance_hours',       '2',    'number',  'Minimum hours in advance a booking can be made'),
('max_booking_days_ahead',  '365',  'number',  'Maximum days ahead a booking can be made'),
('cancellation_policy_en',  'Free cancellation up to 48 hours before pickup. Cancellations within 48 hours forfeit the deposit.', 'string', 'Cancellation policy text (English)'),
('cancellation_policy_es',  'Cancelación gratuita hasta 48 horas antes de la recogida. Las cancelaciones en menos de 48 horas pierden el depósito.', 'string', 'Cancellation policy text (Spanish)'),
('terms_last_updated',      '2025-01-01', 'string', 'Date terms & conditions were last updated'),

-- Notifications
('notify_admin_email',      'info@rentinfra.com', 'string',  'Email address that receives new booking alerts'),
('notify_new_booking',      'true',   'boolean', 'Send email alert to admin on new booking'),
('notify_booking_confirm',  'true',   'boolean', 'Send confirmation email to customer on booking'),
('notify_whatsapp_enabled', 'false',  'boolean', 'Send WhatsApp message to customer on booking'),
('smtp_from_name',          'RentInfra Demo', 'string', 'Sender name for outgoing emails'),
('smtp_from_email',         'noreply@rentinfra.com', 'string', 'Sender email address for outgoing emails')

ON CONFLICT (key) DO NOTHING;
