-- ============================================================
-- 011_notification_delivery.sql — make the queue drainable
-- ============================================================
-- `notifications_queue` has existed since 001 and rows have been inserted on
-- every booking, but nothing ever read them, so no email was ever sent. These
-- columns are what a worker needs to retry safely without sending twice.
-- ============================================================

ALTER TABLE public.notifications_queue
  ADD COLUMN IF NOT EXISTS attempts     INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_attempt TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subject      TEXT;

-- The worker claims pending rows oldest-first.
CREATE INDEX IF NOT EXISTS notifications_queue_pending_idx
  ON public.notifications_queue (status, created_at)
  WHERE status = 'pending';

COMMENT ON COLUMN public.notifications_queue.attempts IS
  'Delivery attempts so far. The worker gives up after 3 and marks the row failed.';

-- Existing statuses are pending | sent | failed, which is all the worker needs.
