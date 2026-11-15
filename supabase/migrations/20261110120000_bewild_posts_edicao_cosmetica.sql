-- bewild_posts.content_updated_at — chave de transação para edição COSMÉTICA
-- em lote (auditoria de SEO, rodada 4, 09/11/2026, ação 17a).
--
-- Problema: o gatilho bewild_posts_set_content_updated_at (migration
-- 20261006150000) carimba content_updated_at em QUALQUER mudança de coluna de
-- conteúdo. Em 08/11/2026 às 21:46:55, 8 artigos do cluster de short stay
-- ganharam o mesmo dateModified num update em lote (sinal de atualização em
-- massa). O Google só usa o lastmod/dateModified que reflete "a última
-- atualização significativa da página"; datas infladas fazem o sinal ser
-- ignorado para o site todo.
--
-- Solução: a função passa a respeitar a chave de transação
-- bewild.edicao_cosmetica. Com ela em 'on', o update preserva
-- old.content_updated_at; sem ela (edição real pelo painel), nada muda.
--
-- Uso (sempre com SET LOCAL, que vale só até o fim da transação):
--
--   begin;
--   set local bewild.edicao_cosmetica = 'on';
--   update public.bewild_posts set body = ... where ...;
--   commit;
--
-- Quando usar e quando não usar: docs/SEO.md, seção "Edição em lote sem mexer
-- na data". `updated_at` (gatilho set_updated_at) continua carimbando: é o
-- registro técnico da linha, e o site só cai nele enquanto content_updated_at
-- não existir.
--
-- Só recria a função: o gatilho, as colunas ignoradas e os dados ficam como
-- estão. Os 8 artigos de 08/11/2026 já voltaram à data anterior em 10/11/2026,
-- num SQL avulso que leu bewild_posts_backup_20261109 com os gatilhos desligados.

create or replace function public.bewild_posts_set_content_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  ignorar text[] := array['updated_at', 'content_updated_at', 'featured', 'published', 'published_at', 'reading_time'];
begin
  -- Edição cosmética em lote (links, CTA, ortografia): preserva a data.
  -- current_setting(..., true) devolve NULL sem a chave e '' depois de um
  -- SET LOCAL já encerrado; só 'on' liga.
  if coalesce(current_setting('bewild.edicao_cosmetica', true), '') = 'on' then
    new.content_updated_at := old.content_updated_at;
    return new;
  end if;

  if (to_jsonb(new) - ignorar) is distinct from (to_jsonb(old) - ignorar) then
    new.content_updated_at := now();
  else
    -- Update sem mudança de conteúdo (lote, destacar, despublicar): preserva o valor.
    new.content_updated_at := old.content_updated_at;
  end if;
  return new;
end;
$$;

comment on function public.bewild_posts_set_content_updated_at() is
  'Carimba content_updated_at quando o conteúdo do post muda. Com SET LOCAL bewild.edicao_cosmetica = ''on'' na transação, preserva a data (edição cosmética em lote). Ver docs/SEO.md.';
