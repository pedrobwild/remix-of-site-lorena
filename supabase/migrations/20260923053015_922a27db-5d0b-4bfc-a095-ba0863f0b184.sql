CREATE TABLE public.partner_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_name text NOT NULL,
  partner_type text,
  company text,
  document text,
  whatsapp text NOT NULL,
  email text,
  region text,
  units text,
  origin text,
  message text,
  client_name text,
  status text NOT NULL DEFAULT 'nova',
  commission_status text NOT NULL DEFAULT 'pendente',
  contract_value numeric(12,2),
  commission_amount numeric(12,2),
  internal_notes text,
  confirmed_at timestamptz,
  confirmed_by uuid,
  landing_path text,
  referrer text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.partner_referrals TO anon;
GRANT INSERT ON public.partner_referrals TO authenticated;
GRANT SELECT, UPDATE, DELETE ON public.partner_referrals TO authenticated;
GRANT ALL ON public.partner_referrals TO service_role;

ALTER TABLE public.partner_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer um pode enviar indicacao"
  ON public.partner_referrals FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Admins leem indicacoes"
  ON public.partner_referrals FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "Admins atualizam indicacoes"
  ON public.partner_referrals FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins apagam indicacoes"
  ON public.partner_referrals FOR DELETE TO authenticated USING (public.is_admin());

CREATE TRIGGER partner_referrals_set_updated_at
  BEFORE UPDATE ON public.partner_referrals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX partner_referrals_created_at_idx ON public.partner_referrals (created_at DESC);