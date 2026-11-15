ALTER TABLE public.bewild_posts_backup_20261110 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.bewild_posts_backup_20261110 FROM anon, authenticated;
GRANT ALL ON public.bewild_posts_backup_20261110 TO service_role;