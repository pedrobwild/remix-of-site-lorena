ALTER FUNCTION public.bewild_posts_set_content_updated_at() SET search_path = public;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='set_updated_at' AND p.pronargs=0) THEN
    EXECUTE 'ALTER FUNCTION public.set_updated_at() SET search_path = public';
  END IF;
END $$;