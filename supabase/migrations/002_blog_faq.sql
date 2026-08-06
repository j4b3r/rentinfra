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
