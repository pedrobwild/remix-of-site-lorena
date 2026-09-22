-- =====================================================================
-- LEAD-02 · Restringe o INSERT anônimo direto em `leads`
-- =====================================================================
-- STATUS: PREPARADA, NÃO APLICADA (auditoria de 22/09/2026).
--
-- Estado atual em produção (pg_policies):
--
--   "Anyone can submit a lead" | INSERT | roles {public} | WITH CHECK (true)
--
-- Ou seja: qualquer um com a chave `anon` (que é pública por natureza, está
-- no bundle) pode fazer POST em /rest/v1/leads e inserir o que quiser,
-- quantas vezes quiser, em qualquer coluna — inclusive `status` e
-- `internal_notes`, que são campos de operação do time comercial.
--
-- O caminho legítimo do site NÃO usa essa policy: o formulário chama a edge
-- function `notify-lead`, que grava com a SERVICE ROLE KEY (ignora RLS) e,
-- desde LEAD-07, valida tamanho de corpo e trunca cada campo. A policy é um
-- caminho paralelo sem nenhuma dessas proteções.
--
-- Mesmo padrão já aplicado a analytics_events
-- (20260525015100), seo_404_log (20260531090000) e crash_reports
-- (20260531120000) — as três, aliás, também ainda não aplicadas (DB-02).
--
-- Dependência / ordem
-- -------------------
-- Aplicar SOMENTE depois de confirmar que `notify-lead` está publicada e
-- respondendo `lead_insert.status = "sent"`. Verificação, com um lead real
-- ou de teste enviado pelo formulário:
--
--   select id, name, created_at from public.leads order by created_at desc limit 3;
--
-- Se a função estiver fora do ar quando esta migration for aplicada, o
-- formulário ainda abre o WhatsApp com os dados (fallback de LEAD-01) e a
-- interface avisa honestamente que não registrou — nenhum lead some sem
-- aviso, mas a gravação automática para. Por isso: função primeiro.
--
-- Verificação depois de aplicar
-- -----------------------------
--   -- 1) a policy permissiva não existe mais
--   select policyname, cmd, roles::text, with_check
--     from pg_policies where tablename = 'leads';
--   -- esperado: só as três policies de admin (SELECT/UPDATE/DELETE)
--
--   -- 2) INSERT direto pela REST com a chave anon deve responder 401/403
--   --    curl -s -o /dev/null -w '%{http_code}\n' -X POST \
--   --      'https://aamlnkmqvjcowixdgqii.supabase.co/rest/v1/leads' \
--   --      -H "apikey: <anon>" -H "Authorization: Bearer <anon>" \
--   --      -H 'Content-Type: application/json' \
--   --      -d '{"name":"teste-rls","whatsapp":"11999999999"}'
--
--   -- 3) o formulário em /diagnostico continua gravando (via notify-lead)
--
-- Rollback
-- --------
--   GRANT INSERT ON public.leads TO anon, authenticated;
--   CREATE POLICY "Anyone can submit a lead" ON public.leads
--     FOR INSERT TO public WITH CHECK (true);
--
-- Alternativa mais branda (se o Pedro preferir manter o caminho direto):
-- em vez do DROP, substituir por um WITH CHECK com limites de tamanho e
-- travando status/internal_notes, no mesmo espírito do que
-- `public insert seo_404_log` já faz. Fica registrado como opção; o DROP é
-- a recomendação, porque o site não precisa desse caminho.
-- =====================================================================

DROP POLICY IF EXISTS "Anyone can submit a lead" ON public.leads;

REVOKE INSERT ON public.leads FROM anon, authenticated;

-- `diagnostic_leads` é a tabela legada equivalente: 0 linhas, nenhum código
-- do site escreve nela (confirmado por grep em src/ e supabase/functions/).
-- Mesma policy aberta, mesmo tratamento.
DROP POLICY IF EXISTS "Anyone can submit a diagnostic lead" ON public.diagnostic_leads;

REVOKE INSERT ON public.diagnostic_leads FROM anon, authenticated;
