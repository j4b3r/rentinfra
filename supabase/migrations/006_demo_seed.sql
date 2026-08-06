-- ============================================================
-- 006_demo_seed.sql — OPTIONAL demo content
-- ============================================================
-- This migration is NOT required to run RentInfra. It exists to
-- populate the public live demo (demo.rentinfra / the Vercel
-- deployment) with a fuller fleet, car photos and sample bookings
-- so visitors can see the product with realistic data.
--
-- If you are forking RentInfra for a real business, SKIP this file.
-- Run only 001 -> 005. Everything below is fake.
--
-- Safe to re-run: all inserts are idempotent on slug/reference.
-- Photos are hotlinked from Unsplash (already allowed in
-- next.config.ts remotePatterns) so no Storage upload is needed.
-- ============================================================

-- ------------------------------------------------------------
-- Extra demo cars (001 already seeds Renault Clio / Toyota RAV4 /
-- Mercedes C-Class). Categories must be economy | suv | luxury.
-- ------------------------------------------------------------
INSERT INTO public.cars
  (slug, make, model, year, category, transmission, fuel_type, seats, doors,
   luggage_small, luggage_large, ac, bluetooth, gps_builtin,
   description_en, description_es, is_available, is_active, license_plate)
VALUES
  ('volkswagen-golf-2024', 'Volkswagen', 'Golf', 2024, 'economy', 'manual', 'petrol', 5, 5, 2, 1,
   TRUE, TRUE, FALSE,
   'A dependable hatchback that is easy to park in town and comfortable on the motorway. A great all-round choice for couples and small families.',
   'Un utilitario fiable, facil de aparcar en ciudad y comodo en carretera. Una gran opcion para parejas y familias pequenas.',
   TRUE, TRUE, 'DEMO-101'),

  ('fiat-500-2023', 'Fiat', '500', 2023, 'economy', 'manual', 'petrol', 4, 3, 1, 1,
   TRUE, TRUE, FALSE,
   'The classic city car. Compact, cheap to run and effortless in narrow old-town streets.',
   'El clasico coche urbano. Compacto, economico y comodo en las calles estrechas del casco antiguo.',
   TRUE, TRUE, 'DEMO-102'),

  ('nissan-qashqai-2024', 'Nissan', 'Qashqai', 2024, 'suv', 'auto', 'diesel', 5, 5, 2, 2,
   TRUE, TRUE, TRUE,
   'A roomy crossover with a raised driving position and generous boot space. Ideal for longer trips with luggage.',
   'Un crossover espacioso con posicion de conduccion elevada y buen maletero. Ideal para viajes largos con equipaje.',
   TRUE, TRUE, 'DEMO-103'),

  ('bmw-x3-2024', 'BMW', 'X3', 2024, 'suv', 'auto', 'diesel', 5, 5, 2, 3,
   TRUE, TRUE, TRUE,
   'A premium SUV combining space and refinement, with leather trim and full driver assistance.',
   'Un SUV premium que combina espacio y refinamiento, con tapiceria de cuero y asistentes de conduccion.',
   TRUE, TRUE, 'DEMO-104'),

  ('porsche-911-carrera-2023', 'Porsche', '911 Carrera', 2023, 'luxury', 'auto', 'petrol', 2, 2, 1, 0,
   TRUE, TRUE, TRUE,
   'The definitive sports car. Rear-engined, endlessly capable, and unmistakable on a coastal road.',
   'El deportivo por excelencia. Motor trasero, capacidad infinita e inconfundible en una carretera de costa.',
   TRUE, TRUE, 'DEMO-105'),

  ('range-rover-sport-2024', 'Land Rover', 'Range Rover Sport', 2024, 'luxury', 'auto', 'hybrid', 5, 5, 2, 3,
   TRUE, TRUE, TRUE,
   'Commanding presence with a hushed cabin and plug-in hybrid economy. The flagship of the demo fleet.',
   'Presencia imponente con un habitaculo silencioso y la economia de un hibrido enchufable. El buque insignia de la flota.',
   FALSE, TRUE, 'DEMO-106')
ON CONFLICT (slug) DO NOTHING;

-- ------------------------------------------------------------
-- Price lists for the new cars (standard, always-active)
-- ------------------------------------------------------------
INSERT INTO public.price_lists (car_id, name, daily_rate, is_active)
SELECT c.id, 'Standard', v.rate, TRUE
FROM (VALUES
  ('volkswagen-golf-2024',      55.00),
  ('fiat-500-2023',             38.00),
  ('nissan-qashqai-2024',       75.00),
  ('bmw-x3-2024',              110.00),
  ('porsche-911-carrera-2023', 320.00),
  ('range-rover-sport-2024',   240.00)
) AS v(slug, rate)
JOIN public.cars c ON c.slug = v.slug
WHERE NOT EXISTS (
  SELECT 1 FROM public.price_lists p WHERE p.car_id = c.id AND p.name = 'Standard'
);

-- Duration discount tiers: 3+ days 10% off, 7+ days 15%, 14+ days 20%
INSERT INTO public.price_list_discounts
  (price_list_id, min_days, max_days, discount_type, discount_value, label_en, label_es)
SELECT p.id, v.min_days, v.max_days, 'percentage', v.val, v.label_en, v.label_es
FROM public.price_lists p
JOIN public.cars c ON c.id = p.car_id
CROSS JOIN (VALUES
  (3,  6,    10.00, '3+ days',  '3+ dias'),
  (7,  13,   15.00, '7+ days',  '7+ dias'),
  (14, NULL, 20.00, '14+ days', '14+ dias')
) AS v(min_days, max_days, val, label_en, label_es)
WHERE c.slug IN ('volkswagen-golf-2024','fiat-500-2023','nissan-qashqai-2024',
                 'bmw-x3-2024','porsche-911-carrera-2023','range-rover-sport-2024')
  AND NOT EXISTS (
    SELECT 1 FROM public.price_list_discounts d
    WHERE d.price_list_id = p.id AND d.min_days = v.min_days
  );

-- ------------------------------------------------------------
-- Car photos for the WHOLE demo fleet (including the 001 seed cars,
-- which ship with no images). Hotlinked from Unsplash.
-- ------------------------------------------------------------
INSERT INTO public.car_images (car_id, url, position, is_primary)
SELECT c.id, v.url, v.position, v.is_primary
FROM (VALUES
  -- seeded in 001
  ('renault-clio-2023',        'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=1200&q=80', 0, TRUE),
  ('renault-clio-2023',        'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200&q=80', 1, FALSE),
  ('toyota-rav4-2023',         'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=1200&q=80', 0, TRUE),
  ('toyota-rav4-2023',         'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&q=80', 1, FALSE),
  ('mercedes-c-class-2023',    'https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=1200&q=80', 0, TRUE),
  ('mercedes-c-class-2023',    'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1200&q=80', 1, FALSE),
  -- added above
  ('volkswagen-golf-2024',     'https://images.unsplash.com/photo-1471479917193-f00955256257?w=1200&q=80', 0, TRUE),
  ('fiat-500-2023',            'https://images.unsplash.com/photo-1512675828443-4f454c42253a?w=1200&q=80', 0, TRUE),
  ('nissan-qashqai-2024',      'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=1200&q=80', 0, TRUE),
  ('bmw-x3-2024',              'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&q=80', 0, TRUE),
  ('porsche-911-carrera-2023', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=80', 0, TRUE),
  ('range-rover-sport-2024',   'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1200&q=80', 0, TRUE)
) AS v(slug, url, position, is_primary)
JOIN public.cars c ON c.slug = v.slug
WHERE NOT EXISTS (
  SELECT 1 FROM public.car_images ci WHERE ci.car_id = c.id AND ci.url = v.url
);

-- ------------------------------------------------------------
-- Sample bookings so the admin dashboard / bookings list is not empty.
-- References are set explicitly (the DB trigger only fires when
-- reference is NULL) so this file stays idempotent.
-- Dates are relative to NOW() so the demo never goes stale.
-- ------------------------------------------------------------
INSERT INTO public.bookings (
  reference, booking_type, status,
  guest_name, guest_email, guest_phone, guest_license,
  car_id, pickup_date, pickup_time, dropoff_date, dropoff_time, total_days,
  pickup_location_id, dropoff_location_id,
  daily_rate_snapshot, discount_applied_pct, addons_total, location_fee,
  young_driver_fee, subtotal, tax_amount, total_amount,
  payment_status, driver_age, notes, confirmed_at
)
SELECT
  v.reference, 'online', v.status,
  v.guest_name, v.guest_email, v.guest_phone, v.guest_license,
  c.id,
  (CURRENT_DATE + v.start_offset)::date, '10:00',
  (CURRENT_DATE + v.start_offset + v.days)::date, '10:00', v.days,
  loc.id, loc.id,
  v.rate, v.disc, v.addons, loc.extra_fee,
  0, calc.subtotal, ROUND(calc.subtotal * 0.21, 2), ROUND(calc.subtotal * 1.21, 2),
  v.pay_status, v.age, v.notes,
  CASE WHEN v.status <> 'pending' THEN NOW() ELSE NULL END
FROM (VALUES
  ('RIF-DEMO-00001', 'completed', 'Alex Turner',   'alex.turner@example.com',   '+44 7700 900001', 'UK-DEMO-1', 'renault-clio-2023',        -21, 5,  45.00, 10.00,  25.00, 34, 'Returned on time, full tank.', 'paid'),
  ('RIF-DEMO-00002', 'completed', 'Maria Lopez',   'maria.lopez@example.com',   '+34 600 000 002', 'ES-DEMO-2', 'toyota-rav4-2023',         -14, 7,  85.00, 15.00,  60.00, 41, 'Repeat customer.',             'paid'),
  ('RIF-DEMO-00003', 'active',    'Jonas Weber',   'jonas.weber@example.com',   '+49 151 0000003', 'DE-DEMO-3', 'bmw-x3-2024',               -2, 6, 110.00, 10.00,  45.00, 38, 'Child seat requested.',        'paid'),
  ('RIF-DEMO-00004', 'confirmed', 'Sophie Martin', 'sophie.martin@example.com', '+33 6 00 000004', 'FR-DEMO-4', 'volkswagen-golf-2024',       4, 4,  55.00, 10.00,  20.00, 29, 'Arriving on the evening flight.', 'deposit_paid'),
  ('RIF-DEMO-00005', 'pending',   'Liam O''Brien', 'liam.obrien@example.com',   '+353 86 0000005', 'IE-DEMO-5', 'porsche-911-carrera-2023',  11, 3, 320.00,  0.00,   0.00, 45, 'Awaiting confirmation.',       'unpaid'),
  ('RIF-DEMO-00006', 'cancelled', 'Nina Petrova',  'nina.petrova@example.com',  '+31 6 00000006', 'NL-DEMO-6', 'fiat-500-2023',              7, 2,  38.00,  0.00,   0.00, 31, 'Cancelled by guest.',          'refunded')
) AS v(reference, status, guest_name, guest_email, guest_phone, guest_license, car_slug,
       start_offset, days, rate, disc, addons, age, notes, pay_status)
JOIN public.cars c ON c.slug = v.car_slug
CROSS JOIN LATERAL (
  SELECT id, extra_fee FROM public.locations ORDER BY name_en LIMIT 1
) AS loc
CROSS JOIN LATERAL (
  SELECT ROUND(v.rate * v.days * (1 - v.disc / 100.0), 2) + v.addons + loc.extra_fee AS subtotal
) AS calc
WHERE NOT EXISTS (
  SELECT 1 FROM public.bookings b WHERE b.reference = v.reference
);

-- ------------------------------------------------------------
-- Demo-specific settings overrides
-- ------------------------------------------------------------
UPDATE public.settings SET value = 'RentInfra Demo'          WHERE key = 'company_name';
UPDATE public.settings SET value = 'demo@rentinfra.example'  WHERE key = 'company_email';
