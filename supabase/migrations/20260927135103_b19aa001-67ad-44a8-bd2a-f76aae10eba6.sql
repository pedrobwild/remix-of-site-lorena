CREATE OR REPLACE FUNCTION public.analytics_consent_daily(
  p_since timestamp with time zone,
  p_until timestamp with time zone,
  p_tz text DEFAULT 'America/Sao_Paulo'
)
RETURNS TABLE(day text, accepts bigint, declines bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    to_char(date_trunc('day', created_at AT TIME ZONE p_tz), 'YYYY-MM-DD') AS day,
    count(*) FILTER (WHERE event_type = 'consent_accept') AS accepts,
    count(*) FILTER (WHERE event_type = 'consent_decline') AS declines
  FROM public.analytics_events
  WHERE public.is_admin()
    AND event_type IN ('consent_accept', 'consent_decline')
    AND created_at >= p_since
    AND created_at < p_until
  GROUP BY 1
  ORDER BY 1;
$$;