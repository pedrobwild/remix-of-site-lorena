-- analytics_timeseries_v2 — série temporal do painel de Analytics no fuso do
-- usuário, com filtros de segmento e visitantes únicos por bucket.
--
-- Por que uma v2:
--   - a v1 agrupa com date_trunc em UTC: o "dia" corta às 21h de São Paulo
--     (o painel somava buckets de hora no cliente para contornar isso);
--   - a v1 não aceita segmentos, então o gráfico e a tabela por dia mostravam
--     o tráfego total mesmo com segmento ativo;
--   - a v1 não devolve visitantes únicos por bucket (não dá para somar
--     únicos de hora em hora).
--
-- `p_tz` é o fuso IANA do navegador (ex.: America/Sao_Paulo). O bucket volta
-- como o INÍCIO do bucket local, em timestamptz — o cliente monta a grade em
-- horário local e casa pelo instante.
--
-- Idempotente (create or replace). Só `authenticated` + is_admin() por dentro,
-- como as demais RPCs do painel (ver 20260923060000_auditoria_endurecimento.sql).
-- A v1 continua existindo; nenhum código do site a usa depois desta rodada.

create or replace function public.analytics_timeseries_v2(
  p_since timestamptz,
  p_until timestamptz,
  p_grain text,
  p_tz text,
  p_device text default null,
  p_country text default null,
  p_utm_source text default null,
  p_utm_medium text default null,
  p_utm_campaign text default null,
  p_landing_path text default null,
  p_referrer_host text default null
) returns table(
  bucket timestamptz,
  sessions bigint,
  visitors bigint,
  pageviews bigint,
  conversions bigint
)
language plpgsql stable security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  if p_grain not in ('hour', 'day', 'week', 'month') then
    raise exception 'invalid grain';
  end if;
  -- Nome IANA (America/Sao_Paulo, Etc/UTC…); o próprio Postgres rejeita um
  -- fuso desconhecido em `at time zone`.
  if p_tz is null or p_tz !~ '^[A-Za-z0-9_+./-]{1,64}$' then
    raise exception 'invalid timezone';
  end if;
  return query execute format($q$
    select (date_trunc(%L, s.started_at at time zone $3) at time zone $3) as bucket,
           count(*)::bigint                        as sessions,
           count(distinct s.visitor_id)::bigint    as visitors,
           coalesce(sum(s.pageviews), 0)::bigint   as pageviews,
           coalesce(sum(s.conversions), 0)::bigint as conversions
    from public.analytics_sessions s
    where s.started_at >= $1 and s.started_at < $2
      and ($4  is null or s.device        = $4)
      and ($5  is null or s.country       = $5)
      and ($6  is null or s.utm_source    = $6)
      and ($7  is null or s.utm_medium    = $7)
      and ($8  is null or s.utm_campaign  = $8)
      and ($9  is null or s.landing_path  = $9)
      and ($10 is null or s.referrer_host = $10)
    group by 1
    order by 1
  $q$, p_grain)
  using p_since, p_until, p_tz,
        p_device, p_country, p_utm_source, p_utm_medium, p_utm_campaign,
        p_landing_path, p_referrer_host;
end;
$$;

revoke all on function public.analytics_timeseries_v2(
  timestamptz, timestamptz, text, text, text, text, text, text, text, text, text
) from public, anon;
grant execute on function public.analytics_timeseries_v2(
  timestamptz, timestamptz, text, text, text, text, text, text, text, text, text
) to authenticated, service_role;