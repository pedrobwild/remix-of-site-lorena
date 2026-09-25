ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS bastidores_seo jsonb NOT NULL DEFAULT '{}'::jsonb;