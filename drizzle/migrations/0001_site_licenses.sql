CREATE TABLE public.site_licenses (
  slug text PRIMARY KEY,
  name text NOT NULL,
  title text,
  intro text,
  body text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by_email text
);
GRANT SELECT ON public.site_licenses TO anon, authenticated;
GRANT UPDATE ON public.site_licenses TO authenticated;
GRANT ALL ON public.site_licenses TO service_role;
ALTER TABLE public.site_licenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Licenças são públicas" ON public.site_licenses FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin edita licenças" ON public.site_licenses FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER site_licenses_updated_at BEFORE UPDATE ON public.site_licenses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
INSERT INTO public.site_licenses (slug, name) VALUES
  ('cc-by-4-0', 'CC BY 4.0'),
  ('cc-by-sa-4-0', 'CC BY-SA 4.0');