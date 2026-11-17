CREATE OR REPLACE FUNCTION public.analytics_breakdown(p_since timestamptz, p_until timestamptz, p_dim text, p_limit integer DEFAULT 25)
 RETURNS TABLE(dim text, sessions bigint, conversions bigint, bounce_rate numeric, avg_duration_s numeric)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if p_dim not in ('utm_source','utm_medium','utm_campaign','referrer_host','landing_path','device','country') then
    raise exception 'invalid dimension';
  end if;
  return query
  select coalesce(nullif(case p_dim
           when 'utm_source' then s.utm_source::text
           when 'utm_medium' then s.utm_medium::text
           when 'utm_campaign' then s.utm_campaign::text
           when 'referrer_host' then s.referrer_host::text
           when 'landing_path' then s.landing_path::text
           when 'device' then s.device::text
           when 'country' then s.country::text end, ''), '(n/a)') as dim,
         count(*)::bigint,
         sum(s.conversions)::bigint,
         round(avg(case when s.is_bounce then 1 else 0 end)::numeric, 4),
         round(avg(s.duration_s)::numeric, 1)
  from public.analytics_sessions s
  where s.started_at >= p_since and s.started_at < p_until
  group by 1
  order by 2 desc
  limit p_limit;
end;
$function$;

CREATE OR REPLACE FUNCTION public.analytics_timeseries_v2(p_since timestamptz, p_until timestamptz, p_grain text, p_tz text, p_device text DEFAULT NULL, p_country text DEFAULT NULL, p_utm_source text DEFAULT NULL, p_utm_medium text DEFAULT NULL, p_utm_campaign text DEFAULT NULL, p_landing_path text DEFAULT NULL, p_referrer_host text DEFAULT NULL)
 RETURNS TABLE(bucket timestamptz, sessions bigint, visitors bigint, pageviews bigint, conversions bigint)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if p_grain not in ('hour','day','week','month') then raise exception 'invalid grain'; end if;
  if p_tz is null or p_tz !~ '^[A-Za-z0-9_+./-]{1,64}$' then raise exception 'invalid timezone'; end if;
  return query
  select (date_trunc(p_grain, s.started_at at time zone p_tz) at time zone p_tz) as bucket,
         count(*)::bigint,
         count(distinct s.visitor_id)::bigint,
         coalesce(sum(s.pageviews), 0)::bigint,
         coalesce(sum(s.conversions), 0)::bigint
  from public.analytics_sessions s
  where s.started_at >= p_since and s.started_at < p_until
    and (p_device is null or s.device = p_device)
    and (p_country is null or s.country = p_country)
    and (p_utm_source is null or s.utm_source = p_utm_source)
    and (p_utm_medium is null or s.utm_medium = p_utm_medium)
    and (p_utm_campaign is null or s.utm_campaign = p_utm_campaign)
    and (p_landing_path is null or s.landing_path = p_landing_path)
    and (p_referrer_host is null or s.referrer_host = p_referrer_host)
  group by 1
  order by 1;
end;
$function$;