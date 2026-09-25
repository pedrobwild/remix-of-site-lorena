create table if not exists public.tracking_hits (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('open', 'view', 'click')),
  campaign text,
  source text,
  medium text,
  content text,
  term text,
  target_host text,
  target_path text,
  agent text,
  is_bot boolean not null default false,
  country text,
  referer_host text
);

comment on table public.tracking_hits is
  'Pixel próprio e links rastreados (edge function px): um acesso por abertura, visualização ou clique, sem dados pessoais.';
comment on column public.tracking_hits.is_bot is 'Robôs e prévias de link (WhatsApp, Slack, Facebook…) — fora das contagens do painel.';

create index if not exists tracking_hits_created_idx on public.tracking_hits (created_at desc);
create index if not exists tracking_hits_campaign_idx on public.tracking_hits (campaign, created_at desc);

alter table public.tracking_hits enable row level security;

drop policy if exists "Admins can view tracking hits" on public.tracking_hits;
create policy "Admins can view tracking hits"
  on public.tracking_hits for select to authenticated
  using (public.is_admin());

revoke all on public.tracking_hits from anon;
revoke all on public.tracking_hits from authenticated;
grant select on public.tracking_hits to authenticated;
grant all on public.tracking_hits to service_role;

create or replace function public.tracking_hits_summary(p_since timestamptz, p_until timestamptz)
returns table (
  campaign text,
  source text,
  medium text,
  content text,
  opens bigint,
  views bigint,
  clicks bigint,
  bots bigint,
  first_at timestamptz,
  last_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    h.campaign,
    h.source,
    h.medium,
    h.content,
    count(*) filter (where h.kind = 'open' and not h.is_bot) as opens,
    count(*) filter (where h.kind = 'view' and not h.is_bot) as views,
    count(*) filter (where h.kind = 'click' and not h.is_bot) as clicks,
    count(*) filter (where h.is_bot) as bots,
    min(h.created_at) as first_at,
    max(h.created_at) as last_at
  from public.tracking_hits h
  where h.created_at >= p_since and h.created_at < p_until
  group by h.campaign, h.source, h.medium, h.content
  order by max(h.created_at) desc
  limit 500;
$$;

revoke all on function public.tracking_hits_summary(timestamptz, timestamptz) from public, anon;
grant execute on function public.tracking_hits_summary(timestamptz, timestamptz) to authenticated, service_role;