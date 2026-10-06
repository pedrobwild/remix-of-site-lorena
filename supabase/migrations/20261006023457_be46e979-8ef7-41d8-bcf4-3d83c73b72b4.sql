ALTER TABLE public.bewild_posts
  ADD COLUMN IF NOT EXISTS og_image text,
  ADD COLUMN IF NOT EXISTS focus_keyword text;
COMMENT ON COLUMN public.bewild_posts.og_image IS 'Imagem de compartilhamento (og:image); se vazia usa cover_image.';
COMMENT ON COLUMN public.bewild_posts.focus_keyword IS 'Palavra-chave principal (uso editorial no admin).';