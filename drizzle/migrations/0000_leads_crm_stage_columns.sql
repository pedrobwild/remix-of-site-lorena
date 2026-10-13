ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS crm_stage_key text,
  ADD COLUMN IF NOT EXISTS crm_stage_name text,
  ADD COLUMN IF NOT EXISTS crm_max_stage_key text,
  ADD COLUMN IF NOT EXISTS crm_won boolean,
  ADD COLUMN IF NOT EXISTS crm_lost boolean,
  ADD COLUMN IF NOT EXISTS crm_deal_count integer,
  ADD COLUMN IF NOT EXISTS crm_last_change_at timestamptz,
  ADD COLUMN IF NOT EXISTS crm_synced_at timestamptz;

COMMENT ON COLUMN public.leads.crm_stage_key IS 'Etapa atual no funil do Bwild Engine (sincronizada por /api/public/crm-stage-sync).';
CREATE INDEX IF NOT EXISTS leads_crm_synced_at_idx ON public.leads (crm_synced_at DESC);
CREATE INDEX IF NOT EXISTS lead_qualification_log_lead_idx ON public.lead_qualification_log (lead_id, created_at);