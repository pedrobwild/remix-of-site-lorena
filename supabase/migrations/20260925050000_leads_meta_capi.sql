-- Meta Conversions API (CAPI): rastreamento de Lead e QualifiedLead.
--
-- Contexto: o Pixel só carregava após o aceite de cookies e só disparava
-- PageView; a Meta nunca recebia `Lead`. Agora:
--   - notify-lead grava o `event_id` usado no Pixel (dedupe) e os cookies
--     `_fbp`/`_fbc` do browser, e envia `Lead` pela CAPI;
--   - meta-lead-quality envia `QualifiedLead` quando o painel marca o lead
--     como qualificado, reaproveitando `fbp`/`fbc` + e-mail/telefone (hash).
-- As colunas `*_sent_at` servem de trilha: o painel e o SQL mostram quais
-- leads a Meta recebeu (e tornam o envio de QualifiedLead idempotente).
-- ALTER idempotente; notify-lead tolera o banco sem as colunas (fallback).
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS meta_event_id text,
  ADD COLUMN IF NOT EXISTS fbp text,
  ADD COLUMN IF NOT EXISTS fbc text,
  ADD COLUMN IF NOT EXISTS meta_lead_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS meta_qualified_sent_at timestamptz;

COMMENT ON COLUMN public.leads.meta_event_id IS 'event_id do Lead no Meta Pixel; repetido na Conversions API para deduplicação.';
COMMENT ON COLUMN public.leads.fbp IS 'Cookie _fbp (id do browser no Meta Pixel) no momento do envio.';
COMMENT ON COLUMN public.leads.fbc IS 'Cookie _fbc (clique no anúncio Meta) ou fb.1.<ts>.<fbclid> reconstruído.';
COMMENT ON COLUMN public.leads.meta_lead_sent_at IS 'Quando o evento Lead foi aceito pela Meta Conversions API.';
COMMENT ON COLUMN public.leads.meta_qualified_sent_at IS 'Quando o evento QualifiedLead foi aceito pela Meta Conversions API.';
