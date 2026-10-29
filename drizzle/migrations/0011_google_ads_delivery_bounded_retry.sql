-- lovable-cron-fallback-reviewed: Event-scoped retry jobs only while queued, immediately removed on completion; no permanent sweeper.
CREATE OR REPLACE FUNCTION public.retry_google_ads_delivery(p_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE q public.google_ads_delivery_queue; job bigint; BEGIN
 SELECT * INTO q FROM public.google_ads_delivery_queue WHERE id=p_id;
 IF q.id IS NULL OR q.state NOT IN ('pending','processing') OR q.attempts>=6 OR NOT EXISTS(SELECT 1 FROM public.google_ads_delivery_settings WHERE enabled AND qualification_import_disabled) THEN
  SELECT jobid INTO job FROM cron.job WHERE jobname='google-ads-' || p_id::text;
  IF job IS NOT NULL THEN PERFORM cron.unschedule(job); END IF;
  RETURN;
 END IF;
 IF q.next_attempt_at<=now() AND (q.state='pending' OR q.lease_until<now()) THEN
  PERFORM net.http_post(url:='https://bewild.com.br/api/public/google-ads-delivery',headers:='{"Content-Type":"application/json"}'::jsonb,body:=jsonb_build_object('id',q.id,'token',q.callback_token),timeout_milliseconds:=30000);
 END IF;
END $$;
REVOKE ALL ON FUNCTION public.retry_google_ads_delivery(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.retry_google_ads_delivery(uuid) TO service_role;
CREATE OR REPLACE FUNCTION public.arm_google_ads_delivery() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 PERFORM cron.schedule('google-ads-' || NEW.id::text,'*/5 * * * *',format('SELECT public.retry_google_ads_delivery(%L::uuid)',NEW.id));
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.arm_google_ads_delivery() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER arm_google_ads_delivery AFTER INSERT ON public.google_ads_delivery_queue FOR EACH ROW EXECUTE FUNCTION public.arm_google_ads_delivery();
CREATE OR REPLACE FUNCTION public.finish_google_ads_delivery(p_id uuid,p_token uuid,p_state text,p_outcome text,p_request_id text,p_next timestamptz) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE job bigint; BEGIN
 IF p_state NOT IN ('pending','accepted','blocked','failed') THEN RAISE EXCEPTION 'invalid state'; END IF;
 UPDATE public.google_ads_delivery_queue SET state=p_state,outcome=left(p_outcome,120),request_id=p_request_id,next_attempt_at=p_next,lease_until=NULL WHERE id=p_id AND callback_token=p_token AND state='processing';
 IF FOUND AND p_state<>'pending' THEN SELECT jobid INTO job FROM cron.job WHERE jobname='google-ads-' || p_id::text; IF job IS NOT NULL THEN PERFORM cron.unschedule(job); END IF; END IF;
END $$;
REVOKE ALL ON FUNCTION public.finish_google_ads_delivery(uuid,uuid,text,text,text,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.finish_google_ads_delivery(uuid,uuid,text,text,text,timestamptz) TO service_role;