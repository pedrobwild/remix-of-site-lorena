-- Caixa de saída do site (09/11/2026, depois do backend pausado de 06 a 08/11):
-- o navegador guarda o pedido sem confirmação e reenvia com o mesmo id.
-- O notify-lead consulta esta coluna antes de gravar e não repete Slack,
-- CRM, e-mail nem API de Conversões para um id já gravado.
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS submission_id text;
COMMENT ON COLUMN public.leads.submission_id IS 'Id do envio gerado no navegador (UUID); reenvios da caixa de saída do site usam o mesmo id e são deduplicados pelo notify-lead.';
CREATE UNIQUE INDEX IF NOT EXISTS leads_submission_id_key ON public.leads (submission_id) WHERE submission_id IS NOT NULL;
