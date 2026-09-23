-- Captura de drift (auditoria de 23/09/2026).
--
-- A coluna `seo_404_log.reason` e a sobrecarga `log_404(text, text, text)`
-- foram criadas em produção fora do repositório. A migration seguinte
-- (20260524195715) já as referencia, então um banco novo (branch, `supabase
-- db reset`) abortava com `column "reason" does not exist`.
-- Idempotente: em produção não muda nada. O corpo é o que está publicado; a
-- versão endurecida vem em 20260923060000_auditoria_endurecimento.sql.

ALTER TABLE public.seo_404_log ADD COLUMN IF NOT EXISTS reason text;

CREATE OR REPLACE FUNCTION public.log_404(p_path text, p_referrer text DEFAULT NULL, p_reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_path TEXT;
  v_reason TEXT;
BEGIN
  v_path := substring(coalesce(p_path, '/') from 1 for 500);
  v_reason := substring(coalesce(p_reason, '') from 1 for 80);
  IF v_reason = '' THEN v_reason := NULL; END IF;

  IF v_path IS NULL OR length(trim(v_path)) = 0 THEN
    RETURN;
  END IF;

  INSERT INTO public.seo_404_log (path, referrer, source, reason, hits, last_seen_at)
  VALUES (
    v_path,
    substring(coalesce(p_referrer, '') from 1 for 500),
    'auto',
    v_reason,
    1,
    now()
  )
  ON CONFLICT (path) DO UPDATE
    SET hits         = public.seo_404_log.hits + 1,
        last_seen_at = now(),
        referrer     = COALESCE(EXCLUDED.referrer, public.seo_404_log.referrer),
        reason       = COALESCE(EXCLUDED.reason, public.seo_404_log.reason);
END;
$function$;
