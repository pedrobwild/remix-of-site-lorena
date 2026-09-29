# API de Conversões para CRM — estágios do lead de volta à Meta

É o que o Gerenciador de Anúncios pede em **"Conecte seu CRM com a API de
Conversões da Meta"** (otimização *Conversion Leads*): para cada lead dos
**formulários instantâneos** (Lead Ads do Facebook/Instagram), o painel devolve
à Meta em que estágio do atendimento ele está — recebido, contatado,
qualificado ou descartado. Com isso a campanha aprende a buscar quem vira
cliente, não quem só preenche o formulário.

O caminho dos leads **do site** (Pixel + `Lead`/`QualifiedLead`) está em
[META-CAPI.md](META-CAPI.md); o que traz os leads e as métricas da Meta para o
painel está em [META-SYNC.md](META-SYNC.md). Esta página cobre só o pedaço
"CRM → Meta" dos leads de formulário.

## O que sai para a Meta

| Evento (`event_name`) | Quando | De onde |
| --- | --- | --- |
| `initial_lead` | o lead do formulário entra no painel (sincronização `meta-sync`, a cada 30 min ou pelo botão) | `meta-sync` |
| `contacted` | admin muda o status para **contatado** em `/admin/leads › Formulários Meta` | `meta-lead-quality` |
| `qualified` | admin muda para **qualificado** | `meta-lead-quality` |
| `disqualified` | admin muda para **descartado** | `meta-lead-quality` |

Formato exigido pela Meta para esta integração (sem qualquer um dos três a Meta
não registra o evento como *Conversion Leads*):

```json
{
  "event_name": "qualified",
  "event_time": 1790000000,
  "event_id": "<id da linha em meta_leads>:qualified",
  "action_source": "system_generated",
  "user_data": { "lead_id": 1234567890123456, "em": ["<sha256>"], "ph": ["<sha256>"], "external_id": ["<sha256>"] },
  "custom_data": { "event_source": "crm", "lead_event_source": "Bewild Admin", "lead_status": "qualificado", "content_name": "<formulário>", "campaign_name": "<campanha>" }
}
```

- `user_data.lead_id` é o **id do lead na Meta** (`meta_leads.meta_lead_id`,
  15–17 dígitos), enviado como inteiro — é a chave que a Meta usa para casar o
  evento com o formulário; e-mail/telefone em hash vão junto só como apoio.
- `event_time` = momento da mudança de status (nunca antes de
  `meta_leads.created_time`, senão a Meta descarta).
- `event_id` determinístico por (lead, estágio): repetir o mesmo status não
  duplica.
- `initial_lead` é o nome que a própria Meta usa para o primeiro estágio (o
  funil pré-configurado em Events Manager já o espera); `contacted`,
  `qualified` e `disqualified` seguem a convenção. São diferentes dos eventos
  dos leads do site (`Lead`, `QualifiedLead`) de propósito: na configuração do
  funil só entram eventos com `lead_id`, e misturar confundiria o funil.
- Status **novo** não gera evento pelo painel: o `initial_lead` sai da
  sincronização, uma vez por lead. Só leads com aviso ao time (até 72h de idade)
  recebem `initial_lead` — a Meta descarta backfill com data alterada e o
  `event_time` precisa refletir quando o lead entrou no CRM.

## Arquivos

- `supabase/functions/_shared/meta-capi.ts` — `MetaCrmStage`,
  `CRM_STAGE_BY_STATUS`, `LEAD_EVENT_SOURCE`, `crmStageEvent` (monta o evento),
  `isMetaLeadId`, `serializeMetaBody` (o `lead_id` vai como inteiro sem perder
  precisão acima de 2^53). Módulo puro, testado em
  `src/lib/__tests__/metaCapi.test.ts`.
- `supabase/functions/meta-sync/index.ts` — `notifyMetaCapi` dentro de
  `notifyPending`: manda `initial_lead` junto com Slack, e-mail e CRM; o
  resultado fica em `meta_leads.notify.capi` ("Aviso ao time" no detalhe do
  lead mostra "Meta (CAPI) ✓").
- `supabase/functions/meta-lead-quality/index.ts` — corpo
  `{ source: "meta", lead_id: <uuid de meta_leads>, status }`; lê o lead pela
  service role e envia o estágio. Idempotente via `integration_log`
  (`detail.meta_lead_row` + `event_name` com `status = sent`); `force: true`
  reenvia.
- `src/components/admin/MetaLeadsPanel.tsx` → `notifyMetaLeadQuality(id, status,
  { source: "meta" })` (`src/lib/adminLeads.ts`) depois que o status foi gravado;
  erro na Meta nunca desfaz a mudança no painel.
- `/admin/integracoes` — o cartão "Meta — API de Conversões" conta quantos
  eventos de estágio do CRM foram aceitos nos últimos 30 dias.

## Configuração

Nada novo além do que a CAPI dos leads do site já usa:

| Onde | Nome | Uso |
| --- | --- | --- |
| Segredo | `META_CAPI_ACCESS_TOKEN` (ou `META_ADS_ACCESS_TOKEN`) | Token de usuário de sistema com acesso ao Pixel/conjunto de dados. |
| Segredo | `META_PIXEL_ID` (opcional) | Se ausente, usa o Pixel de `/admin/seo › Analytics & Pixels`. Os eventos do CRM entram **no mesmo conjunto de dados** do Pixel do site. |
| Admin | "Meta — código de teste da API de Conversões" | Só na homologação; apagar depois. |
| Segredo | `META_CAPI_REQUIRE_CONSENT` | Não se aplica aos leads de formulário da Meta (não há banner de cookies envolvido); vale só para os leads do site — ver META-CAPI.md. |

## Passo a passo — "Concluir configuração" no Gerenciador

1. **Publicar** as funções `meta-sync` e `meta-lead-quality` (a Lovable publica
   no deploy) e conferir em `/admin/integracoes` que a API de Conversões está
   "Enviando" ou "Aguardando" (não "Falta o token").
2. **Homologar**: em Events Manager › conjunto de dados do Pixel › *Testar
   eventos*, copiar o código e colar em `/admin/seo › Analytics & Pixels ›
   código de teste`. Gerar um lead pela [Ferramenta de teste de Lead
   Ads](https://developers.facebook.com/tools/lead-ads-testing), clicar em
   **Sincronizar agora** na aba Formulários Meta e conferir o `initial_lead`
   em *Testar eventos* com os parâmetros `event_source = crm` e
   `lead_event_source = Bewild Admin` preenchidos. Mudar o status do lead para
   *qualificado* e conferir o `qualified`. Apagar o código de teste.
3. **Ligar a integração**: no card do Gerenciador ("Conecte seu CRM…") clicar em
   **Concluir configuração** — ou em Events Manager › conjunto de dados ›
   *Configurações* › seção **Conversion Leads / API de Conversões para CRM**.
   Escolher a integração **direta pela API de Conversões** (não um parceiro) e
   o conjunto de dados do Pixel do site. O status deve sair de "Enviar um
   evento do CRM" assim que o primeiro estágio chegar.
4. **Esperar a validação (≈ 7 dias de eventos)**: a Meta exige eventos em pelo
   menos 7 dias (não precisam ser seguidos), com **no mínimo dois estágios,
   incluindo o inicial** (`initial_lead` + pelo menos um dos outros; três ou
   mais é o recomendado), e cobrindo todos os leads que os formulários geram.
   Erros aparecem em Events Manager › *Diagnóstico*.
5. **Configurar o funil de vendas** quando o status mudar para "Configurar
   funil": ordenar `initial_lead → contacted → qualified`
   (`disqualified` fica fora do funil, como saída) e escolher o estágio de
   otimização — `qualified`. A Meta pede um estágio com taxa de
   conversão entre 1% e 40% dos leads e alcançado em até 28 dias.
6. **Análise do funil e aprendizado (1–2 meses)**: manter o time marcando o
   status de **todo** lead no painel; sem isso o funil não fecha. Quando Events
   Manager mostrar "Fase de aprendizado concluída", trocar a meta de desempenho
   das campanhas de Lead Ads para **Leads de conversão** e usar esse conjunto de
   dados.

Operação: quem atende precisa mudar o status em `/admin/leads › Formulários
Meta` (contatado → qualificado ou descartado) em até alguns dias — é isso que
vira sinal. Lead sem status muda nada na Meta.

## Erros comuns no Events Manager

**"Você configurou um funil com eventos otimizados, mas esses eventos não estão
sendo enviados" (tabela com `initial_lead`, contagem 0).** O funil foi criado
antes de qualquer evento chegar. A contagem só sobe quando a Meta recebe
eventos **de verdade** (sem código de teste — com o código preenchido no admin
os eventos vão só para *Testar eventos* e não contam). Para resolver:

1. Em `/admin/integracoes`, conferir que "Meta — API de Conversões" não mostra
   "Falta o token" nem "modo de teste LIGADO".
2. Fazer o primeiro evento chegar: gerar um lead na
   [Ferramenta de teste de Lead Ads](https://developers.facebook.com/tools/lead-ads-testing)
   (ou esperar um lead real) e clicar em **Sincronizar agora** em
   `/admin/leads › Formulários Meta` → sai o `initial_lead`. Em seguida mudar o
   status desse lead para *contatado* e depois *qualificado* → saem `contacted`
   e `qualified`. Em até alguns minutos a contagem aparece em Events Manager ›
   conjunto de dados › *Visão geral* (filtrar por `initial_lead`).
3. Voltar à tela do funil e marcar em **Otimizar** o evento `qualified` (não o
   `initial_lead`: o estágio de otimização precisa ser um que só parte dos leads
   atinge, entre 1% e 40%). Se `qualified` ainda não aparecer na lista, é porque
   nenhum lead foi marcado como qualificado ainda — faça o passo 2 e recarregue.

Só leads que chegam ao painel **depois** deste deploy geram `initial_lead`
(leads antigos entram sem esse evento, mas recebem os estágios seguintes quando
o status muda). Leads da ferramenta de teste contam como eventos, mas a Meta os
ignora no treinamento; o que vale para a validação de 7 dias são os leads reais.

**Diagnóstico "Purchase — 100% afetada — Saiba como definir o valor (preço)".**
O site **nunca** envia `Purchase` (só PageView, ViewContent, Contact, Lead,
SubmitApplication e os eventos próprios — ver META-CAPI.md). Verificado em
29/09/2026 no Events Manager (conjunto "Dados bwild", 644216424824915): o
`Purchase` chega pela **API de Conversões com origem "Gerado pelo sistema"**
(2 eventos, 13/09 e 22/09), junto com um `proposta_enviada` (29 eventos) — ou
seja, vem do **CRM Bwild Engine**, que envia `value`/`currency` mas com valor
inválido (0 ou não numérico). A correção é lá, não no site: enviar
`custom_data.value` numérico > 0 (ex.: `12500.00`) e `currency: "BRL"` no
`Purchase`; ou, se o fechamento não tiver valor, não enviar `Purchase` (usar um
evento próprio, ex. `contrato_assinado`).

No lado do site, por precaução, o Pixel sobe com
`fbq('set','autoConfig',false,<pixel>)` antes do `init` (`src/lib/useSeo.ts`):
nenhum evento inferido de botões/microdados sai daqui. Em Events Manager ›
Configurações, "Eventos automáticos" e "Rastrear eventos automaticamente sem
código" já estavam desligados; "Incluir automaticamente informações mais
detalhadas de páginas e produtos" foi desligado em 29/09/2026.

Não faz sentido "definir o valor" no site como o aviso sugere: a Bewild não
fecha venda no site. O aviso some sozinho quando o CRM passar a mandar `value`
válido (ou parar de mandar `Purchase`), em até 48h.

## Auditoria

```sql
-- Estágios enviados por dia (formulários da Meta)
select date_trunc('day', created_at) dia, event_name, status, count(*)
from public.integration_log
where integration = 'meta_capi' and event_name in ('initial_lead', 'contacted', 'qualified', 'disqualified')
  and created_at >= now() - interval '30 days'
group by 1, 2, 3 order by 1 desc, 2, 3;

-- Cobertura: leads de formulário × initial_lead aceito
select count(*) leads,
       count(*) filter (where notify->>'capi' = 'sent') recebido_na_meta,
       count(*) filter (where notify->>'capi' = 'error') com_erro,
       count(*) filter (where notify->>'capi' = 'skipped') pulados
from public.meta_leads
where deleted_at is null and is_test = false and created_time >= now() - interval '30 days';

-- Funil no painel (status atual) nos últimos 28 dias
select status, count(*) from public.meta_leads
where deleted_at is null and is_test = false and created_time >= now() - interval '28 days'
group by 1 order by 1;
```

Motivos em `integration_log.detail.reason`: `no_config`/`no_token`/`no_pixel`
(segredos), `invalid_meta_lead_id` (id fora do padrão), `deleted` (lead
excluído no painel). Erros trazem `error_code` e `fbtrace_id` da Meta.

## Limites conhecidos

- Só o status do **painel do site** volta à Meta. O que acontece depois no CRM
  (Bwild Engine: reunião, proposta, contrato) ainda não é enviado — seria o
  próximo passo para um estágio mais fundo do funil (o CRM já guarda o
  `external_id` = id do lead na Meta).
- A otimização *Conversion Leads* da Meta vale para leads de **formulário
  instantâneo**. Para os leads do site, o `QualifiedLead` da CAPI continua sendo
  o sinal de qualidade (conversão personalizada), como em META-CAPI.md.
- Leads importados na primeira carga ou com mais de 72h não recebem
  `initial_lead` (ver acima); os estágios seguintes são enviados normalmente
  quando o status muda.

Referências: [Conversions API for CRM](https://developers.facebook.com/docs/marketing-api/conversions-api/guides/conversions-api-for-crm/),
[Conversion Leads — payload](https://developers.facebook.com/docs/marketing-api/conversions-api/conversion-leads-integration/payload-specification/),
[Conversion Leads — implementação](https://developers.facebook.com/docs/marketing-api/conversions-api/conversion-leads-integration/crm-integration/3-implementing-the-crm-integration/).
