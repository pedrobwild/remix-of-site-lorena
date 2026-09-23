CREATE TABLE IF NOT EXISTS public.image_alt_texts (
  url text PRIMARY KEY,
  alt text NOT NULL,
  model text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.image_alt_texts TO anon;
GRANT SELECT ON public.image_alt_texts TO authenticated;
GRANT ALL ON public.image_alt_texts TO service_role;

ALTER TABLE public.image_alt_texts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "alt_public_read" ON public.image_alt_texts;
CREATE POLICY "alt_public_read" ON public.image_alt_texts FOR SELECT USING (true);

DROP POLICY IF EXISTS "alt_admin_write" ON public.image_alt_texts;
CREATE POLICY "alt_admin_write" ON public.image_alt_texts FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());