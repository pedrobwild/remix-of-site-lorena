# Integrações de dados — painel, pixel próprio e links rastreados

Página **/admin/integracoes** (menu Site › Integrações): o que está ligado
entre o site, a Meta, o Google e o CRM, e o último sinal de cada integração.

| Bloco | De onde vem |
| --- | --- |
| Status — Pixel da Meta, Google Ads, GA4/GTM | IDs em `site_settings` (/admin/seo › Analytics & Pixels) |
| Status — API de Conversões | `integration_log` (`integration = 'meta_capi'`) — ver [META-CAPI.md](META-CAPI.md) |
| Status — campanhas e formulários da Meta | `meta_sync_state` — ver [META-SYNC.md](META-SYNC.md) |
| Status — pixel próprio | `tracking_hits` |
| Registro das integrações | últimas linhas de `integration_log` (sem dados pessoais) |

## Pixel próprio (1×1) e links rastreados

Edge function pública `px` (`verify_jwt = false`):

| Uso | Endereço | Grava |
| --- | --- | --- |
| Pixel de abertura (e-mail) | `…/functions/v1/px?c=campanha&s=origem&m=meio&n=conteudo&t=termo` | `open` |
| Pixel de visualização (página fora do site) | o mesmo com `&e=view` | `view` |
| Link rastreado (e-mail, WhatsApp, QR code, bio) | `…/functions/v1/px/go?u=<destino>&c=…` | `click` + 302 para o destino |

- O painel monta o pixel e o link para copiar (bloco "Pixel próprio e links
  rastreados"); a campanha é obrigatória.
- **Destinos permitidos** (senão vira redirecionador aberto): `https` de
  `bewild.com.br`, `wa.me`, `api.whatsapp.com`, `instagram.com` e
  `catalogobewild.com` (e subdomínios). Destino fora da lista vai para
  `https://bewild.com.br/` e não conta. Para incluir outro, edite
  `REDIRECT_HOSTS` em `supabase/functions/_shared/tracking.ts`.
- No site, os campos viram `utm_*` no destino (sem sobrescrever os que o link
  já tem): a visita cai atribuída no Analytics.
- **Sem dados pessoais**: cada acesso guarda só a campanha, o tipo, o host e o
  caminho do destino (sem a query), a família do agente (Gmail, Outlook, Apple
  Mail, celular, computador, robô), o país informado pela borda e o host de
  origem. Nada de IP, e-mail, id de lead ou cookie. O IP só entra na chave do
  limite de gravações (300 por IP a cada 10 min) e não é guardado.
- Robôs e prévias de link (WhatsApp, Slack, Facebook…) ficam marcados
  (`is_bot`) e fora das contagens.
- A resposta nunca depende do banco: se a gravação falhar, o GIF e o
  redirecionamento saem do mesmo jeito.

### Nutrição por e-mail

`enviar-nutricao` põe o pixel de abertura em cada e-mail do modelo
`nutricao-conteudo`, com a campanha tirada dos `utm_*` do link do post
(`utm_campaign`, `utm_content` = post, `utm_term` = etapa do funil). Conta
aberturas por campanha/post/etapa, sem identificar quem abriu. Os cliques já
chegam ao site com `utm_*` e aparecem no Analytics — por isso os links do
e-mail não passam pelo `/px/go`.

Limites conhecidos: o Apple Mail baixa as imagens sozinho (conta abertura a
mais) e alguns programas bloqueiam imagens (conta a menos).

### Consultas

```sql
-- Resumo por campanha (o mesmo do painel)
select * from public.tracking_hits_summary(now() - interval '30 days', now());

-- Aberturas da nutrição por post e etapa
select content post, term etapa, count(*) filter (where kind = 'open') aberturas
from public.tracking_hits
where campaign = 'nutricao_qualificados' and not is_bot
group by 1, 2 order by 3 desc;
```
