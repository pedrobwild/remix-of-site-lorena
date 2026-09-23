DROP POLICY IF EXISTS "alt_temp_backfill" ON public.image_alt_texts;
REVOKE INSERT, UPDATE ON public.image_alt_texts FROM anon;