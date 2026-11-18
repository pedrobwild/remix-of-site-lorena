CREATE OR REPLACE FUNCTION public.analytics_timeseries(p_since timestamptz, p_until timestamptz, p_grain text DEFAULT 'day'::text)
RETURNS TABLE(bucket timestamptz, sessions bigint, pageviews bigint, conversions bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  if p_grain not in ('hour','day','week','month') then
    raise exception 'invalid grain';
  end if;
  return query
  select date_trunc(p_grain, s.started_at) as bucket,
         count(*)::bigint as sessions,
         sum(s.pageviews)::bigint as pageviews,
         sum(s.conversions)::bigint as conversions
  from public.analytics_sessions s
  where s.started_at >= p_since and s.started_at < p_until
  group by 1
  order by 1;
end;
$function$;
REVOKE ALL ON FUNCTION public.analytics_timeseries(timestamptz, timestamptz, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.analytics_timeseries(timestamptz, timestamptz, text) TO authenticated, service_role;