-- Fix linter 0011 (function_search_path_mutable): fixar search_path na função
-- projects_set_content_updated_at criada na migration 20260930120000.
create or replace function public.projects_set_content_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  ignorar text[] := array['updated_at', 'content_updated_at', 'order_index', 'visible', 'published'];
begin
  if (to_jsonb(new) - ignorar) is distinct from (to_jsonb(old) - ignorar) then
    new.content_updated_at := now();
  else
    new.content_updated_at := old.content_updated_at;
  end if;
  return new;
end;
$$;