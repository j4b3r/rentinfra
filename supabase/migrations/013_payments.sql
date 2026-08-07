-- ============================================================
-- 013_payments.sql — Stripe Checkout support
-- ============================================================
-- The bookings table already had payment_status, deposit_amount and
-- stripe_payment_intent_id; nothing ever wrote them. These columns are what a
-- Checkout round trip additionally needs.
-- ============================================================

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS stripe_session_id  TEXT,
  ADD COLUMN IF NOT EXISTS amount_paid        NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paid_at            TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refunded_amount    NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refunded_at        TIMESTAMPTZ;

-- Looking a booking up by its Checkout session is how the webhook finds it.
CREATE UNIQUE INDEX IF NOT EXISTS bookings_stripe_session_idx
  ON public.bookings (stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

COMMENT ON COLUMN public.bookings.amount_paid IS
  'Actually collected so far. May be a part-payment when deposit_percentage < 100.';
COMMENT ON COLUMN public.bookings.stripe_session_id IS
  'Checkout Session id. Unique so a retried webhook cannot double-apply.';

-- ------------------------------------------------------------
-- Do not cancel a booking somebody has paid for
-- ------------------------------------------------------------
-- expire_stale_booking_holds() matched on status = 'pending' alone. With
-- Checkout a booking is created pending and stays pending until the webhook
-- lands, so a slow or retried webhook — or one that arrives after the nightly
-- sweep — would have cancelled a paid booking and released the vehicle.
--
-- The webhook clears hold_expires_at on payment, and this adds a second guard
-- so a paid booking can never be swept even if that write is missed.
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
      -- Never release a booking that has been paid for.
      AND payment_status = 'unpaid'
      AND COALESCE(amount_paid, 0) = 0
    RETURNING 1
  )
  SELECT COUNT(*) INTO released FROM expired;

  RETURN released;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_stale_booking_holds() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expire_stale_booking_holds() TO service_role;

-- ------------------------------------------------------------
-- Settings
-- ------------------------------------------------------------
INSERT INTO public.settings (key, value, type, description, is_secret) VALUES
  ('payment_required_to_book', 'false', 'boolean',
   'Require payment before a booking is accepted. Off means customers can book now and pay at the counter.', FALSE)
ON CONFLICT (key) DO NOTHING;
