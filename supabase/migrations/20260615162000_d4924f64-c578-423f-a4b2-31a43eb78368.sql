
-- Tighten storage write policies on public buckets to admins only.
DROP POLICY IF EXISTS "authenticated insert post-images" ON storage.objects;
DROP POLICY IF EXISTS "authenticated update post-images" ON storage.objects;
DROP POLICY IF EXISTS "authenticated delete post-images" ON storage.objects;
DROP POLICY IF EXISTS "project-images auth write"  ON storage.objects;
DROP POLICY IF EXISTS "project-images auth update" ON storage.objects;
DROP POLICY IF EXISTS "project-images auth delete" ON storage.objects;

CREATE POLICY "admin insert post-images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'post-images' AND public.is_admin());
CREATE POLICY "admin update post-images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'post-images' AND public.is_admin())
  WITH CHECK (bucket_id = 'post-images' AND public.is_admin());
CREATE POLICY "admin delete post-images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'post-images' AND public.is_admin());

CREATE POLICY "admin insert project-images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-images' AND public.is_admin());
CREATE POLICY "admin update project-images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'project-images' AND public.is_admin())
  WITH CHECK (bucket_id = 'project-images' AND public.is_admin());
CREATE POLICY "admin delete project-images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'project-images' AND public.is_admin());

-- Private videos bucket should not have a blanket public-read policy.
DROP POLICY IF EXISTS "Public read videos bucket" ON storage.objects;
CREATE POLICY "admin read videos" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'videos' AND public.is_admin());

-- Projects: remove the overlapping "visible=true" public SELECT policy that
-- exposed unpublished drafts. Only published projects should be readable.
DROP POLICY IF EXISTS "public read visible projects" ON public.projects;
