# Meta Pixel + Conversions API — Lead e QualifiedLead

Como o site conta leads para a Meta e o que precisa estar configurado.

## O que sai para a Meta

| Evento | Quando | De onde | `event_id` | `action_source` |
| --- | --- | --- | --- | --- |
| `PageView` | cada navegação (após aceite de cookies) | Pixel (browser) | — | website |
| `Lead` | formulário enviado e contado como `generate_lead` | Pixel (browser) **e** CAPI (`notify-lead`) | UUID gerado no browser, o mesmo nos dois | website |
| `QualifiedLead` | admin marca o lead como **qualificado** em `/admin/leads` | CAPI (`meta-lead-quality`) | `<lead_id>:qualifiedlead` | system_generated |
| `DisqualifiedLead` | admin marca o lead como **descartado** | CAPI (`meta-lead-quality`) | `<lead_id>:disqualifiedlead` | system_generated |

A Meta deduplica `Lead` pelo par (`event_name`, `event_id`): quando o Pixel e a
CAPI mandam os dois, conta um. Quem recusou cookies não tem Pixel — nesse caso
só a CAPI envia, e ela **envia mesmo sem aceite** (decisão de 25/09/2026, ver
LGPD abaixo). A atribuição ao anúncio vem do `fbclid` da URL, convertido em
`fbc` no browser sem depender de cookie.

`user_data` vai sempre com hash SHA-256 (e-mail, telefone com DDI 55, primeiro e
último nome, cidade/UF, `external_id` = id do lead) mais `fbp`, `fbc`, IP e
user-agent — os identificadores do próprio Pixel.

## Arquivos

- `src/lib/metaPixel.ts` — `newMetaEventId`, `captureFbclid` (guarda o `fbclid`
  da entrada em `sessionStorage`, chamado em `main.tsx`), `readMetaBrowserIds`
  (`_fbp`, `_fbc`, `fbclid` da URL ou o da sessão), `trackMetaLead` (gate:
  consentimento, fora do `/admin`, `fbq` carregado).
- `src/lib/useLeadSubmit.ts` — gera o `event_id`, anexa `meta_event_id`, `fbp`,
  `fbc`, `event_source_url`, `ads_consent` ao payload e dispara o `Lead` do Pixel
  junto com o `generate_lead` do GA4.
- `supabase/functions/_shared/meta-capi.ts` — normalização, hash e POST em
  `graph.facebook.com/<versão>/<pixel>/events`. Módulo puro, testado pelo Vitest.
- `supabase/functions/notify-lead` — grava `meta_event_id`/`fbp`/`fbc` na linha e
  envia `Lead`. A resposta ganha `meta: sent | skipped | error`; **não** conta
  como entrega para o cliente (`src/lib/leadDelivery.ts`).
- `supabase/functions/meta-lead-quality` — recebe `{ lead_id, status }` do admin,
  lê o lead pela service role e envia o evento de qualidade. Idempotente por
  `meta_qualified_sent_at`; `force: true` reenvia.
- `src/lib/adminLeads.ts` — `updateLeadStatus` chama `notifyMetaLeadQuality` em
  segundo plano depois que o status foi gravado.
- `supabase/migrations/20260925050000_leads_meta_capi.sql` — colunas
  `meta_event_id`, `fbp`, `fbc`, `meta_lead_sent_at`, `meta_qualified_sent_at`.

## Segredos (Supabase → Edge Functions → Secrets)

| Nome | Obrigatório | Uso |
| --- | --- | --- |
| `META_CAPI_ACCESS_TOKEN` | sim* | Token de usuário de sistema com acesso ao dataset/pixel (Events Manager → Configurações → Conversions API → "Gerar token de acesso"). *Na falta, as funções usam `META_ADS_ACCESS_TOKEN` (já existe para `meta-insights`), desde que ele tenha permissão no dataset. |
| `META_PIXEL_ID` | não | Se ausente, usa `site_settings.meta_pixel_id` — o mesmo id que o front injeta. |
| `META_CAPI_TEST_EVENT_CODE` | não | Código de "Test events" do Events Manager. Preencher só durante a homologação e **remover** depois; com ele os eventos não entram nos relatórios. |
| `META_CAPI_REQUIRE_CONSENT` | não | Padrão `false`: `Lead` vai à Meta para todo formulário enviado, com ou sem aceite de cookies. `true` volta a exigir o aceite (`ads_consent`). |

## Passo a passo de ativação

1. Aplicar a migration (`supabase db push` ou SQL Editor com o conteúdo do arquivo).
2. Publicar as funções `notify-lead` e `meta-lead-quality` (`supabase functions deploy`).
3. Gerar o token da CAPI no Events Manager e salvar como `META_CAPI_ACCESS_TOKEN`.
4. Homologar: salvar `META_CAPI_TEST_EVENT_CODE`, enviar um lead de teste em
   `/orcamento` com cookies aceitos, abrir Events Manager → Test events e conferir:
   `Lead` do browser e do servidor com o **mesmo** `event_id` e "Deduplicated";
   depois marcar o lead como qualificado no painel e conferir `QualifiedLead`.
5. Remover `META_CAPI_TEST_EVENT_CODE`.
6. No Gerenciador de Anúncios: criar conversão personalizada a partir de
   `QualifiedLead` (ou usar o evento personalizado direto) e otimizar a campanha
   de conversão para ele quando houver ≥ 50 eventos/semana; antes disso, otimizar
   para `Lead`.

## Auditoria

```sql
select date_trunc('day', created_at) dia,
       count(*) leads,
       count(meta_lead_sent_at) lead_na_meta,
       count(meta_qualified_sent_at) qualificados_na_meta,
       count(fbc) com_clique_meta
from public.leads
where created_at >= now() - interval '30 days'
group by 1 order by 1 desc;
```

`leads` sem `meta_lead_sent_at` = CAPI sem token/pixel, lead sem e-mail nem
telefone válidos, ou erro (ver logs da função `notify-lead`, prefixo
`[notify-lead] meta capi`).

## LGPD

- O Pixel só carrega após aceite (inalterado).
- A CAPI **não** depende do aceite (`META_CAPI_REQUIRE_CONSENT` padrão `false`):
  todo formulário enviado gera `Lead` server-side. Base jurídica adotada: o
  visitante forneceu os dados voluntariamente para ser contatado, eles saem só
  com hash e o objetivo é medir a origem desse contato. Recomenda-se refletir
  isso na Política de Privacidade (item "medição de campanhas / Meta
  Conversions API"). `ads_consent` continua no payload para auditoria e para
  reverter com um secret (`true`) se a política mudar.
- Dados pessoais vão com hash, nunca em claro. IP e user-agent não são gravados
  no banco; só passam para a Meta no momento do evento.
- Referência: [Meta — Conversions API: parâmetros de informação do cliente](https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/customer-information-parameters)
  e [Meta — deduplicação de eventos Pixel/CAPI](https://developers.facebook.com/docs/marketing-api/conversions-api/deduplicate-pixel-and-server-events).
