-- ============================================================
-- 002_maintenance_blocks.sql — Fleet operations (#18, part 1)
-- ============================================================
--
-- A maintenance block takes a car off sale for a date range without faking
-- a booking. It's a separate table, not a row in `bookings`: bookings is the
-- universe every reporting metric in lib/reporting.ts sums over (net
-- revenue, cancellation rate, addon attach rate...), and a workshop visit
-- isn't a sale. It would also mint a CMB- reference via
-- generate_booking_reference() and show up in the customer-facing booking
-- list, neither of which makes sense for a service block.
--
-- Availability stays single-sourced: get_car_availability() is redefined
-- below to UNION maintenance blocks with blocking bookings, so every
-- existing caller (lib/availability.ts, the fleet listing, the car detail
-- page, POST /api/bookings) keeps working with zero changes.
--
-- vehicle_status (available/rented/maintenance/cleaning/off-fleet) is
-- deliberately NOT a stored column. "Rented" and "maintenance" are both
-- derived from whether today falls inside a booking or a block — storing
-- them as a separate field would let it drift from the rows it's supposed
-- to summarize the first time someone edits a date. Only "off-fleet" is a
-- persistent car attribute, and cars.is_active already carries that.

CREATE TABLE IF NOT EXISTS public.maintenance_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('service', 'repair', 'cleaning', 'other')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_date > start_date)
);

CREATE INDEX IF NOT EXISTS maintenance_blocks_car_idx
  ON public.maintenance_blocks(car_id, start_date, end_date);

ALTER TABLE public.maintenance_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "maintenance_blocks_admin_all"
  ON public.maintenance_blocks FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- No overlapping blocks on the same car. This is DB-level protection for
-- blocks against each other; a block overlapping an existing *booking* is
-- checked in the API route instead (maintenance scheduling isn't
-- concurrent-user traffic the way booking creation is, so a read-then-write
-- check there is an acceptable trade for not touching bookings_no_overlap,
-- which is scoped to public.bookings only).
ALTER TABLE public.maintenance_blocks
  ADD CONSTRAINT maintenance_blocks_no_overlap
  EXCLUDE USING gist (
    car_id WITH =,
    daterange(start_date, end_date, '[)') WITH &&
  );

-- Extend availability to include maintenance blocks, in the same shape the
-- function already returns, so every caller of getConflictingBookings() /
-- getFleetAvailability() etc. picks this up with no code change.
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
    AND b.pickup_date  < end_date
    AND b.dropoff_date > start_date

  UNION ALL

  SELECT m.car_id, m.start_date, m.end_date
  FROM public.maintenance_blocks m
  WHERE m.start_date < end_date
    AND m.end_date   > start_date;
$$;

COMMENT ON FUNCTION public.get_car_availability(DATE, DATE) IS
  'Occupied date ranges per car for a window: blocking bookings plus '
  'maintenance blocks. SECURITY DEFINER so the public site can compute '
  'availability without read access to booking records.';
