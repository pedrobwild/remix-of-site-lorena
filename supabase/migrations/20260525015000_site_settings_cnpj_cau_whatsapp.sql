-- A6: consolidate hardcoded CNPJ / CAU / WhatsApp into site_settings.
-- Until now these lived as literals in App.tsx footer, useSeo JSON-LD, and
-- the privacy policy page. Centralising lets the admin update them without
-- a code change and keeps the public site, the structured data, and the
-- legal text in sync.
--
-- =====================================================================
-- ATENÇÃO — corrigido em 22/09/2026 (auditoria, DB-02 + SEO-11).
-- =====================================================================
-- Esta migration NUNCA foi aplicada em produção: `site_settings` não tem
-- as colunas cnpj/cau/whatsapp_number e a versão 20260525015000 não
-- aparece em supabase_migrations.schema_migrations.
--
-- O seed original semeava os dados do site ANTERIOR — CNPJ
-- 05.119.224/0001-30, CAU A66583-5, WhatsApp 5534996668215. Aplicada como
-- estava, ela gravaria esses valores no banco e o site passaria a
-- publicá-los em JSON-LD (organizationJsonLd é usada em /diagnostico) e
-- no wa.me do CTA. Os literais abaixo agora são os oficiais da Bewild
-- (decisão de 17/09/2026), iguais aos DEFAULTS de
-- src/lib/useSiteSettings.ts e travados por
-- src/lib/__tests__/identidadeOficial.test.ts.
--
-- STATUS: PREPARADA, NÃO APLICADA. Ordem e rollback em
-- docs/auditoria/rodada-2026-09-22.md (seção DB-02).
-- =====================================================================

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS cnpj            text,
  ADD COLUMN IF NOT EXISTS cau             text,
  ADD COLUMN IF NOT EXISTS whatsapp_number text;

COMMENT ON COLUMN public.site_settings.cnpj IS
  'CNPJ formatado (ex: 47.350.338/0001-37). Exibido no footer e em JSON-LD PropertyValue.';
COMMENT ON COLUMN public.site_settings.cau IS
  'Registro CAU do responsavel tecnico (ex: A162437-7). Exibido no footer e em JSON-LD PropertyValue.';
COMMENT ON COLUMN public.site_settings.whatsapp_number IS
  'Numero E.164 sem +/espacos (ex: 5511911906183). Usado para construir wa.me URL no CTA.';

-- Seed do registro existente com os dados oficiais da Bewild.
-- COALESCE preserva qualquer valor que o admin tenha entrado antes desta migration.
UPDATE public.site_settings
SET
  cnpj            = COALESCE(cnpj,            '47.350.338/0001-37'),
  cau             = COALESCE(cau,             'A162437-7'),
  whatsapp_number = COALESCE(whatsapp_number, '5511911906183')
WHERE id = 1;
