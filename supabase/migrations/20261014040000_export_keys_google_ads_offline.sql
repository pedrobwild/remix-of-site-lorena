-- Exportação: novo conjunto google_ads_offline (conversões offline do Google
-- Ads lidas pelo Data Manager; e-mail e telefone só em hash). Amplia a lista
-- de conjuntos aceitos na tabela de chaves e na função que cria a chave.

do $$
declare c text;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.export_keys'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%datasets%'
  loop
    execute format('alter table public.export_keys drop constraint %I', c);
  end loop;
end $$;

alter table public.export_keys
  add constraint export_keys_datasets_check check (
    cardinality(datasets) > 0
    and datasets <@ array['leads', 'meta_leads', 'meta_ads_daily', 'analytics_daily', 'tracking_daily', 'google_ads_offline']::text[]
  );

create or replace function public.create_export_key(p_name text, p_datasets text[])
returns table (id uuid, token text, prefix text)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_token text;
  v_id uuid;
  v_datasets text[];
begin
  if not public.is_admin() then
    raise exception 'somente administradores' using errcode = '42501';
  end if;
  if p_name is null or char_length(btrim(p_name)) not between 1 and 80 then
    raise exception 'nome inválido' using errcode = '22023';
  end if;
  select array_agg(distinct d order by d) into v_datasets from unnest(p_datasets) d;
  if v_datasets is null
     or not (v_datasets <@ array['leads', 'meta_leads', 'meta_ads_daily', 'analytics_daily', 'tracking_daily', 'google_ads_offline']::text[]) then
    raise exception 'conjunto de dados inválido' using errcode = '22023';
  end if;
  v_token := 'bwx_' || replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  insert into public.export_keys (name, prefix, key_hash, datasets, created_by, created_by_email)
  values (
    btrim(p_name),
    left(v_token, 12),
    encode(sha256(convert_to(v_token, 'UTF8')), 'hex'),
    v_datasets,
    auth.uid(),
    auth.jwt() ->> 'email'
  )
  returning export_keys.id into v_id;
  return query select v_id, v_token, left(v_token, 12);
end;
$$;
