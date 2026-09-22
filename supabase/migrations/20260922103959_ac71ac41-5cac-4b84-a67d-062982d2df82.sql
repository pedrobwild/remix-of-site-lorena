CREATE TABLE IF NOT EXISTS public.seo_index_status (
  id BIGSERIAL PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_checked_at TIMESTAMPTZ,
  coverage_state TEXT,
  verdict TEXT,
  robots_state TEXT,
  last_crawl_at TIMESTAMPTZ,
  indexed BOOLEAN NOT NULL DEFAULT false,
  indexed_at TIMESTAMPTZ,
  previous_verdict TEXT,
  changed_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  error TEXT,
  removed BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS seo_index_status_checked_idx ON public.seo_index_status (last_checked_at NULLS FIRST);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.seo_index_status TO authenticated;
GRANT ALL ON public.seo_index_status TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.seo_index_status_id_seq TO authenticated, service_role;

ALTER TABLE public.seo_index_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin all seo_index_status" ON public.seo_index_status;
CREATE POLICY "admin all seo_index_status"
ON public.seo_index_status
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.seo_index_runs (
  id BIGSERIAL PRIMARY KEY,
  ran_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT NOT NULL DEFAULT 'cron',
  urls_total INTEGER NOT NULL DEFAULT 0,
  checked INTEGER NOT NULL DEFAULT 0,
  newly_indexed INTEGER NOT NULL DEFAULT 0,
  errors INTEGER NOT NULL DEFAULT 0,
  notes TEXT
);

GRANT SELECT, INSERT ON public.seo_index_runs TO authenticated;
GRANT ALL ON public.seo_index_runs TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.seo_index_runs_id_seq TO authenticated, service_role;

ALTER TABLE public.seo_index_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin all seo_index_runs" ON public.seo_index_runs;
CREATE POLICY "admin all seo_index_runs"
ON public.seo_index_runs
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());