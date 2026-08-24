CREATE OR REPLACE FUNCTION public.top_projects(p_limit int DEFAULT 3, p_days int DEFAULT 90)
RETURNS TABLE (
  id uuid,
  slug text,
  title text,
  cover_url text,
  project_type text,
  neighborhood text,
  location text,
  area_m2 numeric,
  duration text,
  views bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id,
         p.slug,
         p.title,
         p.cover_url,
         p.project_type::text,
         p.neighborhood,
         p.location,
         p.area_m2::numeric,
         p.duration,
         COALESCE(v.views, 0) AS views
  FROM public.projects p
  LEFT JOIN (
    SELECT split_part(path, '/', 3) AS slug, count(*) AS views
    FROM public.analytics_events
    WHERE event_type = 'pageview'
      AND path LIKE '/portfolio/%'
      AND created_at > now() - make_interval(days => GREATEST(p_days, 1))
    GROUP BY 1
  ) v ON v.slug = p.slug
  WHERE p.published = true
    AND p.cover_url IS NOT NULL
  ORDER BY COALESCE(v.views, 0) DESC, p.sort_order ASC NULLS LAST, p.created_at DESC
  LIMIT GREATEST(p_limit, 1);
$$;

GRANT EXECUTE ON FUNCTION public.top_projects(int, int) TO anon, authenticated, service_role;