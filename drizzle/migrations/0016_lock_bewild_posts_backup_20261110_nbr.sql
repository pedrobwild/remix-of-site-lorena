ALTER TABLE public.bewild_posts_backup_20261110_nbr ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.bewild_posts_backup_20261110_nbr FROM anon, authenticated;
GRANT ALL ON public.bewild_posts_backup_20261110_nbr TO service_role;