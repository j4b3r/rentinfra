-- ============================================================
-- 003_licence_documents.sql — Driver licence verification (#21)
-- ============================================================
--
-- "Store licence images against the booking, let staff mark verified" —
-- automated scanning/face-match is a paid third-party integration and is
-- explicitly out of scope (see ROADMAP.md).
--
-- A separate table and bucket from booking_condition_photos, not an
-- extension of it: a licence scan is an identity document with a different
-- retention/privacy profile than vehicle-damage evidence, and giving both
-- kinds of photo the same bucket would mean one RLS policy governs
-- documents that shouldn't share a policy just because they're both JPEGs
-- on a booking.
--
-- Verification is a fact about the booking's driver, not about a JPEG —
-- two photos (front/back) each carrying their own verified/rejected state
-- would be incoherent (what does "the front is verified but the back
-- isn't" mean?). So licence_verified_* lives on bookings; the photo rows
-- are plain attachments.
--
-- Capture happens at the counter (staff-operated), not during online
-- checkout — adding a file-upload requirement to the booking wizard would
-- be a conversion risk for a feature that's fundamentally a staff check.

CREATE TABLE IF NOT EXISTS public.booking_licence_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  side TEXT NOT NULL CHECK (side IN ('front', 'back')),
  storage_path TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS booking_licence_documents_booking_idx
  ON public.booking_licence_documents(booking_id);

ALTER TABLE public.booking_licence_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "licence_documents_admin_all"
  ON public.booking_licence_documents FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS licence_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS licence_verified_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS licence_rejection_reason TEXT;

COMMENT ON COLUMN public.bookings.licence_verified_at IS
  'Set by staff after visually checking the uploaded licence photos against '
  'guest_license and the driver. NULL = not yet reviewed. Rejecting sets '
  'licence_rejection_reason and clears this.';

-- Private bucket — a licence scan is a government ID photo. Same signed-URL
-- pattern as condition-photos: never a stored public URL, short TTL at
-- render time only.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'licence-documents',
  'licence-documents',
  false,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "licence_documents_storage_admin_all"
  ON storage.objects FOR ALL
  USING (bucket_id = 'licence-documents' AND is_admin())
  WITH CHECK (bucket_id = 'licence-documents' AND is_admin());
