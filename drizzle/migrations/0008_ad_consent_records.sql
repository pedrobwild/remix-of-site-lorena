CREATE TABLE public.ad_consent_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_key text NOT NULL CHECK (visitor_key ~ '^[0-9a-f-]{36}$'),
  choice text NOT NULL CHECK (choice IN ('accepted','declined')),
  advertising boolean NOT NULL,
  notice_version text NOT NULL CHECK (char_length(notice_version) BETWEEN 1 AND 20),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ad_consent_records_visitor_idx ON public.ad_consent_records (visitor_key, created_at DESC);
GRANT SELECT ON public.ad_consent_records TO authenticated;
GRANT ALL ON public.ad_consent_records TO service_role;
ALTER TABLE public.ad_consent_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view consent records" ON public.ad_consent_records FOR SELECT TO authenticated USING (public.is_admin());

-- Grava a escolha do aviso de cookies. Público, mas só aceita valores fechados;
-- `advertising` sai da própria escolha, nunca do navegador.
CREATE OR REPLACE FUNCTION public.record_ad_consent(p_visitor_key text, p_choice text, p_notice_version text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_id uuid;
BEGIN
  IF p_visitor_key IS NULL OR p_visitor_key !~ '^[0-9a-f-]{36}$' THEN RAISE EXCEPTION 'invalid visitor' USING ERRCODE = '22023'; END IF;
  IF p_choice NOT IN ('accepted','declined') THEN RAISE EXCEPTION 'invalid choice' USING ERRCODE = '22023'; END IF;
  IF p_notice_version IS NULL OR p_notice_version !~ '^v[0-9]{1,4}$' THEN RAISE EXCEPTION 'invalid version' USING ERRCODE = '22023'; END IF;
  IF NOT public.hit_rate_limit('consent:' || p_visitor_key, 60, 20) THEN RAISE EXCEPTION 'rate limited' USING ERRCODE = '54000'; END IF;
  INSERT INTO public.ad_consent_records (visitor_key, choice, advertising, notice_version)
  VALUES (p_visitor_key, p_choice, p_choice = 'accepted', p_notice_version) RETURNING id INTO v_id;
  RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.record_ad_consent(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_ad_consent(text, text, text) TO anon, authenticated;

ALTER TABLE public.leads ADD COLUMN consent_record_id uuid REFERENCES public.ad_consent_records(id);
ALTER TABLE public.leads ADD COLUMN consent_visitor_key text;