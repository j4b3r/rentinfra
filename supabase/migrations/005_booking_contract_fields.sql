-- ============================================================
-- 005: Add fields needed for rental contract PDF
-- ============================================================

-- Cars: license plate
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS license_plate TEXT;

-- Bookings: contract-specific fields
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS guest_nie_passport TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS guest_address TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS guest_address_spain TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS km_at_pickup INTEGER;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS km_at_return INTEGER;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_method_deposit TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS fuel_level_pickup TEXT DEFAULT 'full'; -- empty/quarter/half/three_quarters/full
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS fuel_level_return TEXT;
