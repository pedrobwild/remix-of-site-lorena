DROP POLICY "Licenças são públicas" ON public.site_licenses;
CREATE POLICY "Admin lê licenças" ON public.site_licenses FOR SELECT TO authenticated USING (public.is_admin());
REVOKE ALL ON public.site_licenses FROM anon;
CREATE OR REPLACE FUNCTION public.get_public_license(p_slug text)
RETURNS TABLE(title text, intro text, body text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT l.title, l.intro, l.body FROM public.site_licenses l WHERE l.slug = p_slug AND l.slug IN ('cc-by-4-0', 'cc-by-sa-4-0'); $$;
REVOKE ALL ON FUNCTION public.get_public_license(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_license(text) TO anon, authenticated, service_role;
CREATE OR REPLACE FUNCTION public.clear_license_editor_email()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_by_email := NULL; RETURN NEW; END; $$;
CREATE TRIGGER clear_license_editor_email BEFORE INSERT OR UPDATE ON public.site_licenses FOR EACH ROW EXECUTE FUNCTION public.clear_license_editor_email();
COMMENT ON COLUMN public.site_licenses.updated_by_email IS 'DEPRECATED: editor email is no longer collected; kept nullable for deployed-client compatibility and cleared on every write.';