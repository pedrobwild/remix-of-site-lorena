ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS home_seo_title text,
  ADD COLUMN IF NOT EXISTS home_seo_description text,
  ADD COLUMN IF NOT EXISTS home_og_title text,
  ADD COLUMN IF NOT EXISTS home_og_description text,
  ADD COLUMN IF NOT EXISTS home_og_image text;