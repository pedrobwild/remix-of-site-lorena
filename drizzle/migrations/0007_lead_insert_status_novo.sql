CREATE OR REPLACE FUNCTION public.force_new_lead_status()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  -- Lead novo sempre nasce "novo"; qualificação só muda depois, pelo painel ou CRM.
  NEW.status := 'novo';
  NEW.manual_qualification := NULL;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS a_force_new_lead_status ON public.leads;
CREATE TRIGGER a_force_new_lead_status BEFORE INSERT ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.force_new_lead_status();
REVOKE INSERT ON public.leads FROM anon, authenticated;