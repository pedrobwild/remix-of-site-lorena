CREATE OR REPLACE FUNCTION public.prepare_search_console_daily_job(p_secret text)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id bigint;
BEGIN
 IF NOT public.is_admin() THEN RAISE EXCEPTION 'admin required'; END IF;
 IF length(p_secret) < 32 THEN RAISE EXCEPTION 'invalid secret'; END IF;
 SELECT jobid INTO v_id FROM cron.job WHERE jobname = 'search-console-daily-snapshot';
 IF v_id IS NOT NULL THEN RETURN v_id; END IF;
 SELECT cron.schedule('search-console-daily-snapshot', '15 7 * * *', format('SELECT net.http_post(url := %L, headers := %L::jsonb, body := %L::jsonb);', 'https://bewild.lovable.app/api/public/search-console-refresh', jsonb_build_object('Content-Type','application/json','x-search-console-secret',p_secret)::text, '{}')) INTO v_id;
 PERFORM cron.alter_job(v_id, active := false);
 RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.prepare_search_console_daily_job(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.prepare_search_console_daily_job(text) TO authenticated;