ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS meta_lead_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS meta_qualified_sent_at timestamptz;

COMMENT ON COLUMN public.leads.meta_lead_sent_at IS 'Quando o evento Lead foi aceito pela Meta Conversions API.';
COMMENT ON COLUMN public.leads.meta_qualified_sent_at IS 'Quando o evento QualifiedLead foi aceito pela Meta Conversions API.';