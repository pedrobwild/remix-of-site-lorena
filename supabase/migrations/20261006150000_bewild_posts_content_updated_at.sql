-- bewild_posts.content_updated_at — data real da última edição de CONTEÚDO
-- de um post (auditoria de SEO, rodada 3, 06/10/2026, item 2 do plano).
--
-- Problema: o trigger set_updated_at carimba `updated_at` em QUALQUER update.
-- Um update em lote às 02:29:06 UTC de 06/10/2026 marcou 43 dos 46 posts no
-- mesmo segundo, sem mudança de texto. Efeitos: "Atualizado em 05 de out."
-- em 43 artigos, `dateModified` do JSON-LD e `lastmod` do sitemap falsos.
-- O Google ignora `lastmod` quando percebe datas infladas.
--
-- Mesmo padrão já aplicado a `projects` (migration 20260930130146):
--   1. coluna content_updated_at, NULL = nunca editado após publicar;
--   2. trigger que só a atualiza quando colunas de conteúdo mudam;
--   3. backfill: carimbo do lote vira NULL, edições reais são preservadas;
--   4. `updated_at` dos posts do lote volta para published_at (trigger
--      desligado durante o update), para que o código atual já mostre a
--      data certa antes mesmo do deploy que passa a ler content_updated_at.
--
-- O front (postDates), o JSON-LD e supabase/functions/sitemap leem
-- coalesce(content_updated_at, published_at, created_at) e caem para
-- updated_at só enquanto esta coluna não existir.

alter table public.bewild_posts
  add column if not exists content_updated_at timestamptz;

comment on column public.bewild_posts.content_updated_at is
  'Última edição de conteúdo (title, body, excerpt, faq, cover, meta). Ignora featured/published/carimbos. NULL = nunca editado após a criação; use coalesce(content_updated_at, published_at, created_at).';

create or replace function public.bewild_posts_set_content_updated_at()
returns trigger
language plpgsql
as $$
declare
  ignorar text[] := array['updated_at', 'content_updated_at', 'featured', 'published', 'published_at', 'reading_time'];
begin
  if (to_jsonb(new) - ignorar) is distinct from (to_jsonb(old) - ignorar) then
    new.content_updated_at := now();
  else
    -- Update sem mudança de conteúdo (lote, destacar, despublicar): preserva o valor.
    new.content_updated_at := old.content_updated_at;
  end if;
  return new;
end;
$$;

drop trigger if exists bewild_posts_set_content_updated_at on public.bewild_posts;
create trigger bewild_posts_set_content_updated_at
  before update on public.bewild_posts
  for each row execute function public.bewild_posts_set_content_updated_at();

-- Backfill + correção do lote. Os dois triggers de update ficam desligados
-- para que este update não carimbe nada.
alter table public.bewild_posts disable trigger bewild_posts_set_updated_at;
alter table public.bewild_posts disable trigger bewild_posts_set_content_updated_at;

-- Lote de 06/10/2026 02:29:06 UTC (43 posts no mesmo segundo): não foi edição.
update public.bewild_posts
   set content_updated_at = null,
       updated_at = coalesce(published_at, created_at)
 where updated_at >= timestamptz '2026-10-06 02:29:00+00'
   and updated_at <  timestamptz '2026-10-06 02:30:00+00';

-- Demais posts: edição real posterior à publicação vira content_updated_at.
update public.bewild_posts
   set content_updated_at = updated_at
 where content_updated_at is null
   and updated_at > coalesce(published_at, created_at) + interval '1 minute';

alter table public.bewild_posts enable trigger bewild_posts_set_content_updated_at;
alter table public.bewild_posts enable trigger bewild_posts_set_updated_at;
