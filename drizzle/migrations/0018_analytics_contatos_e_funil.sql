-- Auditoria do /admin/analytics (18/11/2026).
--
-- 1) analytics_sessions: "conversões" passa a ser o número de CANAIS de
--    contato usados na sessão (WhatsApp, telefone, e-mail, formulário), de 0
--    a 4. Antes era a soma de eventos: uma sessão com 14 cliques no WhatsApp
--    valia 14 conversões (21/10/2026), e o clique no telefone (`click_phone`)
--    nem entrava. `converted` e `is_bounce` passam a considerar o telefone.
--    Mesmas colunas, na mesma ordem: as RPCs que leem a view seguem iguais.
CREATE OR REPLACE VIEW public.analytics_sessions
WITH (security_invoker = true) AS
WITH s AS (
  SELECT
    session_id,
    min(visitor_id)    FILTER (WHERE visitor_id IS NOT NULL)    AS visitor_id,
    min(created_at)                                              AS started_at,
    max(created_at)                                              AS ended_at,
    min(landing_path)  FILTER (WHERE landing_path IS NOT NULL)  AS landing_path,
    min(referrer_host) FILTER (WHERE referrer_host IS NOT NULL) AS referrer_host,
    min(utm_source)    FILTER (WHERE utm_source IS NOT NULL)    AS utm_source,
    min(utm_medium)    FILTER (WHERE utm_medium IS NOT NULL)    AS utm_medium,
    min(utm_campaign)  FILTER (WHERE utm_campaign IS NOT NULL)  AS utm_campaign,
    min(device)        FILTER (WHERE device IS NOT NULL)        AS device,
    min(country)       FILTER (WHERE country IS NOT NULL)       AS country,
    count(*) FILTER (WHERE event_type = 'pageview')              AS pageviews,
    count(DISTINCT event_type) FILTER (WHERE event_type IN (
        'click_contact','click_whatsapp','click_phone','form_submit'
      ))                                                          AS conversions,
    bool_or(event_type IN ('click_contact','click_whatsapp','click_phone','form_submit'))
                                                                  AS converted,
    coalesce(sum(duration_ms) FILTER (WHERE event_type = 'engagement_time'), 0)::int AS engagement_ms
  FROM public.analytics_events
  WHERE session_id IS NOT NULL
  GROUP BY session_id
)
SELECT
  session_id,
  visitor_id,
  started_at,
  ended_at,
  extract(epoch FROM (ended_at - started_at))::int AS duration_s,
  engagement_ms,
  landing_path,
  referrer_host,
  utm_source, utm_medium, utm_campaign,
  device, country,
  pageviews,
  conversions,
  converted,
  (pageviews <= 1 AND NOT converted) AS is_bounce
FROM s;

-- 2) analytics_funnel_v2: funil sequencial de verdade, por página vista.
--    O funil antigo pedia `portfolio_view` e `project_view`, que nenhuma
--    página emite (sempre 0), e contava cada passo por conta própria (o passo
--    4 podia passar do 3: "perda: −1 sessões"). Aqui cada passo só conta a
--    sessão que fez o passo anterior ANTES, então o número nunca sobe:
--      1 visita    → qualquer pageview
--      2 portfólio → pageview em /portfolio ou /portfolio/<slug>
--      3 projeto   → pageview em /portfolio/<slug>
--      4 contato   → WhatsApp, telefone, e-mail ou formulário enviado
CREATE OR REPLACE FUNCTION public.analytics_funnel_v2(p_since timestamptz, p_until timestamptz)
 RETURNS TABLE(step integer, step_key text, sessions bigint)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  return query
  with ev as (
    select e.session_id, e.event_type, e.created_at,
           rtrim(split_part(coalesce(e.path, ''), '?', 1), '/') as p
    from public.analytics_events e
    where e.created_at >= p_since and e.created_at < p_until
      and e.session_id is not null
      and e.event_type in ('pageview','click_contact','click_whatsapp','click_phone','form_submit')
  ),
  s1 as (
    select ev.session_id, min(ev.created_at) as t
    from ev where ev.event_type = 'pageview'
    group by ev.session_id
  ),
  s2 as (
    select ev.session_id, min(ev.created_at) as t
    from ev join s1 using (session_id)
    where ev.event_type = 'pageview' and (ev.p = '/portfolio' or ev.p like '/portfolio/_%')
      and ev.created_at >= s1.t
    group by ev.session_id
  ),
  s3 as (
    select ev.session_id, min(ev.created_at) as t
    from ev join s2 using (session_id)
    where ev.event_type = 'pageview' and ev.p like '/portfolio/_%'
      and ev.created_at >= s2.t
    group by ev.session_id
  ),
  s4 as (
    select ev.session_id
    from ev join s3 using (session_id)
    where ev.event_type in ('click_contact','click_whatsapp','click_phone','form_submit')
      and ev.created_at >= s3.t
    group by ev.session_id
  )
  select 1, 'visita'::text,    (select count(*) from s1)::bigint
  union all
  select 2, 'portfolio'::text, (select count(*) from s2)::bigint
  union all
  select 3, 'projeto'::text,   (select count(*) from s3)::bigint
  union all
  select 4, 'contato'::text,   (select count(*) from s4)::bigint
  order by 1;
end;
$function$;

REVOKE ALL ON FUNCTION public.analytics_funnel_v2(timestamptz, timestamptz) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.analytics_funnel_v2(timestamptz, timestamptz) TO authenticated;
