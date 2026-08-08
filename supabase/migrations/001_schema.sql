-- ============================================================
-- RentInfra — full database schema
-- ============================================================
--
-- Consolidated from what were previously 13 incremental migrations
-- (001–005, 007–014) into one file for fresh installs. Applied in
-- order below, matching the original migration sequence, so any
-- later ALTER/DROP POLICY/etc. against an earlier CREATE still
-- resolves correctly in a single pass.
--
-- Demo-only sample data (cars, bookings, photos) is a separate,
-- optional file: demo_seed.sql. Skip it for a real deployment.
-- ============================================================

-- ── from 001_initial_schema.sql ──────────────────────────────────────────
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

-- ── from 002_blog_faq.sql ──────────────────────────────────────────
-- ============================================================
-- Blog Posts
-- ============================================================
CREATE TABLE public.blog_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title_en TEXT NOT NULL,
  title_es TEXT NOT NULL,
  excerpt_en TEXT,
  excerpt_es TEXT,
  content_en TEXT,
  content_es TEXT,
  cover_image TEXT,
  author TEXT DEFAULT 'RentInfra',
  tags TEXT[],
  is_published BOOLEAN DEFAULT TRUE,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER blog_posts_updated_at BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blog_public_read" ON public.blog_posts FOR SELECT USING (is_published = TRUE);
CREATE POLICY "blog_admin_all" ON public.blog_posts FOR ALL USING (is_admin());

CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX idx_blog_posts_published ON public.blog_posts(is_published, published_at DESC);

-- ============================================================
-- FAQs
-- ============================================================
CREATE TABLE public.faqs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  question_en TEXT NOT NULL,
  question_es TEXT NOT NULL,
  answer_en TEXT NOT NULL,
  answer_es TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "faqs_public_read" ON public.faqs FOR SELECT USING (is_active = TRUE);
CREATE POLICY "faqs_admin_all" ON public.faqs FOR ALL USING (is_admin());

-- ============================================================
-- Add social media + extra settings
-- ============================================================
INSERT INTO public.settings (key, value, type, description) VALUES
('social_facebook', 'https://facebook.com/rentinfra', 'string', 'Facebook page URL'),
('social_instagram', 'https://instagram.com/rentinfra', 'string', 'Instagram profile URL'),
('social_tiktok', 'https://tiktok.com/@rentinfra', 'string', 'TikTok profile URL'),
('social_whatsapp', 'https://wa.me/10000000000', 'string', 'WhatsApp link')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- Seed Blog Posts (generic placeholder content — replace with your own)
-- ============================================================
INSERT INTO public.blog_posts (slug, title_en, title_es, excerpt_en, excerpt_es, content_en, content_es, cover_image, tags) VALUES
(
  'best-scenic-drives',
  'The 5 Best Scenic Drives Near You',
  'Las 5 Mejores Rutas Escénicas Cerca de Ti',
  'Discover the most breathtaking coastal roads and mountain passes in the region — perfect for your rental car adventure.',
  'Descubre las carreteras costeras y puertos de montaña más impresionantes de la región, perfectos para tu aventura en coche de alquiler.',
  '<h2>1. The Mountain Pass Road</h2><p>One of the most dramatic drives in the region, this route winds up through the mountains to a legendary hilltop town. With sheer cliff faces, ancient bridges and panoramic valleys, this scenic route is a must for any visitor.</p><h2>2. The Coastal Boulevard</h2><p>Cruise the glamorous coastal stretch lined with palm trees, luxury hotels and designer boutiques for an iconic coastal drive.</p><h2>3. The Village Climb</h2><p>Just a short drive from the coast, the climb up to a charming whitewashed hillside village offers spectacular views over the water.</p><h2>4. The Lookout Road</h2><p>Wind up from the valley floor to a charming hilltop village. The views over the coast from high altitude are simply unforgettable.</p><h2>5. The Cross-Border Day Trip</h2><p>A short highway drive takes you to a neighboring town in under an hour — a unique day trip experience.</p><p>All of these routes are easily accessible from our demo location. <a href="/cars">Book your rental car today</a> and start exploring.</p>',
  '<h2>1. La Carretera de Montaña</h2><p>Uno de los recorridos más dramáticos de la región, esta ruta serpentea hasta un legendario pueblo en lo alto. Con acantilados verticales, puentes antiguos y valles panorámicos, esta ruta escénica es imprescindible.</p><h2>2. El Bulevar Costero</h2><p>Recorre el glamuroso tramo costero con bulevares de palmeras, hoteles de lujo y boutiques de diseño para un icónico paseo costero.</p><h2>3. La Subida al Pueblo</h2><p>A poca distancia de la costa, el ascenso hasta un encantador pueblo blanco de montaña ofrece vistas espectaculares sobre el mar.</p><h2>4. La Carretera del Mirador</h2><p>Sube desde el valle hasta un encantador pueblo en lo alto. Las vistas sobre la costa desde gran altitud son simplemente inolvidables.</p><h2>5. La Excursión de un Día</h2><p>Un breve trayecto por autopista te lleva a una localidad vecina en menos de una hora, una experiencia única de un día.</p>',
  'https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=1200&q=80',
  ARRAY['driving', 'road trip', 'scenic routes']
),
(
  'guide-to-old-town',
  'A Complete Guide to the Historic Old Town',
  'Guía Completa del Casco Antiguo',
  'Explore the cobblestone streets, orange-blossom squares and hidden tapas bars of the historic old town — best explored with your own rental car.',
  'Explora las calles empedradas, las plazas con naranjos y los bares de tapas escondidos del casco histórico.',
  '<h2>The Heart of the Old Town</h2><p>Tucked behind the gleaming marina and modern hotels, the historic Old Town is a maze of whitewashed houses draped in bougainvillea, narrow cobblestone lanes, and sun-drenched plazas. It''s one of the most beautifully preserved historic centres in the region.</p><h2>The Central Square</h2><p>The centrepiece of the old town, the central square dates back centuries. Surrounded by historic buildings, outdoor restaurants and the town hall, it''s the perfect place to start your exploration over a coffee.</p><h2>The Old Town Churches</h2><p>Don''t miss the historic church, built on the site of a former place of worship. Nearby you''ll find one of the oldest buildings in the area.</p><h2>Best Tapas Bars</h2><p>Wander away from the main square to find authentic tapas bars frequented by locals for some of the best local dishes on the coast.</p><h2>Getting There</h2><p>The Old Town is just a short drive from our demo location. With a <a href="/cars">rental car from RentInfra</a>, you can park nearby and walk into the old town in minutes.</p>',
  '<h2>El Corazón del Casco Antiguo</h2><p>Escondido detrás de la brillante marina y los hoteles modernos, el Casco Antiguo es un laberinto de casas encaladas adornadas con buganvillas, callejuelas empedradas y plazas soleadas.</p><h2>La Plaza Central</h2><p>El corazón del casco antiguo, la plaza central data de hace siglos. Rodeada de edificios históricos, restaurantes al aire libre y el ayuntamiento, es el lugar perfecto para comenzar tu exploración.</p><h2>Las Iglesias del Casco Antiguo</h2><p>No te pierdas la iglesia histórica, construida sobre el emplazamiento de un antiguo lugar de culto.</p><h2>Mejores Bares de Tapas</h2><p>Aléjate de la plaza principal para encontrar auténticos bares de tapas frecuentados por locales.</p><h2>Cómo Llegar</h2><p>El Casco Antiguo está a poca distancia de nuestra ubicación demo. Con un <a href="/cars">coche de alquiler de RentInfra</a>, puedes aparcar y entrar andando en pocos minutos.</p>',
  'https://images.unsplash.com/photo-1555993539-1732b0258235?w=1200&q=80',
  ARRAY['old town', 'sightseeing', 'culture']
),
(
  'airport-to-downtown-transfer-guide',
  'Airport to Downtown: Your Complete Transfer Guide',
  'Aeropuerto al Centro: Tu Guía Completa de Traslado',
  'Everything you need to know about getting from the airport to downtown — including why renting a car is the smartest choice.',
  'Todo lo que necesitas saber sobre cómo llegar desde el aeropuerto al centro, incluyendo por qué alquilar un coche es la opción más inteligente.',
  '<h2>Distance & Time</h2><p>The demo airport is located approximately 60km from downtown. By car, the journey takes around 45–55 minutes via the toll motorway, or 60–75 minutes via the free coastal road.</p><h2>Your Transfer Options</h2><h3>Rental Car — The Best Option</h3><p>Renting a car at the airport gives you complete freedom from the moment you land. With <a href="/">RentInfra</a>, we can deliver your car directly to the airport arrivals hall, so you can drive straight to your hotel or villa. No waiting for transfers, no fixed schedules.</p><h3>Taxi</h3><p>A taxi from the airport to downtown costs approximately €80–€100 and takes around 50 minutes. It''s convenient but expensive, especially for families or longer stays.</p><h3>Bus</h3><p>A local bus company operates a direct service from the airport to the downtown bus station. Journey time is approximately 45 minutes and costs around €10. Services run regularly throughout the day.</p><h2>Tips for Your Arrival</h2><ul><li>The toll road is faster and costs approximately €4–€6</li><li>Traffic can be heavy during peak season — allow extra time</li><li>Fuel stations are available just outside the airport</li></ul><h2>Book Your Airport Car Rental</h2><p>RentInfra offers airport delivery with no extra hassle. <a href="/cars">Browse our fleet</a> and select the airport as your pickup location when booking.</p>',
  '<h2>Distancia y Tiempo</h2><p>El aeropuerto demo está situado a aproximadamente 60 km del centro. En coche, el trayecto dura unos 45-55 minutos por la autopista de peaje, o 60-75 minutos por la carretera costera gratuita.</p><h2>Tus Opciones de Traslado</h2><h3>Coche de Alquiler — La Mejor Opción</h3><p>Alquilar un coche en el aeropuerto te da libertad total desde el momento en que aterrizas. Con <a href="/">RentInfra</a>, podemos entregar tu coche directamente en la terminal de llegadas.</p><h3>Taxi</h3><p>Un taxi desde el aeropuerto al centro cuesta aproximadamente €80-€100 y tarda unos 50 minutos.</p><h3>Autobús</h3><p>Una compañía de autobuses local opera un servicio directo desde el aeropuerto hasta la estación de autobuses del centro. El tiempo de trayecto es de aproximadamente 45 minutos y cuesta unos €10.</p><h2>Reserva tu Coche de Alquiler en el Aeropuerto</h2><p>RentInfra ofrece entrega en el aeropuerto. <a href="/cars">Consulta nuestra flota</a> y selecciona el aeropuerto como lugar de recogida al reservar.</p>',
  'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=80',
  ARRAY['airport', 'transfer', 'travel tips']
);

-- ============================================================
-- Seed FAQs (generic placeholder content — replace with your own)
-- ============================================================
INSERT INTO public.faqs (question_en, question_es, answer_en, answer_es, category, position) VALUES
(
  'What documents do I need to rent a car?',
  '¿Qué documentos necesito para alquilar un coche?',
  'You need a valid driving licence (held for at least 1 year), a passport or national ID card, and a credit or debit card in the driver''s name. International visitors may also need an International Driving Permit if their licence is not in Roman script.',
  'Necesitas un permiso de conducción válido (con al menos 1 año de antigüedad), un pasaporte o DNI, y una tarjeta de crédito o débito a nombre del conductor.',
  'requirements', 1
),
(
  'What is the minimum age to rent a car?',
  '¿Cuál es la edad mínima para alquilar un coche?',
  'The minimum age to rent a car with RentInfra is 21 years old. Drivers aged 21–24 may be subject to a young driver surcharge. This can be configured by our team.',
  'La edad mínima para alquilar un coche con RentInfra es de 21 años. Los conductores de entre 21 y 24 años pueden estar sujetos a un suplemento por conductor joven.',
  'requirements', 2
),
(
  'Do you offer airport pickup and delivery?',
  '¿Ofrecéis recogida y entrega en el aeropuerto?',
  'Yes! We deliver cars directly to the airport arrivals hall and can also collect from there. An additional delivery fee applies. You can select airport pickup when making your booking.',
  'Sí. Entregamos coches directamente en la terminal de llegadas del aeropuerto y también podemos recogerlos allí. Se aplica una tarifa adicional de entrega.',
  'delivery', 3
),
(
  'Can you deliver the car to my hotel?',
  '¿Podéis entregar el coche en mi hotel?',
  'Absolutely. We offer hotel delivery throughout the local area and surrounding areas. Enter your hotel name and address during booking and we will arrange delivery at your chosen time.',
  'Por supuesto. Ofrecemos entrega en hotel en toda la zona local y alrededores.',
  'delivery', 4
),
(
  'What is included in the rental price?',
  '¿Qué está incluido en el precio del alquiler?',
  'The rental price includes basic third-party insurance, unlimited mileage, and 24/7 roadside assistance. Additional insurance (zero excess), GPS, child seats and other extras can be added during booking.',
  'El precio del alquiler incluye seguro básico a terceros, kilometraje ilimitado y asistencia en carretera 24/7. Se pueden añadir extras como seguro a todo riesgo, GPS y sillas infantiles durante la reserva.',
  'pricing', 5
),
(
  'How do I find my booking if I didn''t create an account?',
  '¿Cómo encuentro mi reserva si no creé una cuenta?',
  'No account needed. When you complete a booking, you receive a unique reference number (e.g. RIF-2026-00001). Go to the "My Booking" page on our website, enter your reference number and the email address used at booking to view your reservation details.',
  'No necesitas cuenta. Cuando completas una reserva, recibes un número de referencia único. Ve a la página "Mi Reserva" de nuestro sitio web, introduce tu número de referencia y el correo electrónico usado al reservar.',
  'bookings', 6
),
(
  'Can I cancel or modify my booking?',
  '¿Puedo cancelar o modificar mi reserva?',
  'Yes. Please contact us as soon as possible by phone or WhatsApp at +1 000 000 0000. Cancellation policies depend on the notice period given. Our team will be happy to assist with any changes.',
  'Sí. Por favor, contáctanos lo antes posible por teléfono o WhatsApp al +1 000 000 0000. Las políticas de cancelación dependen del plazo de aviso.',
  'bookings', 7
),
(
  'Is there a deposit required?',
  '¿Se requiere un depósito?',
  'A security deposit is required at the time of vehicle collection. The amount depends on the vehicle category and insurance option selected. The deposit is fully refunded upon safe return of the vehicle.',
  'Se requiere un depósito de seguridad en el momento de la recogida del vehículo. El importe depende de la categoría del vehículo y la opción de seguro seleccionada. El depósito se devuelve íntegramente al devolver el vehículo en buen estado.',
  'pricing', 8
),
(
  'Do you have electric or hybrid cars?',
  '¿Tenéis coches eléctricos o híbridos?',
  'Yes, we have hybrid vehicles in our fleet, including the Toyota RAV4 Hybrid. We are continuously expanding our eco-friendly options. Check our fleet page for the latest availability.',
  'Sí, disponemos de vehículos híbridos en nuestra flota, incluido el Toyota RAV4 Híbrido. Continuamos ampliando nuestras opciones ecológicas.',
  'fleet', 9
),
(
  'What happens if I have an accident or breakdown?',
  '¿Qué ocurre si tengo un accidente o avería?',
  'All our vehicles come with 24/7 roadside assistance. In case of an accident, contact local emergency services first, then call us immediately at +1 000 000 0000. Do not move the vehicle until instructed.',
  'Todos nuestros vehículos incluyen asistencia en carretera 24/7. En caso de accidente, contacta primero con los servicios de emergencia locales y luego llámanos al +1 000 000 0000.',
  'support', 10
);

-- ── from 003_settings_expansion.sql ──────────────────────────────────────────
-- ============================================================
-- Migration 003: Expand settings for full admin settings panel
-- ============================================================

INSERT INTO public.settings (key, value, type, description) VALUES

-- General
('company_name',        'RentInfra Demo',                          'string',  'Business trading name'),
('company_website',     'https://rentinfra.com',               'string',  'Public website URL'),
('google_maps_url',     '',                                        'string',  'Google Maps link to office'),

-- Booking Policy
('min_advance_hours',       '2',    'number',  'Minimum hours in advance a booking can be made'),
('max_booking_days_ahead',  '365',  'number',  'Maximum days ahead a booking can be made'),
('cancellation_policy_en',  'Free cancellation up to 48 hours before pickup. Cancellations within 48 hours forfeit the deposit.', 'string', 'Cancellation policy text (English)'),
('cancellation_policy_es',  'Cancelación gratuita hasta 48 horas antes de la recogida. Las cancelaciones en menos de 48 horas pierden el depósito.', 'string', 'Cancellation policy text (Spanish)'),
('terms_last_updated',      '2025-01-01', 'string', 'Date terms & conditions were last updated'),

-- Notifications
('notify_admin_email',      'info@rentinfra.com', 'string',  'Email address that receives new booking alerts'),
('notify_new_booking',      'true',   'boolean', 'Send email alert to admin on new booking'),
('notify_booking_confirm',  'true',   'boolean', 'Send confirmation email to customer on booking'),
('notify_whatsapp_enabled', 'false',  'boolean', 'Send WhatsApp message to customer on booking'),
('smtp_from_name',          'RentInfra Demo', 'string', 'Sender name for outgoing emails'),
('smtp_from_email',         'noreply@rentinfra.com', 'string', 'Sender email address for outgoing emails')

ON CONFLICT (key) DO NOTHING;

-- ── from 004_car_images_storage.sql ──────────────────────────────────────────
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

-- ── from 005_booking_contract_fields.sql ──────────────────────────────────────────
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

-- ── from 007_testimonials.sql ──────────────────────────────────────────
-- ============================================================
-- 007_testimonials.sql — customer reviews
-- ============================================================
-- Replaces the hardcoded placeholder testimonials that used to be
-- compiled into the homepage. Reviews are now real records managed
-- from /admin/testimonials, and the homepage section hides itself
-- entirely when there are no published rows — so a fresh install
-- ships with no invented social proof.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  author_name TEXT NOT NULL,
  author_country TEXT,               -- free text, e.g. 'United Kingdom'
  author_country_emoji TEXT,         -- optional flag emoji, e.g. '🇬🇧'
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  quote TEXT NOT NULL,
  car_id UUID REFERENCES public.cars(id) ON DELETE SET NULL,
  car_label TEXT,                    -- fallback when the car record is gone
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS testimonials_published_idx
  ON public.testimonials (is_published, position);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Anyone may read published reviews; only admins see drafts.
DROP POLICY IF EXISTS "Published testimonials are viewable by everyone" ON public.testimonials;
CREATE POLICY "Published testimonials are viewable by everyone"
  ON public.testimonials FOR SELECT
  USING (is_published = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage testimonials" ON public.testimonials;
CREATE POLICY "Admins manage testimonials"
  ON public.testimonials FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------
-- Homepage social-proof figures.
-- Both default to empty: the homepage renders the stat strip only
-- when they are filled in, so nobody ships fabricated numbers.
-- ------------------------------------------------------------
INSERT INTO public.settings (key, value, type, description) VALUES
  ('social_proof_rating', '', 'string', 'Average review score shown on the homepage, e.g. "4.9". Leave empty to hide.'),
  ('social_proof_count',  '', 'string', 'Number of reviews behind that score, e.g. "120". Leave empty to hide.'),
  ('hero_headline_en',    '', 'string', 'Optional homepage headline override (EN). Leave empty to use the default.'),
  ('hero_headline_es',    '', 'string', 'Optional homepage headline override (ES). Leave empty to use the default.')
ON CONFLICT (key) DO NOTHING;

-- ── from 008_availability.sql ──────────────────────────────────────────
-- ============================================================
-- 008_availability.sql — public availability without leaking bookings
-- ============================================================
-- RLS on `bookings` only lets a user see their own rows, which is correct:
-- guest names, emails and phone numbers must never be public. But it means
-- an anonymous visitor querying `bookings` to work out which cars are free
-- gets an empty result, so every car looks available and the customer only
-- discovers the clash when the booking API refuses at the last step.
--
-- This function exposes the one fact the public site legitimately needs —
-- which car is occupied between which dates — and nothing else. No guest
-- details, no prices, no reference numbers.
-- ============================================================

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
    -- Strict inequalities: a car returned on the 14th can go out again on
    -- the 14th. Same-day turnaround is normal and the handover is sequenced
    -- by pickup/return times at the counter.
    AND b.pickup_date  < end_date
    AND b.dropoff_date > start_date;
$$;

REVOKE ALL ON FUNCTION public.get_car_availability(DATE, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_car_availability(DATE, DATE) TO anon, authenticated;

COMMENT ON FUNCTION public.get_car_availability(DATE, DATE) IS
  'Occupied date ranges per car for a window. SECURITY DEFINER so the public '
  'site can compute availability without read access to booking records.';

-- ============================================================
-- Structural protection against double-booking
-- ============================================================
-- The application checks availability before inserting, but that is a
-- read-then-write: two concurrent requests can both pass the check and both
-- insert. This constraint makes an overlapping booking impossible at the
-- database level, whatever the application does.
--
-- '[)' means the range includes the pickup day and excludes the dropoff day,
-- which is what allows same-day turnaround.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_no_overlap;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_no_overlap
  EXCLUDE USING gist (
    car_id WITH =,
    daterange(pickup_date, dropoff_date, '[)') WITH &&
  )
  WHERE (status IN ('pending', 'confirmed', 'active'));

-- ── from 009_booking_holds.sql ──────────────────────────────────────────
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

-- ── from 010_secret_settings.sql ──────────────────────────────────────────
-- ============================================================
-- 010_secret_settings.sql — safe storage for API keys
-- ============================================================
-- Integration credentials (Resend, Stripe) are managed from the admin panel
-- rather than environment variables, so they live in `settings`. But that
-- table is world-readable:
--
--   CREATE POLICY "settings_public_read" ON settings FOR SELECT USING (TRUE);
--
-- and getSettingsMap() hands the whole map to client components such as the
-- navbar. A secret key stored there would be published to every visitor.
--
-- This marks which rows are secret, hides them from everyone except admins,
-- and leaves the public rows (company name, phone, opening hours) readable as
-- before so the public site keeps working.
-- ============================================================

ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS is_secret BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.settings.is_secret IS
  'Never expose this value to non-admins. Read it server-side via getSecret().';

-- Replace the blanket public read with one that withholds secrets.
DROP POLICY IF EXISTS "settings_public_read" ON public.settings;
CREATE POLICY "settings_public_read" ON public.settings
  FOR SELECT USING (is_secret = FALSE OR public.is_admin());

-- ------------------------------------------------------------
-- Integration credentials. All start empty and inactive: a fresh install
-- sends no email and takes no payments until someone fills these in.
-- ------------------------------------------------------------
INSERT INTO public.settings (key, value, type, description, is_secret) VALUES
  -- Email (Resend)
  ('resend_api_key',      '', 'string',  'Resend API key. Create one at resend.com/api-keys.', TRUE),
  ('email_enabled',       'false', 'boolean', 'Send booking emails. Requires a working Resend API key.', FALSE),
  ('email_from_address',  '', 'string',  'Address emails are sent from. Must be on a domain verified in Resend.', FALSE),

  -- Payments (Stripe)
  ('stripe_secret_key',      '', 'string',  'Stripe secret key (sk_live_… or sk_test_…). Never shown in full once saved.', TRUE),
  ('stripe_webhook_secret',  '', 'string',  'Stripe webhook signing secret (whsec_…).', TRUE),
  ('stripe_publishable_key', '', 'string',  'Stripe publishable key (pk_live_… or pk_test_…). Safe to expose.', FALSE),
  ('payments_enabled',       'false', 'boolean', 'Collect payment during booking. Requires working Stripe keys.', FALSE)
ON CONFLICT (key) DO NOTHING;

-- Any credential added later by another migration should also be marked.
UPDATE public.settings
SET is_secret = TRUE
WHERE key IN ('resend_api_key', 'stripe_secret_key', 'stripe_webhook_secret')
  AND is_secret = FALSE;

-- ── from 011_notification_delivery.sql ──────────────────────────────────────────
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

-- ── from 012_vehicle_types.sql ──────────────────────────────────────────
-- ============================================================
-- 012_vehicle_types.sql — motorbikes and bicycles
-- ============================================================
-- The fleet was cars only: `category` was constrained to economy/suv/luxury
-- and `transmission` was NOT NULL, neither of which means anything for a
-- pedal bicycle.
--
-- Rather than duplicate the booking, pricing and availability stack per
-- vehicle kind, this keeps one table and adds `vehicle_type`. Car-only
-- columns become optional, and categories are validated per type.
--
-- Existing rows are all cars, so the backfill is unambiguous.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Vehicle type
-- ------------------------------------------------------------
ALTER TABLE public.cars
  ADD COLUMN IF NOT EXISTS vehicle_type TEXT NOT NULL DEFAULT 'car';

ALTER TABLE public.cars DROP CONSTRAINT IF EXISTS cars_vehicle_type_check;
ALTER TABLE public.cars
  ADD CONSTRAINT cars_vehicle_type_check
  CHECK (vehicle_type IN ('car', 'motorbike', 'bicycle'));

COMMENT ON COLUMN public.cars.vehicle_type IS
  'car | motorbike | bicycle. Drives which specs and rental rules apply.';

-- ------------------------------------------------------------
-- 2. Categories now depend on the type
-- ------------------------------------------------------------
ALTER TABLE public.cars DROP CONSTRAINT IF EXISTS cars_category_check;
ALTER TABLE public.cars
  ADD CONSTRAINT cars_category_check CHECK (
    (vehicle_type = 'car'       AND category IN ('economy', 'suv', 'luxury')) OR
    (vehicle_type = 'motorbike' AND category IN ('scooter', 'motorcycle', 'touring')) OR
    (vehicle_type = 'bicycle'   AND category IN ('city', 'mountain', 'electric', 'road'))
  );

-- ------------------------------------------------------------
-- 3. Car-only fields become optional
-- ------------------------------------------------------------
-- A bicycle has no transmission. Keep the allowed values for vehicles that
-- do have one, but let it be null.
ALTER TABLE public.cars ALTER COLUMN transmission DROP NOT NULL;

ALTER TABLE public.cars DROP CONSTRAINT IF EXISTS cars_transmission_check;
ALTER TABLE public.cars
  ADD CONSTRAINT cars_transmission_check
  CHECK (transmission IS NULL OR transmission IN ('auto', 'manual'));

-- Bicycles are not petrol or diesel; motorbikes may be electric.
ALTER TABLE public.cars DROP CONSTRAINT IF EXISTS cars_fuel_type_check;
ALTER TABLE public.cars
  ADD CONSTRAINT cars_fuel_type_check
  CHECK (fuel_type IS NULL OR fuel_type IN ('petrol', 'diesel', 'electric', 'hybrid', 'none'));

-- ------------------------------------------------------------
-- 4. Specs that only make sense for two-wheelers
-- ------------------------------------------------------------
ALTER TABLE public.cars
  ADD COLUMN IF NOT EXISTS engine_cc      INTEGER,  -- motorbikes
  ADD COLUMN IF NOT EXISTS frame_size     TEXT,     -- bicycles: S/M/L or cm
  ADD COLUMN IF NOT EXISTS gears          INTEGER,  -- bicycles
  ADD COLUMN IF NOT EXISTS helmet_included BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.cars.engine_cc IS 'Motorbike engine displacement in cc.';
COMMENT ON COLUMN public.cars.frame_size IS 'Bicycle frame size, e.g. S / M / L or 54cm.';

-- ------------------------------------------------------------
-- 5. Which rules apply to which type
-- ------------------------------------------------------------
-- A pedal bicycle needs no driving licence, no minimum driver age and no
-- young-driver surcharge. Storing this on the row keeps the pricing engine
-- and the booking wizard from hardcoding vehicle rules.
ALTER TABLE public.cars
  ADD COLUMN IF NOT EXISTS requires_license BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS min_rider_age    INTEGER;

COMMENT ON COLUMN public.cars.requires_license IS
  'False for bicycles: no licence, no minimum age, no young-driver surcharge.';
COMMENT ON COLUMN public.cars.min_rider_age IS
  'Overrides the global min_driver_age. NULL means use the global setting.';

UPDATE public.cars SET requires_license = FALSE WHERE vehicle_type = 'bicycle';

-- ------------------------------------------------------------
-- 6. Hourly hire
-- ------------------------------------------------------------
-- Bikes are commonly rented by the hour or half-day, so a price list needs to
-- say what its rate buys. Existing lists are daily.
ALTER TABLE public.price_lists
  ADD COLUMN IF NOT EXISTS rate_unit    TEXT NOT NULL DEFAULT 'day',
  ADD COLUMN IF NOT EXISTS hourly_rate  NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS min_hours    INTEGER;

ALTER TABLE public.price_lists DROP CONSTRAINT IF EXISTS price_lists_rate_unit_check;
ALTER TABLE public.price_lists
  ADD CONSTRAINT price_lists_rate_unit_check CHECK (rate_unit IN ('day', 'hour'));

COMMENT ON COLUMN public.price_lists.rate_unit IS
  'What daily_rate represents. "hour" lists also set hourly_rate and min_hours.';

-- Bookings need to record an hourly hire.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS rental_unit  TEXT NOT NULL DEFAULT 'day',
  ADD COLUMN IF NOT EXISTS total_hours  INTEGER;

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_rental_unit_check;
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_rental_unit_check CHECK (rental_unit IN ('day', 'hour'));

-- ------------------------------------------------------------
-- 7. Addons can be limited to a vehicle type
-- ------------------------------------------------------------
-- A child seat is meaningless on a bicycle and a helmet is meaningless in a
-- car. NULL keeps an addon global, matching how is_global already works.
ALTER TABLE public.addons
  ADD COLUMN IF NOT EXISTS vehicle_type TEXT;

ALTER TABLE public.addons DROP CONSTRAINT IF EXISTS addons_vehicle_type_check;
ALTER TABLE public.addons
  ADD CONSTRAINT addons_vehicle_type_check
  CHECK (vehicle_type IS NULL OR vehicle_type IN ('car', 'motorbike', 'bicycle'));

COMMENT ON COLUMN public.addons.vehicle_type IS
  'Limits an addon to one vehicle type. NULL means it applies to all.';

INSERT INTO public.addons (name_en, name_es, description_en, description_es, pricing_type, price, is_global, is_active, vehicle_type) VALUES
  ('Helmet',            'Casco',              'DOT-approved helmet in your size.',        'Casco homologado en tu talla.',            'flat',    0.00, TRUE, TRUE, 'motorbike'),
  ('Top box',           'Baúl',               'Lockable rear storage box.',               'Baúl trasero con cerradura.',              'per_day', 5.00, TRUE, TRUE, 'motorbike'),
  ('Bike lock',         'Candado',            'Heavy-duty D-lock and cable.',             'Candado en U reforzado con cable.',        'flat',    0.00, TRUE, TRUE, 'bicycle'),
  ('Bicycle helmet',    'Casco de bicicleta', 'Adjustable helmet, all sizes.',            'Casco ajustable, todas las tallas.',       'flat',    0.00, TRUE, TRUE, 'bicycle'),
  ('Pannier bags',      'Alforjas',           'Pair of waterproof rear panniers.',        'Par de alforjas impermeables.',            'per_day', 4.00, TRUE, TRUE, 'bicycle')
ON CONFLICT DO NOTHING;

-- Existing car-specific addons stay car-only so they stop appearing on bikes.
UPDATE public.addons
SET vehicle_type = 'car'
WHERE vehicle_type IS NULL
  AND name_en IN ('Child Seat', 'Baby Seat', 'GPS Navigation', 'Additional Driver', 'Second Driver');

-- ------------------------------------------------------------
-- 8. Index for type filtering on the public fleet
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS cars_vehicle_type_idx
  ON public.cars (vehicle_type, is_active);

-- Booster seats are car-only too (the seed uses this name rather than 'Child Seat').
UPDATE public.addons SET vehicle_type = 'car'
WHERE vehicle_type IS NULL AND name_en IN ('Booster Seat');

-- ── from 013_payments.sql ──────────────────────────────────────────
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

-- ── from 014_condition_reports.sql ──────────────────────────────────────────
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

