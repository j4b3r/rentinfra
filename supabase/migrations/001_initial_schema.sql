-- ============================================================
-- RentInfra - Initial Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS (extends Supabase auth.users)
-- ============================================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  nationality TEXT,
  license_number TEXT,
  preferred_language TEXT DEFAULT 'en',
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CARS
-- ============================================================
CREATE TABLE public.cars (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  category TEXT NOT NULL CHECK (category IN ('economy', 'suv', 'luxury')),
  transmission TEXT NOT NULL DEFAULT 'manual' CHECK (transmission IN ('auto', 'manual')),
  fuel_type TEXT DEFAULT 'petrol' CHECK (fuel_type IN ('petrol', 'diesel', 'electric', 'hybrid')),
  seats INTEGER DEFAULT 5,
  doors INTEGER DEFAULT 4,
  luggage_small INTEGER DEFAULT 1,
  luggage_large INTEGER DEFAULT 1,
  ac BOOLEAN DEFAULT TRUE,
  bluetooth BOOLEAN DEFAULT TRUE,
  gps_builtin BOOLEAN DEFAULT FALSE,
  description_en TEXT,
  description_es TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CAR IMAGES
-- ============================================================
CREATE TABLE public.car_images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  car_id UUID REFERENCES public.cars(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PRICE LISTS
-- ============================================================
CREATE TABLE public.price_lists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  car_id UUID REFERENCES public.cars(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  daily_rate NUMERIC(10,2) NOT NULL,
  season_start DATE,
  season_end DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PRICE LIST DISCOUNTS (per duration tier)
-- ============================================================
CREATE TABLE public.price_list_discounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  price_list_id UUID REFERENCES public.price_lists(id) ON DELETE CASCADE NOT NULL,
  min_days INTEGER NOT NULL,
  max_days INTEGER, -- NULL = unlimited
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10,2) NOT NULL,
  label_en TEXT,
  label_es TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ADDONS
-- ============================================================
CREATE TABLE public.addons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_es TEXT NOT NULL,
  description_en TEXT,
  description_es TEXT,
  icon TEXT, -- lucide icon name
  pricing_type TEXT NOT NULL CHECK (pricing_type IN ('per_day', 'flat')),
  price NUMERIC(10,2) NOT NULL,
  is_global BOOLEAN DEFAULT TRUE, -- if true, applies to all cars
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CAR ADDONS (link non-global addons to specific cars)
-- ============================================================
CREATE TABLE public.car_addons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  car_id UUID REFERENCES public.cars(id) ON DELETE CASCADE NOT NULL,
  addon_id UUID REFERENCES public.addons(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(car_id, addon_id)
);

-- ============================================================
-- LOCATIONS
-- ============================================================
CREATE TABLE public.locations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_es TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('office', 'airport', 'hotel_delivery', 'custom')),
  address TEXT,
  extra_fee NUMERIC(10,2) DEFAULT 0,
  notes_en TEXT,
  notes_es TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BOOKINGS
-- ============================================================
CREATE TABLE public.bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reference TEXT UNIQUE NOT NULL, -- RIF-2026-00001 (prefix is customizable, see generate_booking_reference())
  booking_type TEXT NOT NULL DEFAULT 'online' CHECK (booking_type IN ('online', 'offline')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')),

  -- guest or registered user
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  guest_name TEXT,
  guest_email TEXT,
  guest_phone TEXT,
  guest_license TEXT,

  -- car
  car_id UUID REFERENCES public.cars(id) ON DELETE RESTRICT NOT NULL,

  -- dates
  pickup_date DATE NOT NULL,
  pickup_time TIME NOT NULL DEFAULT '09:00',
  dropoff_date DATE NOT NULL,
  dropoff_time TIME NOT NULL DEFAULT '09:00',
  total_days INTEGER NOT NULL,

  -- locations
  pickup_location_id UUID REFERENCES public.locations(id),
  dropoff_location_id UUID REFERENCES public.locations(id),
  hotel_name TEXT,
  hotel_address TEXT,

  -- pricing snapshot (frozen at booking time)
  daily_rate_snapshot NUMERIC(10,2),
  discount_applied_pct NUMERIC(5,2) DEFAULT 0,
  addons_total NUMERIC(10,2) DEFAULT 0,
  location_fee NUMERIC(10,2) DEFAULT 0,
  young_driver_fee NUMERIC(10,2) DEFAULT 0,
  subtotal NUMERIC(10,2),
  tax_amount NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(10,2),

  -- payment
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'deposit_paid', 'paid', 'refunded', 'partial_refund')),
  payment_method TEXT CHECK (payment_method IN ('stripe', 'paypal', 'cash', 'bank_transfer')),
  stripe_payment_intent_id TEXT,
  paypal_order_id TEXT,
  deposit_amount NUMERIC(10,2) DEFAULT 0,
  deposit_paid_at TIMESTAMPTZ,

  -- meta
  driver_age INTEGER,
  notes TEXT, -- admin internal notes
  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BOOKING ADDONS
-- ============================================================
CREATE TABLE public.booking_addons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  addon_id UUID REFERENCES public.addons(id) ON DELETE RESTRICT NOT NULL,
  addon_name_snapshot TEXT NOT NULL,
  pricing_type_snapshot TEXT NOT NULL,
  price_snapshot NUMERIC(10,2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  subtotal NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SETTINGS (key-value store for admin-configurable options)
-- ============================================================
CREATE TABLE public.settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'string' CHECK (type IN ('string', 'number', 'boolean', 'json')),
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS QUEUE (for future email/WhatsApp)
-- ============================================================
CREATE TABLE public.notifications_queue (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('email', 'whatsapp', 'sms')),
  recipient TEXT NOT NULL,
  template_key TEXT NOT NULL,
  payload JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRANSLATIONS (dynamic content managed from admin)
-- ============================================================
CREATE TABLE public.translations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  namespace TEXT NOT NULL,
  key TEXT NOT NULL,
  locale TEXT NOT NULL CHECK (locale IN ('en', 'es', 'de', 'ru')),
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(namespace, key, locale)
);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cars_updated_at BEFORE UPDATE ON public.cars FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER price_lists_updated_at BEFORE UPDATE ON public.price_lists FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER addons_updated_at BEFORE UPDATE ON public.addons FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, preferred_language)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', 'en');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-generate booking reference
-- The 'RIF' prefix is customizable — change the literal below to your own brand's short code
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
  new_ref TEXT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  SELECT COUNT(*) + 1 INTO seq_num FROM public.bookings WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
  new_ref := 'RIF-' || year_part || '-' || LPAD(seq_num::TEXT, 5, '0');
  NEW.reference := new_ref;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_booking_reference
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  WHEN (NEW.reference IS NULL OR NEW.reference = '')
  EXECUTE FUNCTION generate_booking_reference();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_list_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = TRUE
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Cars: public read, admin write
CREATE POLICY "cars_public_read" ON public.cars FOR SELECT USING (is_active = TRUE);
CREATE POLICY "cars_admin_all" ON public.cars FOR ALL USING (is_admin());

-- Car images: public read, admin write
CREATE POLICY "car_images_public_read" ON public.car_images FOR SELECT USING (TRUE);
CREATE POLICY "car_images_admin_all" ON public.car_images FOR ALL USING (is_admin());

-- Price lists: public read, admin write
CREATE POLICY "price_lists_public_read" ON public.price_lists FOR SELECT USING (is_active = TRUE);
CREATE POLICY "price_lists_admin_all" ON public.price_lists FOR ALL USING (is_admin());

-- Price list discounts: public read, admin write
CREATE POLICY "price_list_discounts_public_read" ON public.price_list_discounts FOR SELECT USING (TRUE);
CREATE POLICY "price_list_discounts_admin_all" ON public.price_list_discounts FOR ALL USING (is_admin());

-- Addons: public read, admin write
CREATE POLICY "addons_public_read" ON public.addons FOR SELECT USING (is_active = TRUE);
CREATE POLICY "addons_admin_all" ON public.addons FOR ALL USING (is_admin());

-- Car addons: public read, admin write
CREATE POLICY "car_addons_public_read" ON public.car_addons FOR SELECT USING (TRUE);
CREATE POLICY "car_addons_admin_all" ON public.car_addons FOR ALL USING (is_admin());

-- Locations: public read, admin write
CREATE POLICY "locations_public_read" ON public.locations FOR SELECT USING (is_active = TRUE);
CREATE POLICY "locations_admin_all" ON public.locations FOR ALL USING (is_admin());

-- Profiles: users read/update own, admin read all
CREATE POLICY "profiles_own" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "profiles_admin_read" ON public.profiles FOR SELECT USING (is_admin());

-- Bookings: users see own, guests use reference+email, admin sees all
CREATE POLICY "bookings_user_own" ON public.bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "bookings_user_insert" ON public.bookings FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "bookings_admin_all" ON public.bookings FOR ALL USING (is_admin());

-- Booking addons: same as bookings
CREATE POLICY "booking_addons_insert" ON public.booking_addons FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "booking_addons_user_read" ON public.booking_addons FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND b.user_id = auth.uid())
);
CREATE POLICY "booking_addons_admin_all" ON public.booking_addons FOR ALL USING (is_admin());

-- Settings: public read, admin write
CREATE POLICY "settings_public_read" ON public.settings FOR SELECT USING (TRUE);
CREATE POLICY "settings_admin_all" ON public.settings FOR ALL USING (is_admin());

-- Translations: public read, admin write
CREATE POLICY "translations_public_read" ON public.translations FOR SELECT USING (TRUE);
CREATE POLICY "translations_admin_all" ON public.translations FOR ALL USING (is_admin());

-- Notifications: admin only
CREATE POLICY "notifications_admin_all" ON public.notifications_queue FOR ALL USING (is_admin());

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_bookings_reference ON public.bookings(reference);
CREATE INDEX idx_bookings_guest_email ON public.bookings(guest_email);
CREATE INDEX idx_bookings_car_id ON public.bookings(car_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_bookings_pickup_date ON public.bookings(pickup_date);
CREATE INDEX idx_cars_category ON public.cars(category);
CREATE INDEX idx_cars_slug ON public.cars(slug);
CREATE INDEX idx_price_lists_car_id ON public.price_lists(car_id);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Default settings
INSERT INTO public.settings (key, value, type, description) VALUES
('min_driver_age', '21', 'number', 'Minimum driver age in years'),
('min_license_years', '1', 'number', 'Minimum years holding a license'),
('young_driver_surcharge_per_day', '10', 'number', 'Extra charge per day for drivers under 25 (EUR)'),
('second_driver_fee', '50', 'number', 'Flat fee for second driver (EUR)'),
('deposit_percentage', '20', 'number', 'Deposit percentage of total booking'),
('office_hours_open', '08:00', 'string', 'Office opening time'),
('office_hours_close', '20:00', 'string', 'Office closing time'),
('after_hours_fee', '30', 'number', 'Extra fee for after-hours pickup/delivery (EUR)'),
('currency', 'EUR', 'string', 'Default currency'),
('tax_rate', '0', 'number', 'Tax rate percentage (IVA)'),
('company_phone', '+10000000000', 'string', 'Company phone and WhatsApp'),
('company_email', 'info@rentinfra.com', 'string', 'Company contact email'),
('company_address', '123 Example Street, Suite 100, 00000 Demo City, Demo Country', 'string', 'Company address');

-- Locations
INSERT INTO public.locations (name_en, name_es, type, address, extra_fee) VALUES
('Our Office – Downtown', 'Nuestra Oficina – Centro', 'office', '123 Example Street, Suite 100, 00000 Demo City', 0),
('Demo Airport (XXX)', 'Aeropuerto Demo (XXX)', 'airport', 'Demo Airport, 00000 Demo City', 30),
('Hotel Delivery – Local Area', 'Entrega en Hotel – Zona Local', 'hotel_delivery', 'Demo City and surrounding area', 15);

-- Sample Cars
INSERT INTO public.cars (slug, make, model, year, category, transmission, fuel_type, seats, doors, luggage_small, luggage_large, ac, bluetooth, description_en, description_es) VALUES
('renault-clio-2023', 'Renault', 'Clio', 2023, 'economy', 'manual', 'petrol', 5, 4, 1, 1, true, true,
 'Perfect for city driving and coastal roads. Fuel-efficient and easy to park anywhere.',
 'Perfecto para conducir por la ciudad y las carreteras costeras. Eficiente en combustible y fácil de aparcar.'),
('toyota-rav4-2023', 'Toyota', 'RAV4', 2023, 'suv', 'auto', 'hybrid', 5, 5, 2, 2, true, true,
 'Spacious and comfortable SUV perfect for families. Hybrid engine for lower fuel costs on long drives.',
 'SUV espacioso y cómodo, perfecto para familias. Motor híbrido para reducir costes en trayectos largos.'),
('mercedes-c-class-2023', 'Mercedes-Benz', 'C-Class', 2023, 'luxury', 'auto', 'petrol', 5, 4, 1, 2, true, true,
 'Experience your destination in style. Premium comfort and performance for a truly memorable trip.',
 'Vive tu destino con estilo. Máximo confort y rendimiento para un viaje inolvidable.');

-- Price lists for each car
INSERT INTO public.price_lists (car_id, name, daily_rate, is_active)
SELECT id, 'Standard Rate', 45.00, true FROM public.cars WHERE slug = 'renault-clio-2023';

INSERT INTO public.price_lists (car_id, name, daily_rate, is_active)
SELECT id, 'Standard Rate', 85.00, true FROM public.cars WHERE slug = 'toyota-rav4-2023';

INSERT INTO public.price_lists (car_id, name, daily_rate, is_active)
SELECT id, 'Standard Rate', 150.00, true FROM public.cars WHERE slug = 'mercedes-c-class-2023';

-- Discounts for Renault Clio
INSERT INTO public.price_list_discounts (price_list_id, min_days, max_days, discount_type, discount_value, label_en, label_es)
SELECT id, 3, 6, 'percentage', 10, '3-6 days: 10% off', '3-6 días: 10% descuento' FROM public.price_lists WHERE name = 'Standard Rate' AND car_id = (SELECT id FROM public.cars WHERE slug = 'renault-clio-2023');

INSERT INTO public.price_list_discounts (price_list_id, min_days, max_days, discount_type, discount_value, label_en, label_es)
SELECT id, 7, NULL, 'percentage', 20, '7+ days: 20% off', '7+ días: 20% descuento' FROM public.price_lists WHERE name = 'Standard Rate' AND car_id = (SELECT id FROM public.cars WHERE slug = 'renault-clio-2023');

-- Discounts for RAV4
INSERT INTO public.price_list_discounts (price_list_id, min_days, max_days, discount_type, discount_value, label_en, label_es)
SELECT id, 3, 6, 'percentage', 10, '3-6 days: 10% off', '3-6 días: 10% descuento' FROM public.price_lists WHERE name = 'Standard Rate' AND car_id = (SELECT id FROM public.cars WHERE slug = 'toyota-rav4-2023');

INSERT INTO public.price_list_discounts (price_list_id, min_days, max_days, discount_type, discount_value, label_en, label_es)
SELECT id, 7, NULL, 'percentage', 20, '7+ days: 20% off', '7+ días: 20% descuento' FROM public.price_lists WHERE name = 'Standard Rate' AND car_id = (SELECT id FROM public.cars WHERE slug = 'toyota-rav4-2023');

-- Discounts for Mercedes
INSERT INTO public.price_list_discounts (price_list_id, min_days, max_days, discount_type, discount_value, label_en, label_es)
SELECT id, 3, 6, 'percentage', 10, '3-6 days: 10% off', '3-6 días: 10% descuento' FROM public.price_lists WHERE name = 'Standard Rate' AND car_id = (SELECT id FROM public.cars WHERE slug = 'mercedes-c-class-2023');

INSERT INTO public.price_list_discounts (price_list_id, min_days, max_days, discount_type, discount_value, label_en, label_es)
SELECT id, 7, NULL, 'percentage', 20, '7+ days: 20% off', '7+ días: 20% descuento' FROM public.price_lists WHERE name = 'Standard Rate' AND car_id = (SELECT id FROM public.cars WHERE slug = 'mercedes-c-class-2023');

-- Global Addons
INSERT INTO public.addons (name_en, name_es, description_en, description_es, icon, pricing_type, price, is_global) VALUES
('GPS Navigation', 'Navegador GPS', 'Portable GPS device with latest maps', 'Dispositivo GPS portátil con mapas actualizados', 'navigation', 'per_day', 5.00, true),
('Baby Seat', 'Silla de bebé', 'Approved child safety seat (0-13kg)', 'Silla de seguridad infantil homologada (0-13kg)', 'baby', 'flat', 20.00, true),
('Booster Seat', 'Silla elevadora', 'Child booster seat (15-36kg)', 'Silla elevadora infantil (15-36kg)', 'armchair', 'flat', 15.00, true),
('Additional Driver', 'Conductor adicional', 'Add an extra authorised driver', 'Añade un conductor autorizado adicional', 'user-plus', 'flat', 50.00, true),
('Full Insurance', 'Seguro a todo riesgo', 'Full coverage with zero excess', 'Cobertura total con franquicia cero', 'shield', 'per_day', 15.00, true);
