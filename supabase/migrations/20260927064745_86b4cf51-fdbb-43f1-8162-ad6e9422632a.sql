alter publication supabase_realtime add table public.analytics_events;

create or replace function public.analytics_live_panel(p_days int default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_since timestamptz := date_trunc('day', (now() at time zone 'America/Sao_Paulo')) at time zone 'America/Sao_Paulo' - make_interval(days => greatest(1, least(p_days, 90)) - 1);
  r jsonb;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  with pv as (
    select created_at, path, coalesce(visitor_id::text, session_id) as vid,
      case
        when lower(coalesce(utm_source,'')) like '%maps%' or lower(coalesce(referrer,'')) like '%google.%/maps%' or lower(coalesce(referrer_host,'')) like 'maps.%' or lower(coalesce(utm_source,'')) in ('gbp','google_business','gmb') then 'Mapa (Google Maps)'
        when lower(coalesce(utm_medium,'')) in ('cpc','paid','ppc','paid_social') or lower(coalesce(utm_source,'')) in ('google_ads','meta_ads') then 'Anúncios'
        when lower(coalesce(referrer_host,'') || coalesce(utm_source,'')) ~ '(instagram|facebook|fb\.|tiktok|linkedin|youtube|pinterest|t\.co|twitter|x\.com|threads|whatsapp|wa\.me)' then 'Redes sociais'
        when lower(coalesce(referrer_host,'') || coalesce(utm_source,'')) ~ '(google|bing|duckduckgo|yahoo|ecosia)' then 'Google / buscas'
        when coalesce(referrer_host,'') = '' and coalesce(utm_source,'') = '' then 'Direto'
        when lower(coalesce(referrer_host,'')) like '%bewild%' then 'Direto'
        else 'Outros sites'
      end as origem
    from public.analytics_events
    where event_type = 'pageview' and created_at >= v_since
  )
  select jsonb_build_object(
    'live_now', (select count(distinct coalesce(visitor_id::text, session_id)) from public.analytics_events where created_at >= now() - interval '5 minutes'),
    'today_visitors', (select count(distinct vid) from pv where created_at >= date_trunc('day', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo'),
    'total_visitors', (select count(distinct vid) from pv),
    'total_pageviews', (select count(*) from pv),
    'daily', coalesce((select jsonb_agg(jsonb_build_object('day', d, 'visitors', v, 'pageviews', p) order by d) from (
        select to_char(created_at at time zone 'America/Sao_Paulo','YYYY-MM-DD') d, count(distinct vid) v, count(*) p from pv group by 1) x), '[]'::jsonb),
    'pages', coalesce((select jsonb_agg(jsonb_build_object('path', path, 'visitors', v, 'pageviews', p) order by p desc) from (
        select coalesce(nullif(path,''),'/') path, count(distinct vid) v, count(*) p from pv group by 1 order by 3 desc limit 20) x), '[]'::jsonb),
    'sources', coalesce((select jsonb_agg(jsonb_build_object('source', origem, 'visitors', v) order by v desc) from (
        select origem, count(distinct vid) v from pv group by 1) x), '[]'::jsonb)
  ) into r;
  return r;
end;
$$;

revoke all on function public.analytics_live_panel(int) from public, anon;
grant execute on function public.analytics_live_panel(int) to authenticated;