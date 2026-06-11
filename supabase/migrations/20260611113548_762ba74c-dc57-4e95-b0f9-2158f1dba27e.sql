
CREATE TABLE public.diagnostic_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT,
  neighborhood TEXT,
  square_meters INTEGER,
  property_type TEXT,
  timeframe TEXT,
  budget_range TEXT,
  scope TEXT[] DEFAULT '{}'::text[],
  message TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referrer TEXT,
  landing_path TEXT,
  user_agent TEXT,
  status TEXT NOT NULL DEFAULT 'novo',
  internal_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT diagnostic_leads_status_check CHECK (status IN ('novo','contatado','qualificado','perdido','ganho'))
);

GRANT INSERT ON public.diagnostic_leads TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.diagnostic_leads TO authenticated;
GRANT ALL ON public.diagnostic_leads TO service_role;

ALTER TABLE public.diagnostic_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a diagnostic lead"
  ON public.diagnostic_leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view diagnostic leads"
  ON public.diagnostic_leads FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can update diagnostic leads"
  ON public.diagnostic_leads FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete diagnostic leads"
  ON public.diagnostic_leads FOR DELETE
  TO authenticated
  USING (public.is_admin());

CREATE INDEX idx_diagnostic_leads_created_at ON public.diagnostic_leads (created_at DESC);
CREATE INDEX idx_diagnostic_leads_status ON public.diagnostic_leads (status);

CREATE TRIGGER set_diagnostic_leads_updated_at
  BEFORE UPDATE ON public.diagnostic_leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
