DROP POLICY IF EXISTS "alt_temp_backfill" ON public.image_alt_texts;
CREATE POLICY "alt_temp_backfill" ON public.image_alt_texts FOR ALL TO anon
  USING (url LIKE 'https://aamlnkmqvjcowixdgqii.supabase.co/storage/v1/object/public/%')
  WITH CHECK (url LIKE 'https://aamlnkmqvjcowixdgqii.supabase.co/storage/v1/object/public/%');
GRANT INSERT, UPDATE ON public.image_alt_texts TO anon;