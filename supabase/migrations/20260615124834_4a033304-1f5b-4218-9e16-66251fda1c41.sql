ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS neighborhood text,
  ADD COLUMN IF NOT EXISTS project_type text,
  ADD COLUMN IF NOT EXISTS area_m2 int,
  ADD COLUMN IF NOT EXISTS duration text,
  ADD COLUMN IF NOT EXISTS challenge text,
  ADD COLUMN IF NOT EXISTS solution text,
  ADD COLUMN IF NOT EXISTS scope text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS testimonial text,
  ADD COLUMN IF NOT EXISTS testimonial_author text,
  ADD COLUMN IF NOT EXISTS after_image_url text,
  ADD COLUMN IF NOT EXISTS gallery_urls text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sort_order int NOT NULL DEFAULT 0;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema='public' AND table_name='projects'
      AND constraint_name='projects_project_type_check'
  ) THEN
    ALTER TABLE public.projects
      ADD CONSTRAINT projects_project_type_check
      CHECK (project_type IS NULL OR project_type IN ('short_stay','turn_key','planta'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS projects_published_sort_idx
  ON public.projects (published, sort_order);

DROP POLICY IF EXISTS "Bewild portfolio published readable" ON public.projects;
CREATE POLICY "Bewild portfolio published readable"
  ON public.projects FOR SELECT
  TO anon, authenticated
  USING (published = true);

DROP POLICY IF EXISTS "project-images public read" ON storage.objects;
CREATE POLICY "project-images public read"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'project-images');

DROP POLICY IF EXISTS "project-images auth write" ON storage.objects;
CREATE POLICY "project-images auth write"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-images');

DROP POLICY IF EXISTS "project-images auth update" ON storage.objects;
CREATE POLICY "project-images auth update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'project-images')
  WITH CHECK (bucket_id = 'project-images');

DROP POLICY IF EXISTS "project-images auth delete" ON storage.objects;
CREATE POLICY "project-images auth delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'project-images');