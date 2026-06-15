-- 1. Tabela
CREATE TABLE public.bewild_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  meta_title text,
  meta_description text,
  category text CHECK (category IN ('mercado','investimento','reforma','operacao','fiscal')),
  excerpt text,
  cover_image text,
  body text NOT NULL DEFAULT '',
  faq jsonb NOT NULL DEFAULT '[]'::jsonb,
  reading_time int NOT NULL DEFAULT 0,
  author text NOT NULL DEFAULT 'Equipe Bewild',
  featured boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX bewild_posts_published_idx ON public.bewild_posts (published, published_at DESC);
CREATE INDEX bewild_posts_category_idx  ON public.bewild_posts (category);

-- 2. GRANTs
GRANT SELECT ON public.bewild_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bewild_posts TO authenticated;
GRANT ALL ON public.bewild_posts TO service_role;

-- 3. RLS
ALTER TABLE public.bewild_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read published bewild_posts"
ON public.bewild_posts FOR SELECT
TO anon, authenticated
USING (published = true);

CREATE POLICY "admins manage bewild_posts"
ON public.bewild_posts FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 4. updated_at trigger
CREATE TRIGGER bewild_posts_set_updated_at
BEFORE UPDATE ON public.bewild_posts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Storage policies para o bucket post-images (bucket criado em seguida)
CREATE POLICY "public read post-images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'post-images');

CREATE POLICY "authenticated insert post-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'post-images');

CREATE POLICY "authenticated update post-images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'post-images')
WITH CHECK (bucket_id = 'post-images');

CREATE POLICY "authenticated delete post-images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'post-images');