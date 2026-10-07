ALTER TABLE public.bewild_posts ADD COLUMN IF NOT EXISTS youtube_video_id text;
COMMENT ON COLUMN public.bewild_posts.youtube_video_id IS 'ID opcional do YouTube para vídeo de abertura do artigo; player carregado somente ao clicar.';
ALTER TABLE public.bewild_posts ADD CONSTRAINT bewild_posts_youtube_video_id_check CHECK (youtube_video_id IS NULL OR youtube_video_id ~ '^[A-Za-z0-9_-]{11}$');