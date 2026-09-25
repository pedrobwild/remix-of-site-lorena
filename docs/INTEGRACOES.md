# Integrações de dados — painel, pixel próprio, links rastreados e exportação

Página **/admin/integracoes** (menu Site › Integrações): o que está ligado
entre o site, a Meta, o Google e o CRM, o último sinal de cada integração e as
chaves da exportação para planilha e BI.

| Bloco | De onde vem |
| --- | --- |
| Status — Pixel da Meta, Google Ads, GA4/GTM | IDs em `site_settings` (/admin/seo › Analytics & Pixels) |
| Status — API de Conversões | `integration_log` (`integration = 'meta_capi'`) — ver [META-CAPI.md](META-CAPI.md) |
| Status — campanhas e formulários da Meta | `meta_sync_state` — ver [META-SYNC.md](META-SYNC.md) |
| Status — pixel próprio | `tracking_hits` |
| Exportação para planilha e BI | `export_keys` + edge function `data-export` (abaixo) |
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

## Exportação para planilha e BI

Edge function pública `data-export` (`verify_jwt = false`): entrega CSV ou
JSON para Google Sheets, Looker Studio, Excel e Power BI. Quem autoriza é uma
**chave** criada no painel (bloco "Exportação para planilha e BI").

- A chave (`bwx_` + 64 caracteres) aparece **uma vez**, logo depois de criada,
  com os endereços prontos. O banco guarda só o hash SHA-256
  (`export_keys.key_hash`); o painel mostra o prefixo, o último uso e quantas
  vezes foi usada.
- Cada chave vale só para os conjuntos marcados e pode ser **revogada** a
  qualquer hora (vale na hora). Use uma chave por planilha ou painel.
- A chave vai no parâmetro `key` (o IMPORTDATA do Google Sheets não manda
  cabeçalho), no cabeçalho `x-export-key` ou em `Authorization: Bearer …`.
  Quem tiver o endereço lê os dados até a revogação — trate como senha.
- Limites: 240 exportações por hora por chave; 60 tentativas com chave errada
  por hora por IP (o IP não é guardado).

### Conjuntos (sem dados pessoais)

| `dataset` | Uma linha por | Não sai |
| --- | --- | --- |
| `leads` | lead do site: data, status, perfil do imóvel (bairro, m², objetivo…), UTMs, página, host de origem, `has_gclid`/`has_fbclid`, envio à Meta | nome, WhatsApp, e-mail, mensagem, navegador, cookies (_fbp/_fbc), gclid/fbclid, URL completa de origem |
| `meta_leads` | lead dos formulários instantâneos: data, formulário, campanha, conjunto, anúncio, plataforma, cidade | nome, e-mail, telefone, respostas |
| `meta_ads_daily` | campanha × dia: investimento, impressões, cliques, leads (formulário, site, conversas) | — |
| `analytics_daily` | dia × origem (UTMs, site de origem) × aparelho: sessões, visitantes, páginas vistas, conversões, rejeições | — (`visitors` não soma entre linhas) |
| `tracking_daily` | dia × tipo × campanha do pixel próprio: acessos e robôs | — |

As colunas de cada conjunto estão em `supabase/functions/_shared/data-export.ts`
(`DATASETS`); os testes garantem que nenhuma coluna de dado pessoal entra.

### Endereço e parâmetros

```
…/functions/v1/data-export?dataset=meta_ads_daily&key=bwx_…
```

| Parâmetro | Valores | Padrão |
| --- | --- | --- |
| `dataset` | `leads`, `meta_leads`, `meta_ads_daily`, `analytics_daily`, `tracking_daily` | obrigatório |
| `days` | 1 a 731 (os últimos N dias, hoje incluído) | 90 |
| `from`, `to` | `AAAA-MM-DD` (inclusive; `to` padrão = hoje) — substituem `days` | — |
| `format` | `csv`, `json` | `csv` |
| `dec` | `comma` (decimal com vírgula), `dot` | `comma` |
| `sep` | `comma`, `semicolon` (Excel em português: ponto e vírgula + marca UTF-8) | `comma` |

- Dias e horas no fuso de São Paulo (`2026-09-25` e `2026-09-25 14:30:00`).
- CSV: sim/não viram `1`/`0`; o decimal com vírgula vai entre aspas; texto que
  começa com `=`, `+`, `-` ou `@` ganha um `'` na frente (não vira fórmula).
- JSON: `{ dataset, from, to, timezone, generated_at, row_count, truncated,
  columns, rows: [...] }`, com números e sim/não nativos.
- No máximo 50.000 linhas por exportação (cabeçalho `X-Export-Truncated: 1`
  quando corta — diminua o período).
- Erros em texto (ou `{ "error": … }` no JSON): 400 parâmetro inválido, 401
  chave ausente/errada/revogada, 403 conjunto fora da chave, 429 limite.

### Como usar

- **Google Sheets**: numa célula vazia, `=IMPORTDATA("<endereço CSV>")` (o
  painel monta a fórmula). Atualiza sozinho, mais ou menos a cada hora.
  Planilha configurada em inglês: acrescente `&dec=dot`. Os IDs longos da
  Meta (campanha, anúncio) viram número na planilha e perdem os últimos
  dígitos — use os nomes, ou o JSON no BI.
- **Looker Studio**: conecte a planilha do Google Sheets acima.
- **Excel / Power BI**: Obter dados › Da Web › endereço CSV (ou JSON). Para
  baixar um arquivo e abrir direto no Excel em português: `&sep=semicolon`.

### Consultas

```sql
-- Chaves ativas e uso (o hash nunca sai do banco)
select name, prefix, datasets, last_used_at, use_count
from public.export_keys where revoked_at is null order by last_used_at desc nulls last;
```
