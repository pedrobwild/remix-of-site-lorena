# Meta no painel — campanhas e formulários instantâneos

A edge function `meta-sync` traz da Meta, a cada 30 minutos (cron) ou pelo
botão **Sincronizar agora** no painel:

1. **Métricas diárias por campanha** da conta de anúncios → `meta_ads_daily`
   (investimento, impressões, cliques, cliques no link, leads atribuídos pela
   Meta, conversas por mensagem). A primeira carga traz 90 dias; as seguintes
   relêem os últimos 8, porque a Meta revisa os números de dias recentes.
2. **Leads dos formulários instantâneos** (Lead Ads do Facebook e do
   Instagram) → `meta_leads`, com as respostas e a origem (campanha, conjunto,
   anúncio, plataforma, orgânico).

Onde aparece:

| Tela | O quê |
| --- | --- |
| `/admin/leads` › **Formulários Meta** (`?aba=meta`) | Lista dos leads, status (novo/contatado/qualificado/descartado), respostas, aviso ao time e "excluir". |
| `/admin/analytics` › **Mídia paga** (`?tab=paid`) | KPIs com comparação, investimento × leads por dia e tabela por campanha. |
| `/admin/dashboard` › **Mídia paga** | Resumo do período do seletor (7/30/90 dias). |

## Avisos de lead novo

Cada lead de formulário **novo** é avisado como os do site:

- **Slack** (`SLACK_WEBHOOK_URL`) — com respostas, origem e botões "Falar no
  WhatsApp" e "Ver no painel";
- **e-mail** — modelo `novo-lead-site`, assunto "Novo lead do Meta — nome";
- **CRM** (Bwild Engine, `lead-webhook`) — `source: "meta_ads"` e
  `external_id` = id do lead na Meta. É a mesma chave do webhook de Lead Ads
  do próprio CRM: se ele também receber o lead, vira "duplicate" lá, nunca dois
  cards.

Regras:

- A **primeira carga** (histórico de até 90 dias) entra no painel **sem aviso**
  (`notify = {"skipped": "backfill"}`). Lead com mais de 72h também entra sem
  aviso (`{"skipped": "old"}`).
- Lead da **Ferramenta de Teste** da Meta avisa no Slack e por e-mail com o
  título "Lead de teste", mas **não** vira card no CRM.
- Cada lead é avisado **uma vez**: a linha é reservada antes do envio
  (`notify` nulo → `{"state": "sending"}` numa UPDATE condicional), então o
  cron e o botão rodando juntos não duplicam. Aviso que não saiu (função
  interrompida) fica pendente e sai na próxima rodada, até 25 por rodada.
- O resultado fica em `meta_leads.notify` (`{slack, email, crm}`) e aparece em
  "Aviso ao time" no detalhe do lead.

## Configuração

| Segredo | Obrigatório | Uso |
| --- | --- | --- |
| `META_ADS_ACCESS_TOKEN` | sim | Token de **usuário do sistema** (Business Manager › Usuários do sistema › Gerar token). Permissões: `ads_read` (campanhas) e, para os formulários, `leads_retrieval`, `pages_show_list`, `pages_read_engagement`, `pages_manage_ads`. O usuário do sistema precisa ter acesso à conta de anúncios e à Página (e, se a Página usa o Gerenciador de acesso a leads, estar liberado lá). Também é o token de `meta-insights` e, na falta de `META_CAPI_ACCESS_TOKEN`, da API de Conversões. |
| `META_LEADS_ACCESS_TOKEN` | não | Outro token só para os formulários, se preferir separar. |
| `META_ADS_ACCOUNT_ID` | não | Conta de anúncios (com ou sem `act_`). Padrão: a da Bwild. |
| `META_PAGE_ID` | não | Página(s) dos formulários, separadas por vírgula. Sem ele, lê todas as Páginas que o token enxerga (`/me/accounts`). |
| `META_APP_SECRET` | não | Liga o `appsecret_proof` (obrigatório se o app da Meta exigir). |
| `INDEX_TRACKER_CRON_KEY` | já existe | Chave do cron interno (a mesma do `index-tracker`). |

O cron (`meta-sync`, minutos 5 e 35 de cada hora) chama a função com o
cabeçalho `x-cron-key`, copiado do job `index-tracker-sweep` — a chave não
aparece em nenhum arquivo do repositório.

## Estado e auditoria

`meta_sync_state` guarda, para `ads` e `leads`: última rodada, último sucesso,
último erro e o cursor. O painel mostra "sincronizado há X min", "não
conectado" (sem token), "erro na última sincronização" (com a dica do que
fazer) ou "sem sincronizar há X h" (cron parado).

```sql
-- Situação da sincronização
select key, last_run_at, last_success_at, last_error, stats from public.meta_sync_state;

-- Rodadas (sem dados pessoais)
select created_at, event_name, status, detail
from public.integration_log
where integration = 'meta_sync'
order by created_at desc limit 20;

-- Leads de formulário por dia e resultado do aviso
select date_trunc('day', created_time) dia, count(*) leads,
       count(*) filter (where notify ? 'slack') avisados,
       count(*) filter (where notify->>'skipped' = 'backfill') carga_inicial
from public.meta_leads where deleted_at is null
group by 1 order by 1 desc;

-- Investimento e leads (Meta) por campanha nos últimos 30 dias
select campaign_name, sum(spend) investimento, sum(leads) leads,
       round(sum(spend) / nullif(sum(leads), 0), 2) cpl
from public.meta_ads_daily
where date >= current_date - 29
group by 1 order by 2 desc;
```

Motivos em `last_error`: `no_token`, `token_invalid` (expirado/revogado),
`permission`, `rate_limit`, `not_found`, `server`/`timeout`/`network` e
`parcial: …` (algum formulário não pôde ser lido; o cursor não avança e a
próxima rodada relê o mesmo período).

## Números

- **Leads (Meta)** = ação `lead` do relatório da Meta: formulário + site,
  pela janela de atribuição da Meta. Não somar com `form_leads`/`site_leads`
  (são partes dele).
- **Formulários recebidos** = linhas de `meta_leads` (sem teste e sem
  excluídos) — o que de fato chegou.
- **Leads do site via Meta** = leads do site com `utm_source` da Meta
  (facebook, fb, instagram, ig, meta) ou clique de anúncio (`fbclid`).
- CTR e CPC usam **cliques no link** (`inline_link_clicks`), não todos os
  cliques.

## Excluir e LGPD

"Excluir" na aba Formulários Meta apaga nome, contato, cidade e respostas do
painel e mantém a linha (com `deleted_at`), para a sincronização não trazer o
lead de volta. Na Meta, o lead continua na Central de Leads até ser apagado
lá (a Meta guarda os leads por 90 dias).
