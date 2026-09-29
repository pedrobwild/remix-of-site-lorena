# Meta Pixel + Conversions API — eventos, públicos e qualidade do lead

Como o site conta leads para a Meta (e para o Google Ads) e o que precisa estar
configurado. O caminho inverso — trazer da Meta as métricas das campanhas e os
leads dos formulários instantâneos para o painel — está em
[META-SYNC.md](META-SYNC.md); os estágios do CRM devolvidos à Meta para os leads
de formulário instantâneo ("Conecte seu CRM com a API de Conversões") estão em
[META-CRM.md](META-CRM.md).

## O que sai para a Meta

| Evento | Quando | De onde | `event_id` | `action_source` |
| --- | --- | --- | --- | --- |
| `PageView` | cada navegação (após aceite de cookies) | Pixel (browser) | — | website |
| `ViewContent` | projeto (`/portfolio/<slug>`), conteúdo (`/conteudos/<slug>`), guia do investidor, portfólio e páginas de serviço — `content_category` diz qual | Pixel | — | website |
| `Contact` | clique em WhatsApp/telefone/e-mail e formulário rápido do rodapé | Pixel | — | website |
| `IniciouFormulario` (próprio) | primeira interação com um formulário de lead ou cadastro, uma vez por página vista | Pixel | — | website |
| `VisitanteEngajado` (próprio) | uma vez por sessão: 60 s de tela ativa ou 75% de rolagem numa página longa | Pixel | — | website |
| `Lead` | formulário de cliente enviado e contado como `generate_lead` | Pixel **e** CAPI (`notify-lead`) | UUID gerado no browser, o mesmo nos dois (reenvio do mesmo formulário repete o id) | website |
| `SubmitApplication` | cadastro de parceiro, de incorporadora e indicação | Pixel | UUID do envio | website |
| `QualifiedLead` | admin marca o lead como **qualificado** em `/admin/leads` | CAPI (`meta-lead-quality`) | `<lead_id>:qualifiedlead` | system_generated |
| `DisqualifiedLead` | admin marca o lead como **descartado** | CAPI (`meta-lead-quality`) | `<lead_id>:disqualifiedlead` | system_generated |
| `lead_recebido`, `lead_contatado`, `lead_qualificado`, `lead_descartado` | leads dos **formulários instantâneos** da Meta: entrada no painel e mudanças de status | CAPI (`meta-sync`, `meta-lead-quality`) com `user_data.lead_id` | `<meta_leads.id>:<estágio>` | system_generated — ver [META-CRM.md](META-CRM.md) |

O `Lead` do Pixel leva, além de `content_name`/`content_category`, parâmetros sem
dado pessoal para segmentar: `objetivo` (slug), `faixa_m2` (`ate_30`, `31_45`,
`46_70`, `71_100`, `acima_100`), `etapa_imovel` (`com_chaves`, `sem_chaves`,
`comprando`) e `mora_em_sp`. Nunca vão texto livre de localização, mensagem,
orçamento pretendido nem dados de terceiros.

Duas regras valem para todos os eventos de lead:

- **Só formulários de cliente viram `Lead`** (`/orcamento`, `/contato`,
  `/diagnostico`, `/o`, `/p`). Parceiros, incorporadoras e Indique um amigo
  continuam como `generate_lead` no GA4, mas na Meta viram `SubmitApplication`
  (só Pixel, sem CAPI e sem Google Ads) — contar como Lead ensinaria a campanha
  a buscar o público errado.
- **Pixel só com aceite de cookies; CAPI independe do banner.** O Pixel só
  carrega depois do aceite. O `Lead` (e `QualifiedLead`/`DisqualifiedLead`) da
  CAPI sai para **todo** formulário de cliente, com os dados pessoais em hash,
  mesmo sem aceite — decisão de 25/09/2026 para melhorar a atribuição (base
  legal: legítimo interesse, descrito na `/privacidade` e no aviso dos
  formulários). O segredo `META_CAPI_REQUIRE_CONSENT=true` religa a exigência
  de `consent_marketing = true` para a CAPI.

A Meta deduplica `Lead` pelo par (`event_name`, `event_id`): quando o Pixel e a
CAPI mandam os dois, conta um.

`user_data` vai sempre com hash SHA-256 (e-mail, telefone com DDI 55, primeiro e
último nome sem acento, cidade/UF só quando o formulário traz a UF, `external_id`
= id do lead) mais `fbp`, `fbc`, IP e user-agent — os identificadores do próprio
Pixel.

### Correspondência avançada no Pixel (manual)

No envio de qualquer formulário que vira `Lead` ou `SubmitApplication`,
`reportLead` chama `setMetaUserData` **antes** do evento: `fbq('init', <pixel>,
{ em, ph, fn, ln, country })` com os dados de **quem enviou** (normalizados como
na CAPI; o próprio Pixel aplica o hash). Em `/indique-um-amigo`, os campos do
payload são os de quem indica — nome e WhatsApp do indicado ficam só na mensagem
e nunca vão à Meta. Se o Pixel ainda não carregou, os dados esperam na fila e o
`init` sai antes dos eventos pendentes.

**Correspondência avançada automática: deixar DESLIGADA** (Events Manager › Dados
bwild › Configurações). Ela lê campos de formulário por conta própria e poderia
capturar o nome e o WhatsApp do indicado em `/indique-um-amigo`; a manual já cobre
todos os formulários com os dados certos. (Desligada em 29/09/2026.)

### Permissões de tráfego

O conjunto **Dados bwild** usa **lista de permissão** de domínios (Events Manager ›
Dados bwild › Configurações › Permissões de tráfego). Ela precisa ter
`bewild.com.br` — e `bwild.com.br`, do site antigo. Domínio fora da lista: o
`fbevents.js` carrega, mas a configuração da Meta chega com `prohibitedPixels`
(`blockReason: "traffic_permissions"`) e nada é enviado. Sintoma: nenhum evento
de `bewild.com.br` no Events Manager e leads com aceite chegando sem `fbp`. Foi o
que aconteceu até 29/09/2026, quando `bewild.com.br` entrou na lista. Domínio
novo (landing page, subdomínio de outro domínio) → incluir na lista antes.

## Arquivos

- `src/lib/metaPixel.ts` — `trackMetaEvent` (gate: aceite, fora do `/admin`; fila
  curta até o Pixel ser injetado), `readMetaBrowserIds` (`_fbp`, `_fbc` ou
  `fb.1.<ts>.<fbclid>`), `newEventId`.
- `src/lib/conversions.ts` — `reportLead` (Lead/SubmitApplication + parâmetros),
  `reportContact`, `reportPageContent`/`pageContentFor` (ViewContent),
  `reportFormStart` e `reportEngaged` (Meta + Google Ads) e as listas de
  formulários.
- `src/lib/useLeadSubmit.ts` — um `event_id` por formulário; manda `event_id`,
  `consent_marketing`, `fbp` e `fbc` ao `notify-lead` e dispara o `Lead` do Pixel
  junto com o `generate_lead` do GA4.
- `src/components/MetaPixel.tsx` — `PageView`, `ViewContent`, `Contact`,
  `IniciouFormulario` e `VisitanteEngajado`.
- `src/components/CookieBanner.tsx`, `src/lib/cookieConsent.ts`
  (`CONSENT_VERSION`), `src/components/FormPrivacyNote.tsx` e
  `src/pages/PrivacidadePage.tsx` — o aviso e o aceite (ver LGPD abaixo).
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
| Segredo | `META_CAPI_REQUIRE_CONSENT` | não | `true`/`1`/`sim` → a CAPI só envia `Lead`/`QualifiedLead`/`DisqualifiedLead` de quem aceitou os cookies (`consent_marketing`). Ausente ou `false` (padrão): envia para todo formulário de cliente. Só vale para leads do site; os leads de formulário da Meta não passam pelo banner. |

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
`no_user_agent`, `no_user_data`, `no_consent` (só com
`META_CAPI_REQUIRE_CONSENT=true`); erros trazem `error_code` e `fbtrace_id` da Meta.

## LGPD

- O Pixel e a tag do Google só carregam após o aceite do banner.
- **Versão do aceite.** O texto do banner diz para que servem os cookies: medir o
  uso do site e mostrar anúncios da Bewild no Facebook, no Instagram e no Google
  para quem já visitou o site e para pessoas com perfil parecido. Como isso
  ampliou a finalidade do aceite antigo, `CONSENT_VERSION` passou para 2 (chave
  `bewild_cookie_consent_v2`): quem tinha **aceitado** a versão anterior
  (`lal_cookie_consent`) vê o banner de novo e nada rastreia até decidir; quem
  tinha **recusado** continua recusado. A auditoria (`consent_accept`/`decline`)
  grava `version` e a origem `banner`, `renovacao` ou `preferences`. Mudou a
  finalidade de novo → subir a versão e atualizar a `/privacidade`.
- "Recusar" e "Aceitar" têm o mesmo estilo e o foco inicial vai para a região do
  banner, não para um dos botões. Retirar o aceite é um clique em "Preferências
  de cookies" (rodapé e `/privacidade`).
- **Aviso no formulário** (`FormPrivacyNote`): cada formulário diz para que servem
  os dados e que, com o aceite, nome, e-mail e telefone seguem criptografados —
  para Meta e Google nos formulários de cliente, só para a Meta nos cadastros e na
  indicação (nunca os dados do indicado).
- A `/privacidade` descreve eventos, dados enviados, públicos (remarketing,
  exclusão e semelhantes), prazos dos cookies, retenção dos públicos (Meta: até
  180 dias) e como recusar (Preferências de cookies, Preferências de anúncios da
  Meta, Minha Central de Anúncios do Google, NAI/DAA).
- A CAPI **não** segue o banner (padrão desde 25/09/2026): `consent_marketing`
  viaja no envio do formulário e fica gravado no lead, mas o `Lead` e os eventos
  de qualidade saem pelo servidor para todo formulário de cliente, com os dados
  pessoais em hash — a base legal é o legítimo interesse em medir as campanhas,
  com direito de oposição pelo contato da `/privacidade`. O aviso de cada
  formulário (`FormPrivacyNote`) diz isso no ponto de coleta ("Ao enviar, nome,
  e-mail e telefone seguem criptografados para a Meta…; se você aceitou os
  cookies, também para o Google"). O Pixel, o Google Ads e os `SubmitApplication`
  (parceiros/indicação, só Pixel) continuam condicionados ao aceite. Para
  voltar a exigir o aceite na CAPI: `META_CAPI_REQUIRE_CONSENT=true`.
- Dados pessoais vão com hash, nunca em claro. O IP não é gravado no banco; só
  passa para a Meta no momento do evento.
- Referências: [Meta — parâmetros de informação do cliente](https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/customer-information-parameters)
  e [Meta — deduplicação de eventos Pixel/CAPI](https://developers.facebook.com/docs/marketing-api/conversions-api/deduplicate-pixel-and-server-events).

## Públicos sugeridos (Gerenciador de Anúncios)

Criados a partir do Pixel, depois de publicar o site com estes eventos:

| Público | Regra | Retenção |
| --- | --- | --- |
| Visitantes do site | todos os visitantes | 180 dias |
| Viu projeto ou serviço | `ViewContent` | 90 dias |
| Começou e não enviou | `IniciouFormulario` **menos** `Lead`/`SubmitApplication` | 30 dias |
| Engajados | `VisitanteEngajado` | 60 dias |
| Leads (para excluir da captação) | `Lead` | 180 dias |
| Semelhantes | 1% Brasil a partir de Leads e, com volume, de `QualifiedLead` | — |

Nenhum público usa dado sensível (saúde, finanças, documentos). Categoria
especial de anúncio de imóveis só é exigida nos EUA, Canadá e países europeus
listados pela Meta — não no Brasil.

## Google Ads

A tag do Google Ads entra quando `/admin/seo › Analytics & Pixels` tem o ID da
conta (`AW-…`). Com o rótulo da conversão de lead, os mesmos formulários de
cliente enviam a conversão com conversões otimizadas (e-mail e telefone pela
própria tag, com hash) e `transaction_id` = o mesmo `event_id` do Meta; com o
rótulo de contato, cliques em WhatsApp/telefone também contam. Para as
conversões otimizadas valerem, ative no Google Ads: Metas → Configurações →
Conversões otimizadas → "Tag do Google".
