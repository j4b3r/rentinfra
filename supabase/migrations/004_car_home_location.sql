-- ============================================================
-- 004_car_home_location.sql — Per-branch fleet (#22, part 1)
-- ============================================================
--
-- One-way rentals already worked mechanically before this migration:
-- bookings.pickup_location_id / dropoff_location_id are independent, and
-- pricing.ts already sums both locations' extra_fee. What was actually
-- missing is that no car has ever been associated with a location at all —
-- the whole fleet is one undifferentiated pool, so multi-branch operators
-- can't show "cars available at this branch."
--
-- NULLABLE, and NULL means "available at every location" — not "no
-- location set yet." Every existing deployment, including the shared demo's
-- 15 cars, has no location on any car today. If this were NOT NULL or
-- defaulted to filtering cars out, every fork's fleet page would go empty
-- the moment someone turns on location filtering. The fleet listing must
-- treat NULL as a wildcard, matching every requested location.
--
-- Deliberately NOT added: a `current_location_id` tracking where a car
-- physically is after a one-way rental. That's the same mistake #18
-- explicitly avoided with vehicle_status — a mutable position column would
-- disagree with the bookings that actually determine it the moment someone
-- edits a dropoff location. Where a car currently sits is derivable from
-- its most recent booking's dropoff_location_id (or home_location_id if
-- none), not stored. Not built in this pass — see ROADMAP.md.

ALTER TABLE public.cars
  ADD COLUMN IF NOT EXISTS home_location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.cars.home_location_id IS
  'The branch this car is normally based at. NULL means available at every '
  'location — treat NULL as a wildcard when filtering the fleet by '
  'location, never as "unset, so exclude it."';

CREATE INDEX IF NOT EXISTS cars_home_location_idx ON public.cars(home_location_id);
