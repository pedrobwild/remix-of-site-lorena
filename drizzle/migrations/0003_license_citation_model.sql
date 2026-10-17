ALTER TABLE public.site_licenses ADD COLUMN citation_model text;
COMMENT ON COLUMN public.site_licenses.citation_model IS 'Modelo de citação editável no painel /admin/licencas; vazio = padrão do código.';

DROP FUNCTION IF EXISTS public.get_public_license(text);

CREATE FUNCTION public.get_public_license(p_slug text)
RETURNS TABLE(title text, intro text, body text, citation_model text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT l.title, l.intro, l.body, l.citation_model
  FROM public.site_licenses l
  WHERE l.slug = p_slug
    AND l.slug IN ('cc-by-4-0', 'cc-by-sa-4-0')
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_license(text) TO anon, authenticated;