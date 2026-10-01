create or replace function public.projects_set_content_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  ignorar text[] := array['updated_at', 'content_updated_at', 'order_index', 'sort_order', 'featured_order', 'visible', 'published'];
begin
  if (to_jsonb(new) - ignorar) is distinct from (to_jsonb(old) - ignorar) then
    new.content_updated_at := now();
  else
    new.content_updated_at := old.content_updated_at;
  end if;
  return new;
end;
$$;