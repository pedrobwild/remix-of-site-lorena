-- Fila de envio ao Bwild Engine das marcações manuais feitas no painel do site.
-- Cada mudança real de qualificação com origem "site" vira um evento com UUID e
-- horário fixos (o corpo nunca é remontado nas tentativas). Marcações que vieram do
-- Engine (source = 'engine') não entram: nunca voltam ao Engine.
CREATE TABLE public.engine_quality_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  decision text NOT NULL CHECK (decision IN ('qualificado','descartado')),
  marked_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','skipped','failed','superseded')),
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  outcome text,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);
CREATE INDEX engine_quality_outbox_pending_idx ON public.engine_quality_outbox (next_attempt_at, marked_at) WHERE status = 'pending';
CREATE INDEX engine_quality_outbox_lead_idx ON public.engine_quality_outbox (lead_id, marked_at DESC);
GRANT SELECT ON public.engine_quality_outbox TO authenticated;
GRANT ALL ON public.engine_quality_outbox TO service_role;
REVOKE ALL ON public.engine_quality_outbox FROM anon;
ALTER TABLE public.engine_quality_outbox ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins veem a fila do Engine" ON public.engine_quality_outbox FOR SELECT TO authenticated USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.queue_engine_quality_event() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.manual_qualification IS NULL OR NEW.manual_qualification_source IS DISTINCT FROM 'site' OR NEW.manual_qualification_at IS NULL THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE'
     AND NEW.manual_qualification IS NOT DISTINCT FROM OLD.manual_qualification
     AND NEW.manual_qualification_source IS NOT DISTINCT FROM OLD.manual_qualification_source
     AND NEW.manual_qualification_at IS NOT DISTINCT FROM OLD.manual_qualification_at THEN
    RETURN NEW;
  END IF;
  -- Só a marcação mais nova importa: pendências antigas do mesmo lead saem da fila.
  UPDATE public.engine_quality_outbox SET status = 'superseded'
   WHERE lead_id = NEW.id AND status = 'pending' AND marked_at <= NEW.manual_qualification_at;
  INSERT INTO public.engine_quality_outbox (lead_id, decision, marked_at)
  VALUES (NEW.id, NEW.manual_qualification, NEW.manual_qualification_at);
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.queue_engine_quality_event() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER queue_engine_quality_event
AFTER INSERT OR UPDATE OF manual_qualification, manual_qualification_source, manual_qualification_at ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.queue_engine_quality_event();
