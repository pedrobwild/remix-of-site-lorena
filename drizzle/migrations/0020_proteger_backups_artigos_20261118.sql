ALTER TABLE public.bewild_posts_backup_20261118_revisor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bewild_posts_backup_20261118_tabela ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.bewild_posts_backup_20261118_revisor FROM anon, authenticated;
REVOKE ALL ON public.bewild_posts_backup_20261118_tabela FROM anon, authenticated;
GRANT ALL ON public.bewild_posts_backup_20261118_revisor TO service_role;
GRANT ALL ON public.bewild_posts_backup_20261118_tabela TO service_role;