CREATE TABLE public.search_console_snapshots (
  cache_key text PRIMARY KEY,
  site_url text,
  request jsonb NOT NULL DEFAULT '{}'::jsonb,
  payload jsonb,
  refreshed_at timestamptz,
  attempted_at timestamptz,
  error text
);
GRANT SELECT, INSERT, UPDATE ON public.search_console_snapshots TO authenticated;
GRANT ALL ON public.search_console_snapshots TO service_role;
ALTER TABLE public.search_console_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Administradores consultam snapshots de busca" ON public.search_console_snapshots FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Administradores criam snapshots de busca" ON public.search_console_snapshots FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Administradores atualizam snapshots de busca" ON public.search_console_snapshots FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());