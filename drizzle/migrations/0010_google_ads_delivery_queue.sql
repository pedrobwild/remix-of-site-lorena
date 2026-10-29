CREATE TABLE public.google_ads_delivery_settings (id boolean PRIMARY KEY DEFAULT true CHECK (id), enabled boolean NOT NULL DEFAULT false, qualification_import_disabled boolean NOT NULL DEFAULT false, activated_at timestamptz);
GRANT SELECT ON public.google_ads_delivery_settings TO authenticated;
GRANT ALL ON public.google_ads_delivery_settings TO service_role;
ALTER TABLE public.google_ads_delivery_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins consultam envio Google Ads" ON public.google_ads_delivery_settings FOR SELECT TO authenticated USING (public.is_admin());
CREATE TABLE public.google_ads_delivery_queue (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE, kind text NOT NULL CHECK (kind IN ('request','qualified')), event_at timestamptz NOT NULL, transaction_id text NOT NULL, dedup_key text NOT NULL UNIQUE, callback_token uuid NOT NULL DEFAULT gen_random_uuid(), state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','processing','accepted','blocked','failed')), attempts integer NOT NULL DEFAULT 0, next_attempt_at timestamptz NOT NULL DEFAULT now(), lease_until timestamptz, request_id text, outcome text, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT (id,lead_id,kind,event_at,transaction_id,state,attempts,next_attempt_at,outcome,created_at) ON public.google_ads_delivery_queue TO authenticated;
GRANT ALL ON public.google_ads_delivery_queue TO service_role;
ALTER TABLE public.google_ads_delivery_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins consultam resultados Google Ads" ON public.google_ads_delivery_queue FOR SELECT TO authenticated USING (public.is_admin());
CREATE INDEX google_ads_delivery_pending_idx ON public.google_ads_delivery_queue(next_attempt_at) WHERE state IN ('pending','processing');
CREATE OR REPLACE FUNCTION public.wake_google_ads_delivery() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$ BEGIN
 IF EXISTS (SELECT 1 FROM public.google_ads_delivery_settings WHERE enabled AND qualification_import_disabled) THEN
 PERFORM net.http_post(url := 'https://bewild.com.br/api/public/google-ads-delivery', headers := '{"Content-Type":"application/json"}'::jsonb, body := jsonb_build_object('id',NEW.id,'token',NEW.callback_token), timeout_milliseconds := 30000);
 END IF; RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.wake_google_ads_delivery() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER wake_google_ads_delivery AFTER INSERT ON public.google_ads_delivery_queue FOR EACH ROW EXECUTE FUNCTION public.wake_google_ads_delivery();
CREATE OR REPLACE FUNCTION public.queue_google_ads_delivery() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE l public.leads; k text; event_time timestamptz; person text; tx text; activation timestamptz;
BEGIN
 SELECT activated_at INTO activation FROM public.google_ads_delivery_settings WHERE enabled AND qualification_import_disabled;
 IF activation IS NULL THEN RETURN NEW; END IF;
 IF TG_TABLE_NAME = 'leads' THEN l := NEW; k := 'request'; event_time := l.created_at;
 ELSE
  IF NEW.to_status <> 'qualificado' THEN RETURN NEW; END IF;
  IF NEW.note LIKE 'CRM:%' AND (NEW.note !~ '^CRM: (.* → |entrou em ).+$' OR lower(trim(regexp_replace(NEW.note,'^CRM: (.* → |entrou em )',''))) IN ('mql','qualificação','perdido','aquecer futuramente')) THEN RETURN NEW; END IF;
  SELECT * INTO l FROM public.leads WHERE id = NEW.lead_id;
  k := 'qualified'; event_time := NEW.created_at;
 END IF;
 IF l.id IS NULL OR event_time < activation OR l.created_at < activation OR l.consent_marketing IS DISTINCT FROM true OR l.objetivo NOT IN ('Short stay','Locação tradicional','Uso misto') OR l.form_path NOT IN ('/orcamento','/diagnostico','/contato','/o','/p') THEN RETURN NEW; END IF;
 IF k = 'qualified' AND l.status <> 'qualificado' THEN RETURN NEW; END IF;
 person := CASE WHEN trim(coalesce(l.email,'')) <> '' THEN 'email:' || lower(trim(l.email)) ELSE 'phone:' || regexp_replace(coalesce(l.whatsapp,''),'[^0-9]','','g') END;
 tx := CASE WHEN k = 'request' THEN coalesce(nullif(l.event_id,''),'lead-' || l.id::text) ELSE 'qualified-' || encode(digest(person,'sha256'),'hex') END;
 INSERT INTO public.google_ads_delivery_queue(lead_id,kind,event_at,transaction_id,dedup_key) VALUES(l.id,k,event_time,tx,k || ':' || CASE WHEN k='request' THEN tx ELSE encode(digest(person,'sha256'),'hex') END) ON CONFLICT(dedup_key) DO NOTHING;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.queue_google_ads_delivery() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER queue_google_ads_request AFTER INSERT ON public.leads FOR EACH ROW EXECUTE FUNCTION public.queue_google_ads_delivery();
CREATE TRIGGER queue_google_ads_qualification AFTER INSERT ON public.lead_qualification_log FOR EACH ROW EXECUTE FUNCTION public.queue_google_ads_delivery();
CREATE OR REPLACE FUNCTION public.claim_google_ads_delivery(p_id uuid,p_token uuid) RETURNS SETOF public.google_ads_delivery_queue LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$ UPDATE public.google_ads_delivery_queue SET state='processing',attempts=attempts+1,lease_until=now()+interval '2 minutes' WHERE id=p_id AND callback_token=p_token AND next_attempt_at<=now() AND (state='pending' OR (state='processing' AND lease_until<now())) AND EXISTS(SELECT 1 FROM public.google_ads_delivery_settings WHERE enabled AND qualification_import_disabled) RETURNING *; $$;
REVOKE ALL ON FUNCTION public.claim_google_ads_delivery(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_google_ads_delivery(uuid,uuid) TO service_role;