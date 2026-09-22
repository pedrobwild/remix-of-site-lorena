CREATE TABLE public.lead_qualification_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  note text,
  changed_by uuid,
  changed_by_email text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX lead_qualification_log_lead_idx ON public.lead_qualification_log (lead_id, created_at DESC);

GRANT SELECT, INSERT ON public.lead_qualification_log TO authenticated;
GRANT ALL ON public.lead_qualification_log TO service_role;

ALTER TABLE public.lead_qualification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read lead qualification log"
  ON public.lead_qualification_log FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "admins insert lead qualification log"
  ON public.lead_qualification_log FOR INSERT TO authenticated
  WITH CHECK (is_admin());