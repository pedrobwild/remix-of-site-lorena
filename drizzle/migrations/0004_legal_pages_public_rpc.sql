CREATE OR REPLACE FUNCTION public.get_public_license(p_slug text)
RETURNS TABLE(title text, intro text, body text, citation_model text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT l.title, l.intro, l.body, l.citation_model
  FROM public.site_licenses l
  WHERE l.slug = p_slug
    AND p_slug IN ('cc-by-4-0', 'cc-by-sa-4-0', 'privacidade', 'termos-de-uso');
$$;

REVOKE ALL ON FUNCTION public.get_public_license(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_license(text) TO anon, authenticated;