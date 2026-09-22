-- Formulário de orçamento (/diagnostico): dois campos de qualificação e atribuição
-- pedidos no plano "Copy e estrutura vs. Decorafit e Obrafy" (22/09/2026):
--   lead_source  = "Como conheceu a Bewild?" (Indicação · Instagram · Google · Placa de obra ·
--                  Corretor ou imobiliária · Outro) — ~97% das vendas não tinham origem registrada.
--   lives_in_sp  = "Você mora em São Paulo capital?" — ~48% dos clientes moram fora da capital.
-- Aplicada em produção em 22/09/2026 (ALTER idempotente); notify-lead grava os dois e os envia ao CRM.
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS lead_source text,
  ADD COLUMN IF NOT EXISTS lives_in_sp boolean;

COMMENT ON COLUMN public.leads.lead_source IS 'Origem declarada pelo lead no formulário ("Como conheceu a Bewild?").';
COMMENT ON COLUMN public.leads.lives_in_sp IS 'Lead mora em São Paulo capital (declarado no formulário).';
