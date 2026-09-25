create table if not exists public.export_keys (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  prefix text not null,
  key_hash text not null unique,
  datasets text[] not null
    check (
      cardinality(datasets) > 0
      and datasets <@ array['leads', 'meta_leads', 'meta_ads_daily', 'analytics_daily', 'tracking_daily']::text[]
    ),
  created_at timestamptz not null default now(),
  created_by uuid,
  created_by_email text,
  last_used_at timestamptz,
  use_count bigint not null default 0,
  revoked_at timestamptz
);

comment on table public.export_keys is
  'Chaves da exportação para planilha/BI (edge function data-export). Só o hash SHA-256 da chave é guardado.';

alter table public.export_keys enable row level security;

drop policy if exists "Admins can view export keys" on public.export_keys;
create policy "Admins can view export keys"
  on public.export_keys for select to authenticated
  using (public.is_admin());

revoke all on public.export_keys from anon;
revoke all on public.export_keys from authenticated;
grant select (id, name, prefix, datasets, created_at, created_by_email, last_used_at, use_count, revoked_at)
  on public.export_keys to authenticated;
grant all on public.export_keys to service_role;

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
     or not (v_datasets <@ array['leads', 'meta_leads', 'meta_ads_daily', 'analytics_daily', 'tracking_daily']::text[]) then
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

create or replace function public.revoke_export_key(p_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'somente administradores' using errcode = '42501';
  end if;
  update public.export_keys set revoked_at = now() where id = p_id and revoked_at is null;
end;
$$;

create or replace function public.export_key_touch(p_id uuid)
returns void
language sql
volatile
security definer
set search_path = public
as $$
  update public.export_keys set last_used_at = now(), use_count = use_count + 1 where id = p_id;
$$;

create or replace function public.export_analytics_daily(p_since timestamptz, p_until timestamptz)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_agg(to_jsonb(t) order by t.day, t.utm_source, t.utm_medium, t.utm_campaign, t.referrer_host, t.device),
    '[]'::jsonb
  )
  from (
    select
      (s.started_at at time zone 'America/Sao_Paulo')::date as day,
      s.utm_source,
      s.utm_medium,
      s.utm_campaign,
      s.referrer_host,
      s.device,
      count(*) as sessions,
      count(distinct s.visitor_id) as visitors,
      coalesce(sum(s.pageviews), 0) as pageviews,
      coalesce(sum(s.conversions), 0) as conversions,
      count(*) filter (where s.converted) as converted_sessions,
      count(*) filter (where s.is_bounce) as bounces
    from public.analytics_sessions s
    where s.started_at >= p_since and s.started_at < p_until
    group by 1, 2, 3, 4, 5, 6
    order by 1, 2, 3, 4, 5, 6
    limit 50001
  ) t;
$$;

create or replace function public.export_tracking_daily(p_since timestamptz, p_until timestamptz)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_agg(to_jsonb(t) order by t.day, t.kind, t.campaign, t.source, t.medium, t.content, t.term),
    '[]'::jsonb
  )
  from (
    select
      (h.created_at at time zone 'America/Sao_Paulo')::date as day,
      h.kind,
      h.campaign,
      h.source,
      h.medium,
      h.content,
      h.term,
      count(*) filter (where not h.is_bot) as hits,
      count(*) filter (where h.is_bot) as bots
    from public.tracking_hits h
    where h.created_at >= p_since and h.created_at < p_until
    group by 1, 2, 3, 4, 5, 6, 7
    order by 1, 2, 3, 4, 5, 6, 7
    limit 50001
  ) t;
$$;

revoke all on function public.create_export_key(text, text[]) from public, anon;
revoke all on function public.revoke_export_key(uuid) from public, anon;
grant execute on function public.create_export_key(text, text[]) to authenticated, service_role;
grant execute on function public.revoke_export_key(uuid) to authenticated, service_role;

revoke all on function public.export_key_touch(uuid) from public, anon, authenticated;
revoke all on function public.export_analytics_daily(timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function public.export_tracking_daily(timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.export_key_touch(uuid) to service_role;
grant execute on function public.export_analytics_daily(timestamptz, timestamptz) to service_role;
grant execute on function public.export_tracking_daily(timestamptz, timestamptz) to service_role;