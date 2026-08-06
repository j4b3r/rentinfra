-- ============================================================
-- 004: Add storage_path to car_images + create car-images bucket
-- ============================================================

-- Add storage_path column to track the file path in Supabase Storage
ALTER TABLE public.car_images ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- Create the car-images storage bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'car-images',
  'car-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "car_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'car-images');

CREATE POLICY "car_images_admin_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'car-images' AND is_admin());

CREATE POLICY "car_images_admin_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'car-images' AND is_admin());
