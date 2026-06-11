
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS portfolio_tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS before_text text,
  ADD COLUMN IF NOT EXISTS before_image_url text,
  ADD COLUMN IF NOT EXISTS ready_image_url text,
  ADD COLUMN IF NOT EXISTS ready_items text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS result_text text,
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_order integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS projects_featured_idx
  ON public.projects (featured, featured_order)
  WHERE featured = true;
