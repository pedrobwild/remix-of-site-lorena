ALTER TABLE public.leads
  ADD COLUMN manual_qualification_source text CHECK (manual_qualification_source IN ('site','engine')),
  ADD COLUMN manual_qualification_at timestamptz,
  ADD COLUMN manual_qualification_reason text CHECK (manual_qualification_reason IN ('imovel_antigo','fora_regiao','orcamento_incompativel','escopo_fora','nao_decisor','contato_invalido','outro'));
COMMENT ON COLUMN public.leads.manual_qualification_source IS 'Quem marcou a qualificação: site (painel) ou engine (Bwild Engine). Marcações engine nunca voltam ao Engine.';
COMMENT ON COLUMN public.leads.manual_qualification_at IS 'Instante da marcação mais recente; vale a mais nova entre site e Engine.';
COMMENT ON COLUMN public.leads.manual_qualification_reason IS 'Categoria do motivo de desqualificação enviada pelo Engine.';
UPDATE public.leads SET manual_qualification_source = 'site', manual_qualification_at = updated_at WHERE manual_qualification IS NOT NULL;
CREATE OR REPLACE FUNCTION public.force_new_lead_status() RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $function$
BEGIN
  NEW.status := 'novo';
  NEW.manual_qualification := NULL;
  NEW.manual_qualification_source := NULL;
  NEW.manual_qualification_at := NULL;
  NEW.manual_qualification_reason := NULL;
  RETURN NEW;
END $function$;
CREATE OR REPLACE FUNCTION public.set_manual_lead_qualification(p_lead_id uuid, p_status text) RETURNS text LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE v_lead public.leads%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN RAISE EXCEPTION 'Acesso restrito a administradores.' USING ERRCODE = '42501'; END IF;
  IF p_status IS NULL OR p_status NOT IN ('qualificado','descartado') THEN RAISE EXCEPTION 'Qualificação inválida.' USING ERRCODE = '22023'; END IF;
  SELECT * INTO v_lead FROM public.leads WHERE id = p_lead_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lead não encontrado.' USING ERRCODE = 'P0002'; END IF;
  IF v_lead.manual_qualification IS NOT DISTINCT FROM p_status AND v_lead.manual_qualification_source = 'site' THEN RETURN p_status; END IF;
  UPDATE public.leads SET manual_qualification = p_status, status = p_status, manual_qualification_source = 'site', manual_qualification_at = now(), manual_qualification_reason = NULL WHERE id = p_lead_id;
  INSERT INTO public.lead_qualification_log(lead_id, from_status, to_status, note, changed_by, changed_by_email)
  VALUES(p_lead_id, v_lead.status, p_status, CASE WHEN p_status = 'qualificado' THEN 'Qualificação manual: qualificado' ELSE 'Qualificação manual: não qualificado' END, auth.uid(), auth.jwt()->>'email');
  RETURN p_status;
END;
$$;