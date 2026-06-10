CREATE POLICY "Public read videos bucket"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'videos');