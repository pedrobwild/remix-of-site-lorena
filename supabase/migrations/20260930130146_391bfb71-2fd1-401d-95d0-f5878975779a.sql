-- projects.content_updated_at — data real da última edição de CONTEÚDO.
--
-- Por quê: updated_at é gravado pelo trigger set_updated_at em QUALQUER update,
-- inclusive em lote. Em 27/09/2026 (11:31 e 12:09 UTC) uma atualização em lote
-- carimbou os 162 projetos com a mesma data, e o sitemap usava updated_at como
-- <lastmod>: 162 URLs "editadas" no mesmo dia. O Google passa a ignorar o
-- campo quando ele não bate com mudanças reais (auditoria de 30/09).
--
-- Como: esta coluna só muda quando alguma coluna de conteúdo muda de fato
-- (título, textos, bairro, capa, galerias, SEO da página…). Mudanças de
-- ordenação (order_index), visibilidade (visible, published) e os próprios
-- carimbos não contam. Comparação por to_jsonb menos essas chaves, então
-- colunas novas entram automaticamente como conteúdo.
--
-- Backfill: fica NULL de propósito. O sitemap (scripts/generate-sitemap.mjs e
-- supabase/functions/sitemap) usa coalesce(content_updated_at, created_at):
-- created_at é a data real em que cada projeto entrou no site (24/08 a
-- 11/09/2026, espalhadas), e é o melhor dado verdadeiro que existe — a data
-- real da edição anterior ao lote foi perdida quando updated_at foi sobrescrito.

alter table public.projects
  add column if not exists content_updated_at timestamptz;

comment on column public.projects.content_updated_at is
  'Última edição de conteúdo (ignora order_index/visible/published e carimbos). NULL = nunca editado após a criação; use coalesce(content_updated_at, created_at).';

create or replace function public.projects_set_content_updated_at()
returns trigger
language plpgsql
as $$
declare
  ignorar text[] := array['updated_at', 'content_updated_at', 'order_index', 'visible', 'published'];
begin
  if (to_jsonb(new) - ignorar) is distinct from (to_jsonb(old) - ignorar) then
    new.content_updated_at := now();
  else
    -- Update sem mudança de conteúdo (lote, reordenação, ocultar): preserva o valor.
    new.content_updated_at := old.content_updated_at;
  end if;
  return new;
end;
$$;

drop trigger if exists projects_set_content_updated_at on public.projects;
create trigger projects_set_content_updated_at
  before update on public.projects
  for each row execute function public.projects_set_content_updated_at();