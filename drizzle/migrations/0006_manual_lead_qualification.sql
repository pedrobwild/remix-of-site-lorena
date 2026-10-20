ALTER TABLE public.leads ADD COLUMN manual_qualification text CHECK (manual_qualification IN ('qualificado', 'descartado'));
COMMENT ON COLUMN public.leads.manual_qualification IS 'Decisão manual de qualidade; prevalece sobre o status automático sem alterar os campos crm_*.';
CREATE OR REPLACE FUNCTION public.preserve_manual_lead_qualification() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.manual_qualification IS NOT NULL THEN NEW.status := NEW.manual_qualification; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER preserve_manual_lead_qualification BEFORE INSERT OR UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.preserve_manual_lead_qualification();
CREATE OR REPLACE FUNCTION public.set_manual_lead_qualification(p_lead_id uuid, p_status text) RETURNS text LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE v_lead public.leads%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN RAISE EXCEPTION 'Acesso restrito a administradores.' USING ERRCODE = '42501'; END IF;
  IF p_status IS NULL OR p_status NOT IN ('qualificado','descartado') THEN RAISE EXCEPTION 'Qualificação inválida.' USING ERRCODE = '22023'; END IF;
  SELECT * INTO v_lead FROM public.leads WHERE id = p_lead_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lead não encontrado.' USING ERRCODE = 'P0002'; END IF;
  IF v_lead.manual_qualification IS NOT DISTINCT FROM p_status THEN RETURN p_status; END IF;
  UPDATE public.leads SET manual_qualification = p_status, status = p_status WHERE id = p_lead_id;
  INSERT INTO public.lead_qualification_log(lead_id, from_status, to_status, note, changed_by, changed_by_email)
  VALUES(p_lead_id, v_lead.status, p_status, CASE WHEN p_status = 'qualificado' THEN 'Qualificação manual: qualificado' ELSE 'Qualificação manual: não qualificado' END, auth.uid(), auth.jwt()->>'email');
  RETURN p_status;
END;
$$;
REVOKE ALL ON FUNCTION public.set_manual_lead_qualification(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_manual_lead_qualification(uuid,text) TO authenticated;
GRANT ALL ON FUNCTION public.set_manual_lead_qualification(uuid,text) TO service_role;