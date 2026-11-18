# Conversões de etapa no Google Ads e Meta pelo funil do CRM — plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Emitir "Orçamento enviado investidor" e "Negociação investidor" na planilha do Data Manager a partir do funil do CRM, e fazer a Meta receber QualifiedLead/DisqualifiedLead só pela movimentação no pipeline (sem a marcação do painel).

**Architecture:** A regra pura continua em `supabase/functions/_shared/data-export.ts` (já é a fonte única do Google Ads). A sincronização horária (`crmStageSync.server.ts`) passa a derivar o evento da Meta das colunas `crm_*` antes/depois do patch, com uma função pura nova em `src/lib/crmStage.ts`. A marcação manual deixa de chamar a Meta.

**Tech Stack:** TypeScript (Deno na edge function, TanStack Start no servidor do site), Vitest.

**Spec:** decisão do Pedro em 18/11/2026 (chat): secundárias, só investidor, valores R$ 20.000 / R$ 40.000; pós-Lead mantém qualificado; Meta pela mesma regra do Google.

## Global Constraints

- UI, comentários e commits em pt-BR; datas dd/mm/aaaa.
- Nunca ler `status`/`manual_qualification` nos envios ao Google e, agora, à Meta.
- Publicação só com pedido explícito; `data-export` precisa de reimplantação pelo Lovable.
- Nomes exatos das ações no Google Ads: `Orçamento enviado investidor`, `Negociação investidor`.

## Review Focus

1. Lead ganho (`crm_won`) sem `crm_max_stage_key` em `fechado` → deve emitir as duas etapas (contrato implica orçamento e negociação). Teste na Task 1.
2. Lead que chegou a Negociação sem nota de "Enviado para o Cliente" no histórico → orçamento sai com hora do primeiro alcance de etapa ≥ enviado (a nota de Negociação), não de `crm_last_change_at`. Teste na Task 1.
3. Objetivo de moradia em negociação → nada das novas conversões. Teste na Task 1.
4. Primeira sincronização depois do deploy, lead já qualificado no CRM sem patch → nenhum evento Meta (antes == depois). Teste na Task 2.
5. Perda herdada (anterior à chegada) → Meta não recebe DisqualifiedLead. Teste na Task 2.

---

### Task 1: Conversões de etapa na exportação `google_ads_offline`

**Files:**
- Modify: `supabase/functions/_shared/data-export.ts` (constantes ~l.449, `pickPipelineTimes`, `buildGoogleAdsOfflineRows`, cabeçalho do bloco)
- Modify: `supabase/functions/data-export/index.ts:204-208`
- Test: `src/lib/__tests__/googleAdsOfflineExport.test.ts`

**Interfaces (produces):**
- `GOOGLE_ADS_QUOTE_SENT_CONVERSION = "Orçamento enviado investidor"`, `GOOGLE_ADS_QUOTE_SENT_VALUE = 20_000`
- `GOOGLE_ADS_NEGOTIATION_CONVERSION = "Negociação investidor"`, `GOOGLE_ADS_NEGOTIATION_VALUE = 40_000`
- `CRM_QUOTE_SENT_STAGE_KEYS = ["enviado","negociacao","minuta","enviado_assinatura","fechado"]`, `CRM_NEGOTIATION_STAGE_KEYS = ["negociacao","minuta","enviado_assinatura","fechado"]`
- `ENGINE_QUOTE_SENT_STAGES = ["Enviado para o Cliente","Negociação","Minuta Solicitada","Enviado para Assinatura","Contrato Fechado"]`, `ENGINE_NEGOTIATION_STAGES` = os 4 últimos
- `crmReachedQuoteSent(lead): boolean` e `crmReachedNegotiation(lead): boolean` (won ⇒ true; senão `crm_max_stage_key` na lista)
- `pickPipelineTimes` devolve também `quoteSentAt` e `negotiationAt` (1ª nota com destino na lista)
- `GoogleAdsOfflineInput` ganha `quoteSentAt?`, `negotiationAt?`
- Ambas entram em `GOOGLE_ADS_DEDUP_CONVERSIONS`.

- [ ] Step 1: testes (falham): `it.each` para won/enviado/negociacao/moradia/hora pelo histórico/hora de reserva; `pickPipelineTimes` com notas "CRM: Lead → Enviado para o Cliente" e "CRM: Enviado para o Cliente → Negociação".
- [ ] Step 2: rodar o runner isolado e ver falhar.
- [ ] Step 3: implementar constantes, helpers, `pickPipelineTimes`, `buildGoogleAdsOfflineRows` (empurrar as duas conversões só para `GOOGLE_ADS_INVESTOR_OBJETIVOS`; hora = `input.quoteSentAt/negotiationAt ?? lastCrmChange`), `index.ts` passa os dois mapas.
- [ ] Step 4: testes verdes; `deno check` do `index.ts`.
- [ ] Step 5: commit.

### Task 2: Meta pelo pipeline na sincronização horária

**Files:**
- Modify: `src/lib/crmStage.ts` (substituir `shouldSendMetaQuality`)
- Modify: `src/lib/crmStageSync.server.ts` (select ganha `created_at`; remover `sendPendingManualQualified`; usar a função nova)
- Modify: `src/lib/manualLeadQualification.functions.ts` (sem Meta; `meta: "pipeline"`)
- Test: `src/lib/__tests__/crmStage.test.ts`, `src/lib/__tests__/manualLeadQualification.test.ts`

**Interfaces:**
- Consumes: `crmPipelineQuality`, `crmLossTimeAfterLead` de `data-export.ts`.
- Produces: `pipelineMetaStatus(lead: PipelineLead): "qualificado" | "descartado" | null` e `shouldSendMetaQuality(before: PipelineLead, after: PipelineLead, lastChangeAt: string | null, now: number): "qualificado" | "descartado" | null`, com `PipelineLead = { created_at: string | null; crm_won; crm_lost; crm_max_stage_key; crm_last_change_at }`. `CrmLeadRow` ganha `created_at: string | null`.

- [ ] Step 1: testes (falham): status muda novo→qualificado dentro de 7 dias → "qualificado"; perda posterior → "descartado"; perda herdada → null; sem mudança → null; mudança antiga (>7 dias) → null; marcação manual no painel não chama a Meta (`sendMeta` não chamado; resultado `meta: "pipeline"`).
- [ ] Step 2: rodar e ver falhar.
- [ ] Step 3: implementar; na sincronização: `const after = { ...row, ...plan.patch }`, `const ev = shouldSendMetaQuality(row, after, item?.last_change_at ?? null, now.getTime())`, enviar `ev` com `eventSource: "Bwild Engine"`.
- [ ] Step 4: testes verdes; `tsc` isolado nos módulos.
- [ ] Step 5: commit.

### Task 3: Documentação e registro da decisão

**Files:** `docs/INTEGRACOES.md`, `AGENTS.md`, cabeçalho de `data-export.ts`, doc do projeto (Projects) `claude/google-ads-sinal-pelo-funil-2026-11-09.md`.

- [ ] Registrar: duas conversões novas (nomes, valores, regra de etapa, só investidor), decisão "pós-Lead mantém qualificado", Meta pelo pipeline e marcação sem Meta. Commit.

### Task 4: PR, CI, publicação condicionada

- [ ] Push, PR via REST, CI verde. Publicar só depois de o Pedro confirmar as duas ações no Google Ads; depois publicar o site e reimplantar `data-export`; conferir planilha (duas leituras) e `integration_log` (`meta_capi`).
