-- ============================================================
-- 008_booking_signatures.sql — E-signature capture on rental contracts
-- ============================================================
--
-- Replaces the blank sign-here boxes in the contract PDF with a real,
-- captured signature when staff take one on a tablet/screen at the
-- counter — print-and-sign-by-hand stays fully supported when they don't
-- (the PDF falls back to a blank line for any stage/role that has none).
--
-- Follows booking_licence_documents (003) exactly: its own table and
-- private bucket, is_admin()-gated RLS, booking_id FK cascade. A signature
-- is captured once per (booking, role, stage) — re-signing replaces the
-- prior image rather than accumulating duplicates, mirroring how a new
-- licence photo resets verification instead of stacking up.

CREATE TABLE IF NOT EXISTS public.booking_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('client', 'company')),
  stage TEXT NOT NULL CHECK (stage IN ('contract', 'delivery', 'return')),
  storage_path TEXT NOT NULL,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (booking_id, role, stage)
);

CREATE INDEX IF NOT EXISTS booking_signatures_booking_idx
  ON public.booking_signatures(booking_id);

ALTER TABLE public.booking_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "booking_signatures_admin_all"
  ON public.booking_signatures FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Private bucket — same signed-URL pattern as condition-photos and
-- licence-documents: never a stored public URL, short TTL at render time.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'signatures',
  'signatures',
  false,
  1048576, -- 1MB — a signature PNG is small
  ARRAY['image/png']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "signatures_storage_admin_all"
  ON storage.objects FOR ALL
  USING (bucket_id = 'signatures' AND is_admin())
  WITH CHECK (bucket_id = 'signatures' AND is_admin());
