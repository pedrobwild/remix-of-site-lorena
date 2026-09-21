-- Portfólio: segunda galeria por projeto com as fotos da obra pronta.
--
-- `gallery_urls` continua sendo a galeria "Projeto 3D" (renders do projeto).
-- `ready_gallery_urls` guarda as fotos do apartamento entregue. A tag
-- "Obra pronta" exibida no site e usada como filtro do portfólio é derivada:
-- projeto com ao menos uma foto nesta coluna. Não há campo separado a manter.
--
-- Aplicada em produção em 21/09/2026 (ALTER idempotente). Segura para o código
-- anterior: coluna NOT NULL com default vazio, nenhuma consulta existente muda.
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS ready_gallery_urls text[] NOT NULL DEFAULT '{}'::text[];

COMMENT ON COLUMN public.projects.ready_gallery_urls IS
  'Fotos da obra pronta (apartamento entregue). gallery_urls = imagens do projeto 3D.';
