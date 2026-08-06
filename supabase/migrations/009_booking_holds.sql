-- ============================================================
-- 009_booking_holds.sql — expire unconfirmed bookings
-- ============================================================
-- Now that overlap detection actually works, a `pending` booking holds the
-- car. Nothing ever clears one, so an abandoned checkout would keep a vehicle
-- off sale indefinitely. Commercial systems put a clock on unconfirmed holds;
-- this adds one.
--
-- `hold_expires_at` is set when a booking is created and cleared once staff
-- confirm it. A scheduled job cancels anything past its expiry.
-- ============================================================

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS hold_expires_at TIMESTAMPTZ;

-- Only pending rows are ever swept, so index just those.
CREATE INDEX IF NOT EXISTS bookings_hold_expiry_idx
  ON public.bookings (hold_expires_at)
  WHERE status = 'pending';

COMMENT ON COLUMN public.bookings.hold_expires_at IS
  'When an unconfirmed pending booking stops holding the car. NULL once '
  'confirmed, or when the booking should never auto-expire.';

-- ------------------------------------------------------------
-- How long a hold lasts, and whether the sweep runs at all.
-- ------------------------------------------------------------
INSERT INTO public.settings (key, value, type, description) VALUES
  ('booking_hold_minutes', '1440', 'number',
   'Minutes an unconfirmed booking holds the car before it is cancelled automatically. Default 1440 (24 hours).'),
  ('booking_hold_enabled', 'true', 'boolean',
   'Automatically cancel unconfirmed bookings once their hold expires.')
ON CONFLICT (key) DO NOTHING;

-- ------------------------------------------------------------
-- The sweep itself. Runs as a function so the scheduled route stays a thin
-- trigger, and so it can also be invoked manually from the SQL editor.
-- Returns how many bookings it released.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.expire_stale_booking_holds()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  released INTEGER;
BEGIN
  IF COALESCE((SELECT value FROM public.settings WHERE key = 'booking_hold_enabled'), 'true') <> 'true' THEN
    RETURN 0;
  END IF;

  WITH expired AS (
    UPDATE public.bookings
    SET status = 'cancelled',
        cancellation_reason = 'Hold expired before confirmation',
        cancelled_at = NOW(),
        updated_at = NOW()
    WHERE status = 'pending'
      AND hold_expires_at IS NOT NULL
      AND hold_expires_at < NOW()
    RETURNING 1
  )
  SELECT COUNT(*) INTO released FROM expired;

  RETURN released;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_stale_booking_holds() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expire_stale_booking_holds() TO service_role;

COMMENT ON FUNCTION public.expire_stale_booking_holds() IS
  'Cancels pending bookings whose hold has expired, freeing the car. Called '
  'by the /api/cron/expire-holds route.';
