-- ============================================================
-- 012_vehicle_types.sql — motorbikes and bicycles
-- ============================================================
-- The fleet was cars only: `category` was constrained to economy/suv/luxury
-- and `transmission` was NOT NULL, neither of which means anything for a
-- pedal bicycle.
--
-- Rather than duplicate the booking, pricing and availability stack per
-- vehicle kind, this keeps one table and adds `vehicle_type`. Car-only
-- columns become optional, and categories are validated per type.
--
-- Existing rows are all cars, so the backfill is unambiguous.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Vehicle type
-- ------------------------------------------------------------
ALTER TABLE public.cars
  ADD COLUMN IF NOT EXISTS vehicle_type TEXT NOT NULL DEFAULT 'car';

ALTER TABLE public.cars DROP CONSTRAINT IF EXISTS cars_vehicle_type_check;
ALTER TABLE public.cars
  ADD CONSTRAINT cars_vehicle_type_check
  CHECK (vehicle_type IN ('car', 'motorbike', 'bicycle'));

COMMENT ON COLUMN public.cars.vehicle_type IS
  'car | motorbike | bicycle. Drives which specs and rental rules apply.';

-- ------------------------------------------------------------
-- 2. Categories now depend on the type
-- ------------------------------------------------------------
ALTER TABLE public.cars DROP CONSTRAINT IF EXISTS cars_category_check;
ALTER TABLE public.cars
  ADD CONSTRAINT cars_category_check CHECK (
    (vehicle_type = 'car'       AND category IN ('economy', 'suv', 'luxury')) OR
    (vehicle_type = 'motorbike' AND category IN ('scooter', 'motorcycle', 'touring')) OR
    (vehicle_type = 'bicycle'   AND category IN ('city', 'mountain', 'electric', 'road'))
  );

-- ------------------------------------------------------------
-- 3. Car-only fields become optional
-- ------------------------------------------------------------
-- A bicycle has no transmission. Keep the allowed values for vehicles that
-- do have one, but let it be null.
ALTER TABLE public.cars ALTER COLUMN transmission DROP NOT NULL;

ALTER TABLE public.cars DROP CONSTRAINT IF EXISTS cars_transmission_check;
ALTER TABLE public.cars
  ADD CONSTRAINT cars_transmission_check
  CHECK (transmission IS NULL OR transmission IN ('auto', 'manual'));

-- Bicycles are not petrol or diesel; motorbikes may be electric.
ALTER TABLE public.cars DROP CONSTRAINT IF EXISTS cars_fuel_type_check;
ALTER TABLE public.cars
  ADD CONSTRAINT cars_fuel_type_check
  CHECK (fuel_type IS NULL OR fuel_type IN ('petrol', 'diesel', 'electric', 'hybrid', 'none'));

-- ------------------------------------------------------------
-- 4. Specs that only make sense for two-wheelers
-- ------------------------------------------------------------
ALTER TABLE public.cars
  ADD COLUMN IF NOT EXISTS engine_cc      INTEGER,  -- motorbikes
  ADD COLUMN IF NOT EXISTS frame_size     TEXT,     -- bicycles: S/M/L or cm
  ADD COLUMN IF NOT EXISTS gears          INTEGER,  -- bicycles
  ADD COLUMN IF NOT EXISTS helmet_included BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.cars.engine_cc IS 'Motorbike engine displacement in cc.';
COMMENT ON COLUMN public.cars.frame_size IS 'Bicycle frame size, e.g. S / M / L or 54cm.';

-- ------------------------------------------------------------
-- 5. Which rules apply to which type
-- ------------------------------------------------------------
-- A pedal bicycle needs no driving licence, no minimum driver age and no
-- young-driver surcharge. Storing this on the row keeps the pricing engine
-- and the booking wizard from hardcoding vehicle rules.
ALTER TABLE public.cars
  ADD COLUMN IF NOT EXISTS requires_license BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS min_rider_age    INTEGER;

COMMENT ON COLUMN public.cars.requires_license IS
  'False for bicycles: no licence, no minimum age, no young-driver surcharge.';
COMMENT ON COLUMN public.cars.min_rider_age IS
  'Overrides the global min_driver_age. NULL means use the global setting.';

UPDATE public.cars SET requires_license = FALSE WHERE vehicle_type = 'bicycle';

-- ------------------------------------------------------------
-- 6. Hourly hire
-- ------------------------------------------------------------
-- Bikes are commonly rented by the hour or half-day, so a price list needs to
-- say what its rate buys. Existing lists are daily.
ALTER TABLE public.price_lists
  ADD COLUMN IF NOT EXISTS rate_unit    TEXT NOT NULL DEFAULT 'day',
  ADD COLUMN IF NOT EXISTS hourly_rate  NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS min_hours    INTEGER;

ALTER TABLE public.price_lists DROP CONSTRAINT IF EXISTS price_lists_rate_unit_check;
ALTER TABLE public.price_lists
  ADD CONSTRAINT price_lists_rate_unit_check CHECK (rate_unit IN ('day', 'hour'));

COMMENT ON COLUMN public.price_lists.rate_unit IS
  'What daily_rate represents. "hour" lists also set hourly_rate and min_hours.';

-- Bookings need to record an hourly hire.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS rental_unit  TEXT NOT NULL DEFAULT 'day',
  ADD COLUMN IF NOT EXISTS total_hours  INTEGER;

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_rental_unit_check;
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_rental_unit_check CHECK (rental_unit IN ('day', 'hour'));

-- ------------------------------------------------------------
-- 7. Addons can be limited to a vehicle type
-- ------------------------------------------------------------
-- A child seat is meaningless on a bicycle and a helmet is meaningless in a
-- car. NULL keeps an addon global, matching how is_global already works.
ALTER TABLE public.addons
  ADD COLUMN IF NOT EXISTS vehicle_type TEXT;

ALTER TABLE public.addons DROP CONSTRAINT IF EXISTS addons_vehicle_type_check;
ALTER TABLE public.addons
  ADD CONSTRAINT addons_vehicle_type_check
  CHECK (vehicle_type IS NULL OR vehicle_type IN ('car', 'motorbike', 'bicycle'));

COMMENT ON COLUMN public.addons.vehicle_type IS
  'Limits an addon to one vehicle type. NULL means it applies to all.';

INSERT INTO public.addons (name_en, name_es, description_en, description_es, pricing_type, price, is_global, is_active, vehicle_type) VALUES
  ('Helmet',            'Casco',              'DOT-approved helmet in your size.',        'Casco homologado en tu talla.',            'flat',    0.00, TRUE, TRUE, 'motorbike'),
  ('Top box',           'Baúl',               'Lockable rear storage box.',               'Baúl trasero con cerradura.',              'per_day', 5.00, TRUE, TRUE, 'motorbike'),
  ('Bike lock',         'Candado',            'Heavy-duty D-lock and cable.',             'Candado en U reforzado con cable.',        'flat',    0.00, TRUE, TRUE, 'bicycle'),
  ('Bicycle helmet',    'Casco de bicicleta', 'Adjustable helmet, all sizes.',            'Casco ajustable, todas las tallas.',       'flat',    0.00, TRUE, TRUE, 'bicycle'),
  ('Pannier bags',      'Alforjas',           'Pair of waterproof rear panniers.',        'Par de alforjas impermeables.',            'per_day', 4.00, TRUE, TRUE, 'bicycle')
ON CONFLICT DO NOTHING;

-- Existing car-specific addons stay car-only so they stop appearing on bikes.
UPDATE public.addons
SET vehicle_type = 'car'
WHERE vehicle_type IS NULL
  AND name_en IN ('Child Seat', 'Baby Seat', 'GPS Navigation', 'Additional Driver', 'Second Driver');

-- ------------------------------------------------------------
-- 8. Index for type filtering on the public fleet
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS cars_vehicle_type_idx
  ON public.cars (vehicle_type, is_active);

-- Booster seats are car-only too (the seed uses this name rather than 'Child Seat').
UPDATE public.addons SET vehicle_type = 'car'
WHERE vehicle_type IS NULL AND name_en IN ('Booster Seat');
