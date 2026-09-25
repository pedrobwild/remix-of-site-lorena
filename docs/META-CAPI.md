# Meta Pixel + Conversions API — Lead e QualifiedLead

Como o site conta leads para a Meta (e para o Google Ads) e o que precisa estar
configurado.

## O que sai para a Meta

| Evento | Quando | De onde | `event_id` | `action_source` |
| --- | --- | --- | --- | --- |
| `PageView` | cada navegação (após aceite de cookies) | Pixel (browser) | — | website |
| `ViewContent` | abertura de uma página de projeto (`/portfolio/<slug>`) | Pixel | — | website |
| `Contact` | clique em WhatsApp/telefone/e-mail e formulário rápido do rodapé | Pixel | — | website |
| `Lead` | formulário de cliente enviado e contado como `generate_lead` | Pixel **e** CAPI (`notify-lead`) | UUID gerado no browser, o mesmo nos dois (reenvio do mesmo formulário repete o id) | website |
| `QualifiedLead` | admin marca o lead como **qualificado** em `/admin/leads` | CAPI (`meta-lead-quality`) | `<lead_id>:qualifiedlead` | system_generated |
| `DisqualifiedLead` | admin marca o lead como **descartado** | CAPI (`meta-lead-quality`) | `<lead_id>:disqualifiedlead` | system_generated |

Duas regras valem para todos os eventos de lead:

- **Só formulários de cliente** (`/orcamento`, `/contato`, `/diagnostico`, `/o`,
  `/p`). Parceiros e Indique um amigo continuam como `generate_lead` no GA4, mas
  não vão à Meta — contar como Lead ensinaria a campanha a buscar o público errado.
- **Só com aceite de cookies.** O Pixel só carrega depois do aceite, e a CAPI só
  envia quando o lead chegou com `consent_marketing = true`.

A Meta deduplica `Lead` pelo par (`event_name`, `event_id`): quando o Pixel e a
CAPI mandam os dois, conta um.

`user_data` vai sempre com hash SHA-256 (e-mail, telefone com DDI 55, primeiro e
último nome sem acento, cidade/UF só quando o formulário traz a UF, `external_id`
= id do lead) mais `fbp`, `fbc`, IP e user-agent — os identificadores do próprio
Pixel.

## Arquivos

- `src/lib/metaPixel.ts` — `trackMetaEvent` (gate: aceite, fora do `/admin`; fila
  curta até o Pixel ser injetado), `readMetaBrowserIds` (`_fbp`, `_fbc` ou
  `fb.1.<ts>.<fbclid>`), `newEventId`.
- `src/lib/conversions.ts` — `reportLead`, `reportContact`, `reportViewContent`
  (Meta + Google Ads) e a lista de formulários de cliente.
- `src/lib/useLeadSubmit.ts` — um `event_id` por formulário; manda `event_id`,
  `consent_marketing`, `fbp` e `fbc` ao `notify-lead` e dispara o `Lead` do Pixel
  junto com o `generate_lead` do GA4.
- `src/components/MetaPixel.tsx` — `PageView`, `ViewContent` e `Contact`.
- `supabase/functions/_shared/meta-capi.ts` — normalização, hash, configuração e
  POST em `graph.facebook.com/v25.0/<pixel>/events`. Módulo puro, testado pelo
  Vitest (`src/lib/__tests__/metaCapi.test.ts`).
- `supabase/functions/notify-lead` — grava o lead (atribuição completa, `event_id`,
  `fbp`, `fbc`, `consent_marketing`) e envia o `Lead`. A resposta ganha
  `meta: sent | skipped | error`; **não** conta como entrega para o cliente
  (`src/lib/leadDelivery.ts`).
- `supabase/functions/meta-lead-quality` — recebe `{ lead_id, status }` do admin,
  lê o lead pela service role e envia o evento de qualidade. Idempotente por
  `meta_qualified_sent_at`; `force: true` reenvia.
- `src/lib/adminLeads.ts` — `updateLeadStatus` chama `notifyMetaLeadQuality` em
  segundo plano depois que o status foi gravado.
- `supabase/functions/_shared/integration-log.ts` + tabela `integration_log` —
  cada tentativa de envio (sent/skipped/error, código de erro, `fbtrace_id`), sem
  dados pessoais.
- Migrations: `20260925050543_…` (atribuição, `event_id`, `fbp`, `fbc`,
  `consent_marketing`, `integration_log`, campos do admin) e
  `20260925053000_meta_lead_quality.sql` (`meta_lead_sent_at`,
  `meta_qualified_sent_at`).

## Configuração

| Onde | Nome | Obrigatório | Uso |
| --- | --- | --- | --- |
| Segredo | `META_CAPI_ACCESS_TOKEN` | sim* | Token de usuário de sistema com acesso ao Pixel (Events Manager → Configurações → Conversions API → "Gerar token de acesso"). *Na falta, as funções usam `META_ADS_ACCESS_TOKEN` (o de `meta-insights`), se ele tiver acesso ao Pixel. |
| Segredo | `META_PIXEL_ID` | não | Se ausente, usa o Pixel salvo em `/admin/seo › Analytics & Pixels` (`site_settings.meta_pixel_id`) — o mesmo que o site injeta. |
| Admin | "Meta — código de teste da API de Conversões" | não | Código de "Testar eventos" do Events Manager. Preencher só na homologação e **apagar** depois: com ele os eventos do servidor não entram nas campanhas. O segredo `META_CAPI_TEST_EVENT_CODE` também funciona. |

## Passo a passo de ativação

1. Aplicar as migrations (a Lovable roda pela ferramenta de migration).
2. Publicar as funções `notify-lead` e `meta-lead-quality`.
3. Gerar o token da CAPI no Events Manager e salvar como `META_CAPI_ACCESS_TOKEN`
   (segredos das edge functions).
4. Homologar: preencher o código de teste no admin, enviar um lead de teste em
   `/orcamento` com cookies aceitos e conferir em Events Manager → Testar eventos:
   `Lead` do navegador e do servidor com o **mesmo** `event_id` e "Deduplicado";
   depois marcar o lead como qualificado no painel e conferir `QualifiedLead`.
5. Apagar o código de teste no admin.
6. No Gerenciador de Anúncios: criar conversão personalizada a partir de
   `QualifiedLead` e otimizar para ela quando houver volume (≥ 50 eventos/semana);
   antes disso, otimizar para `Lead`.

## Auditoria

```sql
-- Cada tentativa de envio pelo servidor
select date_trunc('day', created_at) dia, event_name, status, count(*)
from public.integration_log
where integration = 'meta_capi' and created_at >= now() - interval '30 days'
group by 1, 2, 3 order by 1 desc, 2, 3;

-- Leads × Meta
select date_trunc('day', created_at) dia,
       count(*) leads,
       count(*) filter (where consent_marketing) com_aceite,
       count(meta_lead_sent_at) lead_na_meta,
       count(meta_qualified_sent_at) qualificados_na_meta,
       count(fbc) com_clique_meta
from public.leads
where created_at >= now() - interval '30 days'
group by 1 order by 1 desc;
```

Em `integration_log.detail.reason`: `no_token` (segredo ausente), `no_pixel`,
`no_user_agent`, `no_user_data`; erros trazem `error_code` e `fbtrace_id` da Meta.

## LGPD

- O Pixel só carrega após o aceite (inalterado).
- A CAPI segue a mesma decisão do visitante: `consent_marketing` viaja no envio do
  formulário e, sem aceite, nada vai à Meta — nem o `Lead`, nem os eventos de
  qualidade. Quem recusa cookies continua sendo atendido normalmente; só não é
  medido.
- Dados pessoais vão com hash, nunca em claro. O IP não é gravado no banco; só
  passa para a Meta no momento do evento.
- Referências: [Meta — parâmetros de informação do cliente](https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/customer-information-parameters)
  e [Meta — deduplicação de eventos Pixel/CAPI](https://developers.facebook.com/docs/marketing-api/conversions-api/deduplicate-pixel-and-server-events).

## Google Ads

A tag do Google Ads entra quando `/admin/seo › Analytics & Pixels` tem o ID da
conta (`AW-…`). Com o rótulo da conversão de lead, os mesmos formulários de
cliente enviam a conversão com conversões otimizadas (e-mail e telefone pela
própria tag, com hash) e `transaction_id` = o mesmo `event_id` do Meta; com o
rótulo de contato, cliques em WhatsApp/telefone também contam. Para as
conversões otimizadas valerem, ative no Google Ads: Metas → Configurações →
Conversões otimizadas → "Tag do Google".
