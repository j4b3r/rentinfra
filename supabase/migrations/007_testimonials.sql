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
