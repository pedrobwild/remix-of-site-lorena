-- Aceite de cookies por dia — indicador do painel /admin/analytics.
--
-- O banner registra a decisão explícita do visitante em analytics_events
-- (consent_accept / consent_decline, ver src/lib/analytics.ts › logConsentAudit).
-- Esses eventos não carregam session_id nem visitor_id (são a trilha de
-- auditoria LGPD, não tracking), então não aparecem em analytics_sessions
-- nem nas RPCs de sessão. Esta função soma aceites e recusas por dia LOCAL
-- (p_tz), no mesmo desenho das demais: security definer + is_admin().
--
-- Leitura: taxa de aceite = aceites ÷ (aceites + recusas). Quem fecha a
-- página sem decidir não entra — o denominador de "todos os visitantes"
-- fica na analytics da Lovable.

drop function public.analytics_consent_daily(timestamptz, timestamptz, text);

create or replace function public.analytics_consent_daily(
  p_since timestamptz,
  p_until timestamptz,
  p_tz text default 'America/Sao_Paulo'
)
returns table(day date, accepts bigint, declines bigint)
language plpgsql
stable security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  if p_tz is null or btrim(p_tz) = '' then
    p_tz := 'America/Sao_Paulo';
  end if;

  return query
  select (e.created_at at time zone p_tz)::date                          as day,
         count(*) filter (where e.event_type = 'consent_accept')::bigint  as accepts,
         count(*) filter (where e.event_type = 'consent_decline')::bigint as declines
  from public.analytics_events e
  where e.event_type in ('consent_accept', 'consent_decline')
    and e.created_at >= p_since
    and e.created_at <  p_until
  group by 1
  order by 1;
end;
$$;

revoke all on function public.analytics_consent_daily(timestamptz, timestamptz, text) from public;
revoke all on function public.analytics_consent_daily(timestamptz, timestamptz, text) from anon;
grant execute on function public.analytics_consent_daily(timestamptz, timestamptz, text) to authenticated, service_role;