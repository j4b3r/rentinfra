-- ============================================================
-- 014: Vehicle handover and condition reports
-- ============================================================
--
-- Photo-based condition capture at pickup and return, plus a
-- damage-claim record staff can raise from those photos.
--
-- Deliberately NOT built here (see ROADMAP.md notes on #17):
--  - Marked damage diagrams — the printed contract already covers this
--    on paper; a coordinate-overlay UI is separate follow-up work.
--  - Digital signature capture — same reasoning, contract stays paper.
--  - Automatic deposit deduction — Stripe Checkout Sessions here run
--    with mode: 'payment' and no `customer`/`setup_future_usage', so
--    there is no saved payment method to charge off-session. The
--    security deposit itself is already a counter-side matter
--    (bookings.payment_method_deposit). A "claim" is a record staff
--    act on at the counter, not a button that moves money.

-- Condition photos: per booking, per phase (pickup/return).
CREATE TABLE IF NOT EXISTS public.booking_condition_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  phase TEXT NOT NULL CHECK (phase IN ('pickup', 'return')),
  storage_path TEXT NOT NULL,
  caption TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS booking_condition_photos_booking_idx
  ON public.booking_condition_photos(booking_id, phase);

ALTER TABLE public.booking_condition_photos ENABLE ROW LEVEL SECURITY;

-- Staff-only: these are private evidence photos, not marketing images.
CREATE POLICY "condition_photos_admin_all"
  ON public.booking_condition_photos FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Damage claims: a staff-raised record citing specific photos, acted on
-- at the counter (cash/card deposit adjustment), not an automatic charge.
CREATE TABLE IF NOT EXISTS public.booking_damage_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  photo_ids UUID[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'waived')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS booking_damage_claims_booking_idx
  ON public.booking_damage_claims(booking_id);

ALTER TABLE public.booking_damage_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "damage_claims_admin_all"
  ON public.booking_damage_claims FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Private storage bucket. Unlike car-images, these are customer-vehicle
-- evidence photos and must never be publicly readable — access is only
-- ever via short-lived signed URLs generated server-side for an admin.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'condition-photos',
  'condition-photos',
  false,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "condition_photos_storage_admin_all"
  ON storage.objects FOR ALL
  USING (bucket_id = 'condition-photos' AND is_admin())
  WITH CHECK (bucket_id = 'condition-photos' AND is_admin());
