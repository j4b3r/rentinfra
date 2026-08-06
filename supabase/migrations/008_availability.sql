-- ============================================================
-- 008_availability.sql — public availability without leaking bookings
-- ============================================================
-- RLS on `bookings` only lets a user see their own rows, which is correct:
-- guest names, emails and phone numbers must never be public. But it means
-- an anonymous visitor querying `bookings` to work out which cars are free
-- gets an empty result, so every car looks available and the customer only
-- discovers the clash when the booking API refuses at the last step.
--
-- This function exposes the one fact the public site legitimately needs —
-- which car is occupied between which dates — and nothing else. No guest
-- details, no prices, no reference numbers.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_car_availability(
  start_date DATE,
  end_date   DATE
)
RETURNS TABLE (car_id UUID, pickup_date DATE, dropoff_date DATE)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.car_id, b.pickup_date, b.dropoff_date
  FROM public.bookings b
  WHERE b.status IN ('pending', 'confirmed', 'active')
    -- Strict inequalities: a car returned on the 14th can go out again on
    -- the 14th. Same-day turnaround is normal and the handover is sequenced
    -- by pickup/return times at the counter.
    AND b.pickup_date  < end_date
    AND b.dropoff_date > start_date;
$$;

REVOKE ALL ON FUNCTION public.get_car_availability(DATE, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_car_availability(DATE, DATE) TO anon, authenticated;

COMMENT ON FUNCTION public.get_car_availability(DATE, DATE) IS
  'Occupied date ranges per car for a window. SECURITY DEFINER so the public '
  'site can compute availability without read access to booking records.';

-- ============================================================
-- Structural protection against double-booking
-- ============================================================
-- The application checks availability before inserting, but that is a
-- read-then-write: two concurrent requests can both pass the check and both
-- insert. This constraint makes an overlapping booking impossible at the
-- database level, whatever the application does.
--
-- '[)' means the range includes the pickup day and excludes the dropoff day,
-- which is what allows same-day turnaround.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_no_overlap;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_no_overlap
  EXCLUDE USING gist (
    car_id WITH =,
    daterange(pickup_date, dropoff_date, '[)') WITH &&
  )
  WHERE (status IN ('pending', 'confirmed', 'active'));
