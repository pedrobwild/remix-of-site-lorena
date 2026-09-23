# Auditoria do site Bewild — bewild.com.br

**Data:** 16/09/2026 · **Branch:** `claude/charming-keller-awrwxk` · **Commit auditado:** `c09f0f6` (HEAD de `main` no início da auditoria)
**Escopo:** código real deste repositório + banco de dados do projeto Lovable + investigação de domínio/publicação. Plano de ação em `PLANO_ACAO_SITE.md`.

> **➜ Existe uma rodada mais recente.** A segunda auditoria completa (22/09/2026,
> HEAD `77dfad4`) está em
> **[`docs/auditoria/rodada-2026-09-22.md`](docs/auditoria/rodada-2026-09-22.md)**.
> Ela cobre o que entrou depois de `c09f0f6` — em especial os commits do agente
> do Lovable de 18/09 e 21/09 — e fecha ou reclassifica parte dos achados
> abaixo. Onde as duas divergirem, **vale a rodada 2**; este documento fica como
> registro do estado em 16/09 e não foi reescrito.

---

## 1. Resumo executivo

**O que está comprovado**

1. **A marca opera em dois domínios diferentes, e o Google conhece o outro.** `www.bwild.com.br` é um site Wix Studio (Premium, publicado, atualizado em 14/08/2026, com blog de 36 posts) que aparece em resultados de busca para a marca e para consultas comerciais (ex.: "reforma de studios em São Paulo"). `bewild.com.br` (este projeto, hospedado no Lovable) é um **domínio registrável diferente** — para o Google são dois sites sem relação. Não há redirecionamento nem consolidação entre eles (ver DOM-01). Este é o candidato mais forte para "aparecemos em IA, mas não no Google": a autoridade e o histórico estão em `bwild.com.br`; `bewild.com.br` começa do zero e ainda compete com o antigo.
2. **O código publicado é o código auditado.** A API do Lovable devolve `latest_commit_sha = c09f0f62…` para o projeto "Remix of Site Lorena" (id `6a6657bf-…`), idêntico ao HEAD do repositório. `bewild.com.br` e `www.bewild.com.br` resolvem para `185.158.133.1` (`lovable-app-cd-1-4.p.l5e.io`).
3. **Documentos internos estavam públicos.** `public/gpt-knowledge/*.md` (estratégia da holding, decisões da Bewander, mentoria) e `public/bakeoff/proposta-sol.html` eram servidos em `https://bewild.com.br/gpt-knowledge/…`. Corrigido (SEC-01).
4. **As meta tags por rota dependiam de uma chamada de rede.** Título, canonical e `noindex` só eram aplicados depois de `site_settings` responder. Com backend lento, toda rota interna ficava com o canonical da home e a 404 sem `noindex` por 5–9 s (medido). Corrigido (SEO-01).
5. **Assets de produção vinham do domínio de preview do Lovable** (`id-preview--….lovable.app`), inclusive a imagem LCP do hero. Corrigido (SEO-02/PERF-02).
6. **O formulário dizia "Recebemos seus dados" sem confirmação de entrega.** A chamada à edge function era fire-and-forget. Corrigido com estado de fallback honesto (LEAD-01).
7. **161 páginas de portfólio sem texto, com a mesma meta description.** 100 delas estão no sitemap. Descrição agora derivada de bairro/metragem reais; o conteúdo continua sendo um trabalho de marketing (SEO-03).
8. **Desempenho:** bundle JS único de 1,45 MB (414 kB gzip) e 7 PNGs de ~1,5 MB na home. Reduzido para 640 kB (180 kB gzip) e 216–576 kB de imagens (PERF-01/02).
9. **CI estava vermelho** por um erro de ESLint (`prefer-const`). Corrigido (CODE-01).
10. **Banner de cookies ocupava 49% da tela no celular** por um bug de CSS. Corrigido (UX-01).
11. **Search Console (17/09) fecha o diagnóstico da visibilidade:** 103 de 106 URLs em "Detectada, mas não indexada" (nunca rastreadas); **186 solicitações de rastreamento em 90 dias (~2/dia)**; uma única consulta com impressões em 3 meses ("bewild": 21 impressões, 8 cliques); teste ao vivo renderiza corretamente; sem ações manuais nem problemas de segurança. O Google não aloca rastreamento ao domínio novo — causa raiz DOM-01 (CRAWL-01).

**Hipóteses que precisam de teste (não conclua sem evidência)**

- Pré-renderização para o Googlebot no hosting do Lovable (SEO-05) — não foi possível acessar o site publicado a partir deste ambiente.
- Comportamento `www` ↔ apex (SEO-04): ambos resolvem para o Lovable; se os dois responderem 200 sem redirecionar, há duplicação de host contra o canonical (`https://bewild.com.br`).
- Situação real no índice do Google — exige Search Console (seção 6C).

**Impacto sobre o negócio.** Enquanto o domínio antigo continuar sendo "a Bwild" para o Google, campanhas e conteúdo publicados em `bewild.com.br` constroem autoridade em um domínio que o buscador ainda não associa à marca. As correções de código desta rodada removem obstáculos técnicos reais (metadados, assets, exposição de dados, peso da página, honestidade do formulário), mas **não substituem a decisão de domínio**.

---

## 2. Stack, ambientes, cobertura e limitações

| Item | Situação verificada |
|---|---|
| Framework | Vite 5 + React 18 + TypeScript, SPA. Roteador próprio **baseado em path** (`src/lib/useHashRoute.ts`; o README ainda diz "hash" — desatualizado). |
| Backend | Supabase (projeto `aamlnkmqvjcowixdgqii`) — `site_settings`, `projects` (161), `bewild_posts` (14; 6 publicados), `leads` (38), `faq_items` (7). Edge functions: `notify-lead`, `not-found-check`, `sitemap`, `robots`, `track`, etc. |
| Hospedagem | Lovable (custom domain). `bewild.com.br`, `www.bewild.com.br`, `bewander.com.br`, `bwildworkflow.com` → `185.158.133.1`. |
| Projeto Lovable | "Remix of Site Lorena", id `6a6657bf-3700-4d35-867e-c076acbf7613`, `is_published: true`, `publish_audience: public`, `latest_commit_sha: c09f0f6…` (= HEAD auditado). |
| Site legado | Wix Studio "BWILD", id `78cef3a6-…`, URL `https://www.bwild.com.br/`, Premium, publicado, Wix Blog (36 posts), Wix Forms, Promote SEO. DNS: apex `185.230.63.107`, `www` → `pointing.wixdns.net`. |
| Scripts reais | `npm run lint` · `npm test` (vitest) · `npm run build` (prebuild = gera sitemap + paridade de rotas; depois `tsc -b && vite build`). Husky pre-commit roda lint. CI em `.github/workflows/ci-build.yml`. |
| Analytics | GA4 `G-CE7GKKDG4L` hardcoded em `src/lib/ga4.ts` (gated por consentimento); Meta Pixel `644216424824915` vindo de `site_settings` (gated); tracker interno `functions/v1/track` (gated). `google_analytics_id` no banco está **nulo** → não há GA4 duplicado (hipótese descartada). |

**Cobertura desta auditoria**

- Rotas inspecionadas no navegador (build de produção servido localmente, Chromium/Playwright, larguras **360, 390, 768 e 1440 px**): `/`, `/diagnostico`, `/portfolio`, `/conteudos`, `/faq`, `/privacidade`, `/rota-inexistente` (404). Fluxo completo do formulário em 390 px.
- Templates dinâmicos `/portfolio/:slug` e `/conteudos/:slug` foram auditados **pelo código e pelo banco** (não renderizados no navegador: o backend não é alcançável deste ambiente). `/o`, `/p` (LPs noindex) e `/admin/*` auditados só pelo código.
- Verificações automáticas (axe-core) **não equivalem a certificação de acessibilidade**.

**Limitações de acesso (registradas, não contornadas)**

- O proxy de egresso deste ambiente **bloqueou** `bewild.com.br`, `www.bewild.com.br`, `www.bwild.com.br`, o preview `*.lovable.app`, `docs.lovable.dev` e `developers.google.com`. Portanto **não foi possível**: medir status HTTP/redirecionamentos/headers em produção; rodar PageSpeed/Lighthouse contra produção; confirmar o HTML que o Googlebot recebe; ler as páginas de documentação diretamente (as referências abaixo foram consultadas por busca, com data).
- Sem acesso ao Search Console, ao GA4 e ao Wix Analytics. Nenhuma consulta `site:` foi usada como inventário.
- O tracker de busca disponível (WebSearch) **não é o Google** — serve como indício, não como medição de posição.

---

## 3. Achados

Formato: **ID · Prioridade · Confiança** — URL/arquivo · causa · impacto · correção · critério de aceite · status.
Prioridades: P0 falha crítica demonstrada · P1 impacto claro · P2 incremental/precisa validação.

### 3.1 Domínio, descoberta e indexação

**DOM-01 · P0 · Confiança alta (causa provável da baixa visibilidade; requer GSC para fechar)**
- **Evidência:** DNS (`getent hosts`, 16/09/2026): `bwild.com.br` → Wix; `bewild.com.br` → Lovable. Wix MCP: site "BWILD" publicado em `https://www.bwild.com.br/`, atualizado em 14/08/2026, 36 posts em `/post/<slug>`. Busca (16/09/2026): `www.bwild.com.br` aparece com título "Reforma de Studios em São Paulo - Entrega a partir de 55 dias uteis | Bwild", além de `/search` e `/post/5-motivos-para-investir-em-short-stay-em-2025`; nenhuma URL de `bewild.com.br` apareceu.
- **Causa:** migração de marca/domínio sem consolidação. Para o Google, `bwild.com.br` e `bewild.com.br` são entidades independentes; o antigo tem histórico, links e conteúdo indexado; o novo, não.
- **Impacto:** buscas de marca e comerciais continuam entregando o site antigo; o novo domínio não herda nada; campanhas apontando para `bewild.com.br` não constroem a autoridade que já existe.
- **Correção (decisão de negócio, não de código):** (a) definir o domínio canônico da marca; (b) se for `bewild.com.br`, mapear **URL por URL** o Wix → novo site (home, páginas, 36 posts → `/conteudos/<slug>` ou `/conteudos`), configurar **301 no Wix** (Wix › SEO › Redirecionamentos, ou "Transferir domínio" se o domínio for movido), manter os 301 por ≥ 12 meses, usar **Alteração de endereço** no Search Console e manter as duas propriedades; (c) se for manter os dois sites com papéis distintos, documentar isso e evitar conteúdo duplicado entre eles.
- **Aceite:** `curl -sI https://www.bwild.com.br/` → `301` para `https://bewild.com.br/`; amostra de 10 URLs de `/post/` respondendo 301 para o destino mapeado; GSC do domínio antigo com "Alteração de endereço" concluída.
- **Status:** **decidido em 17/09/2026 (marketing): domínio oficial `bewild.com.br`; `bwild.com.br` vira site legado com 301 URL por URL.** **Executado em 17/09 pela API do Wix: 179 redirecionamentos 301 (36 posts, 11 páginas, 19 internos recriados, 110 projetos, 3 categorias), 0 falhas** — detalhes em `docs/auditoria/mapa-redirecionamento-wix.md`. Pendentes: home do Wix (a raiz não pode ser origem na API — plano em 2 fases), publicação dos 5 rascunhos para fechar 22 destinos provisórios, *Alteração de endereço* no GSC.
- **Recomendação (17/09, com a evidência do GSC):** consolidar em `bewild.com.br`. O site Wix tem exatamente o conteúdo que a Bewild oferece hoje (reforma de studios em SP, 36 posts) e concentra os links, o histórico e as buscas de marca; a holding pode usar `bwildventures.com.br`, que já existe. Implementação: 301 URL por URL no Wix (mapa em `docs/auditoria/mapa-redirecionamento-wix.md`), manter por ≥ 12 meses, depois "Alteração de endereço" no GSC. Enquanto os dois domínios coexistirem sem redirecionamento, `bewild.com.br` continua sem motivo para ser rastreado (~2 solicitações/dia).

**SEO-04 · P1 · Confiança média (hipótese; teste de 1 minuto)**
- **Evidência:** o usuário informa `https://www.bewild.com.br` como URL pública; `index.html`, `robots.txt`, `sitemap.xml`, `useSeo.ts` e `site_settings.seo_canonical_base` usam **`https://bewild.com.br`** (sem www). Ambos os hosts resolvem para o Lovable.
- **Risco:** se `www` responder 200 sem redirecionar para o apex, o Google recebe dois hosts com o mesmo conteúdo e canonical cruzado.
- **Correção:** confirmar no painel do Lovable qual host é o primário e se o outro redireciona (301). Alinhar campanhas, GSC (propriedade de domínio `bewild.com.br` cobre os dois) e materiais ao host canônico.
- **Aceite:** `curl -sI https://www.bewild.com.br/` → `301/308 Location: https://bewild.com.br/` (ou o inverso, com o canonical atualizado em código e banco).
- **Status:** verificado em 16/09: `www.bewild.com.br` → 302 para `https://bewild.com.br/` (direção correta; 301 seria o ideal — configuração do Lovable, sem ação de código).

**SEO-05 · Descartado em 17/09 (teste ao vivo no GSC: renderização OK)**
- **Evidência:** SPA React/Vite. `index.html` estático traz título, description, canonical (`https://bewild.com.br/`) e hreflang **da home** para qualquer URL. A documentação do Lovable (consultada por busca em 16/09/2026; página não acessível diretamente) afirma que projetos React+Vite publicados recebem pré-renderização sob demanda **apenas para crawlers verificados** (Google, Bing, bots de preview social e de IA) — scanners comuns veem o shell da SPA. [Ref. Lovable SEO/AEO](https://docs.lovable.dev/features/seo-aeo)
- **Risco:** se a pré-renderização não estiver ativa para este domínio/projeto, toda URL profunda pode ser lida como duplicata da home (canonical → `/`).
- **Correção:** validar no Search Console › Inspeção de URL › *Testar URL ativa* › *Ver página rastreada* em `/faq`, `/portfolio/<slug>` e `/conteudos/<slug>`: o HTML rastreado deve conter o `<title>` e o `<link rel="canonical">` **da própria página**. Se contiver os da home, escalar ao suporte do Lovable ou avaliar SSR (a documentação indica que projetos novos usam TanStack Start com SSR; migração só com justificativa comparada).
- **Aceite:** 3 URLs inspecionadas mostrando title/canonical próprios no HTML rastreado; "Canonical selecionada pelo Google" = a própria URL.
- **Status:** encerrado — "Testar URL publicado" de `/faq` retornou HTML completo com `<title>` e canonical próprios, JSON-LD e conteúdo do banco.

**CRAWL-01 · P1 · Confiança alta (GSC, 17/09)**
- **Evidência:** Inspeção de URL — `/diagnostico` e `/portfolio/ab-the-collection-moema`: "Detectada, mas não indexada no momento", último rastreamento N/D, "Página de referência: nenhuma detectada", apesar de estarem no sitemap desde 11/07 e linkadas em todas as páginas. `/faq`: indexada, último rastreamento 12/07. Post `/conteudos/reforma-turn-key-ou-tradicional`: rastreado 15/09 (Googlebot Smartphone, busca com êxito, indexação permitida), não indexado; páginas de referência: `/faq` e um site de scraping (`jacobverghese.info` — irrelevante, ignorar). GSC › Páginas (17/09): **103 URLs "Detectada, mas não indexada"**. Estatísticas de rastreamento: **186 solicitações em 90 dias**. Desempenho: só a consulta "bewild".
- **Causa provável:** orçamento/prioridade de rastreamento muito baixos para o domínio (novo, sem links externos — DOM-01), agravados pelo período em que as páginas internas se declaravam duplicatas da home (SEO-01).
- **Impacto:** a página de conversão (`/diagnostico`) e o portfólio inteiro não existem para o Google.
- **Correção:** (1) "Solicitar indexação" no GSC para as URLs prioritárias (cota ≈10/dia): dia 1 `/diagnostico`, `/portfolio`, `/conteudos`, `/faq`, `/privacidade` + 5 posts; dia 2 o 6º post + 9 projetos com mais fotos; dias 3–5 demais projetos por relevância comercial; (2) sitemap regenerado com `lastmod` reais (feito 17/09) e reenviado no GSC; (3) links externos para o domínio novo — o mais eficaz é o redirecionamento do site Wix (DOM-01).
- **Aceite:** em 7 dias, `/diagnostico` e `/portfolio` com "Último rastreamento" preenchido; em 28 dias, indexadas.

**SEO-01 · P1 · Confiança alta — CORRIGIDO**
- **Arquivo:** `src/lib/useSeo.ts`, `src/lib/useSiteSettings.ts`.
- **Evidência:** teste com backend indisponível: `/faq` manteve title/canonical da home por 5 s e só aplicou os próprios aos 9 s; a 404 ficou com `robots: index, follow` durante esse tempo (`docs/auditoria/evidencias/browser-report.json`).
- **Causa:** `applySeo` só rodava após `fetchSiteSettings()` resolver.
- **Correção:** aplicação síncrona com settings em cache/defaults (`getCachedSiteSettings`) e refino assíncrono. Teste `src/lib/__tests__/useSeo.immediate.test.tsx`.
- **Aceite:** com backend pendurado, title/canonical/robots da rota presentes em < 1 s (verificado: 600 ms em `/faq`, `/portfolio` e 404 com `noindex`).
- **Confirmação em produção (GSC, 17/09):** o post `/conteudos/reforma-turn-key-ou-tradicional`, rastreado em 15/09 (antes da correção), aparece com "URL canônico declarado pelo usuário: https://bewild.com.br/" — a página se declarava cópia da home. Teste ao vivo de `/faq` em 17/09 (após a correção): canonical `/faq` e title próprios.

**SEO-02 / PERF-02 · P1 · Confiança alta — CORRIGIDO**
- **Arquivos:** `src/pages/home-bwa-body.ts`, `src/pages/HomePage.tsx`.
- **Evidência:** 15 referências a `https://id-preview--6a6657bf-….lovable.app/__l5e/assets-v1/...` (10 assets distintos, incluindo o hero LCP `hero-cozinha.jpg`) + `preconnect` ao preview. 7 renders eram PNG de 1,5–1,7 MB (≈10,8 MB); as variantes `sm/md/lg` em webp/avif/jpg já existiam em `public/images/hero-slides/`.
- **Impacto:** conexão extra no caminho crítico do LCP; dependência de um ambiente que não é produção; imagens do site atribuídas a `lovable.app`; ~10 MB de imagem em uma página.
- **Correção:** assets restantes passam a usar o mesmo origin (`/__l5e/…`, mesmo mecanismo que o vídeo já usava); 7 PNGs trocados por `srcset` local. Medido: 216 kB (390 px) e 576 kB (1440 px), 0 imagens quebradas.
- **Aceite pós-publicação:** `curl -o /dev/null -w '%{http_code}' https://bewild.com.br/__l5e/assets-v1/678d3d65-ecc9-4cb9-84f3-276275a02ad3/hero-cozinha.jpg` → 200; nenhuma requisição a `lovable.app` na home (DevTools › Network).

**SEO-03 · P1 · Confiança alta — PARCIALMENTE CORRIGIDO**
- **Evidência (banco, 16/09/2026):** 161 projetos visíveis; **161 sem `seo_description`**, **161 com 0 caracteres** em summary/intro/desafio/solução/resultado, **147 sem `cover_alt`**, 0 com ano/prazo/depoimento/antes-depois; 9 slugs de 2–3 letras (`fg`, `bf`, `dm`, `ff`, `rm`, `rjm`, `ag`, `es`, `rt`); títulos no padrão "AB - PENÍNSULA VILA MADALENA" (iniciais do cliente + empreendimento); pares quase idênticos (`fd-nex-one-vila-nova` / `fd-next-one-vila-nova`). Todas caíam na mesma description "Apartamento reformado pela Bewild em São Paulo ou Rio de Janeiro." 100 dessas URLs estão em `public/sitemap.xml`.
- **Impacto:** páginas finas e quase duplicadas concorrem entre si e diluem o rastreamento; risco de "Rastreada, mas não indexada".
- **Correção aplicada:** `src/lib/projectSeo.ts` monta a description com bairro/metragem/tipo reais (120 projetos têm bairro, 67 têm metragem); nada é inventado. Testes em `src/lib/__tests__/projectSeo.test.ts`.
- **Correção pendente (marketing/admin):** texto real (2–4 frases) e `cover_alt` nos 20–30 projetos mais fortes; corrigir bairros com erro de digitação no admin ("Brookling", "Pinheiro", "Campo Bela", "Avenida Salgado Filho" como bairro) — **eles agora aparecem na meta description**; decidir se projetos sem texto ficam fora do sitemap (mudança de 1 linha em `scripts/generate-sitemap.mjs`) ou recebem `noindex` até terem conteúdo; unificar duplicatas.
- **Aceite:** amostra de 10 projetos com description única e coerente; bairros corrigidos; sitemap coerente com a política escolhida.

**SEO-06 / CONT-01 · P1 · Confiança alta (decisão de conteúdo)**
- **Evidência:** `<title>` e description (index.html, `site_settings`, HomePage) dizem "São Paulo **e Rio de Janeiro**"; texto da home cita "Rio de Janeiro" 3×; mas JSON-LD `areaServed` = São Paulo, FAQ ("A Bewild atua em São Paulo… mais de 150 studios"), `llms.txt`, `site.webmanifest`, README e o brief desta auditoria dizem São Paulo. Números de prova também divergem: `/diagnostico` mostra "+80 obras entregues" e "60 dias úteis"; FAQ e `llms.txt` dizem "mais de 150 studios" e "55 dias úteis".
- **Impacto:** entidade inconsistente para o Google e para IAs; promessa que o atendimento pode não sustentar.
- **Decisão (17/09/2026, marketing):** área de atuação = **São Paulo** (capital); prazo oficial = **60 dias úteis**; prova = **+160 reformas entregues** (já na home). **Aplicado (rodada 3):** title/description/OG/Twitter/JSON-LD em `index.html`, `HomePage.tsx`, rodapés (`BwaFooter`, `SiteFooter`, home), FAQ 06 da home, `/conteudos`, `/portfolio` (description), fallback de `/portfolio/:slug`, `llms.txt`, fallback do FAQ (`useFaq.ts`), métricas legadas; no banco: `site_settings.seo_default_title/description` e 2 respostas de `faq_items` (valores antigos: "55 dias úteis" e "mais de 150 studios"). Posts do blog não foram alterados (nenhum cita RJ/55/150).

**SEO-07 · P2 · Confiança alta**
- `docs/ROUTING.md` afirma que crawlers "precisam saber se uma URL é válida" via a edge function `not-found-check`. O Googlebot **nunca chama** essa função: ele recebe o `index.html` (HTTP 200) para qualquer path — a 404 é "soft" e só vira `noindex` após o JS (agora imediato, SEO-01). A função serve a testes internos. Ajustar a documentação para evitar falsa segurança. `seo_404_log` tem 0 linhas — ou não há 404s, ou a RPC `log_404` não está sendo aceita; verificar no admin.

**SEO-08 · P2 · Confiança alta** — regenerado manualmente em 17/09 a partir do banco (173 URLs, `lastmod` real por projeto/post; ver A-28 para automatizar).
- `public/sitemap.xml` (106 URLs, 16/09: regenerado só quando há `.env` no build — no CI não há, então o arquivo commitado é o que vale). `lastmod` das páginas estáticas = data do build (não é a data real de alteração). As edge functions `sitemap` e `robots` são **duplicatas não usadas** (o hosting serve `public/`), com regra diferente (`visible` vs `visible+published`) — remover ou alinhar.

**SEO-09 / CONT-03 · P1 · Confiança alta (conteúdo)**
- Wix tem **36 posts publicados** (fev/2025–nov/2025) com temas de intenção comercial (custo de reforma por m², estudos de mercado por bairro, Airbnb em SP). O novo site tem 6 posts publicados e **8 rascunhos prontos** (1,6–4,2 mil caracteres cada: "quanto custa reformar um studio para short stay em SP", "melhores bairros para short stay", etc.). Se houver migração de domínio, cada post do Wix precisa de destino (post equivalente, `/conteudos` ou 410). Sem migração, o blog antigo continua capturando a demanda.

**SEO-10 · P2** — Open Graph/Twitter: `og:image` 1200×630 presente (`og_final_v2.jpg`, 162 kB); `og:title`/`og:description` são inseridos no fim do `<head>` do `index.html` (funciona, mas fora do bloco OG). Sem defeito comprovado.

### 3.2 Captura de leads, atribuição e mensuração

**LEAD-01 · P1 · Confiança alta — CORRIGIDO**
- **Arquivo:** `src/pages/DiagnosticoPage.tsx`, `src/lib/leadDelivery.ts`.
- **Evidência:** `void supabase.functions.invoke("notify-lead")` sem aguardar; `setSuccess(true)` incondicional. Teste no navegador com backend inacessível: UI mostrou "Recebemos seus dados" mesmo com a chamada falhando. Além disso, `notify-lead` responde **HTTP 200 mesmo quando banco, Slack e CRM falham** (`{ok:true, lead_insert:{status:"error"}, slack:"skipped", crm:"skipped"}`).
- **Correção:** WhatsApp abre antes de qualquer `await` (evita bloqueio de popup); a UI aguarda a função (teto de 8 s) e só confirma quando **banco, Slack ou CRM** devolvem `sent` (`isLeadDelivered`); senão mostra estado de fallback pedindo para concluir pelo WhatsApp. `generate_lead` (GA4) ganha o parâmetro `delivery: confirmed | whatsapp_fallback`. Testes em `src/lib/__tests__/leadDelivery.test.ts`.
- **Verificação parcial:** o caminho até Slack/CRM (Bwild Engine `lead-webhook`) **não foi exercitado** — exige ambiente de teste com as secrets. A verificação ponta a ponta fica para o plano.

**LEAD-03 · P1 · Confiança alta**
- **Evidência:** o payload do lead lê `utm_*` de `window.location.search` **no momento do envio**. Quem chega em `/` com UTM e clica em "Solicitar orçamento" navega para `/diagnostico` sem query → UTM perdida. O tracker interno (`src/lib/analytics.ts`) já persiste first/last-touch em storage (`bewild_utm`, `bewild_first_utm`, `bewild_landing`), mas o formulário não os usa. Banco: 22 de 38 leads sem UTM; `landing_path` registrado (`/diagnostico`: 22, `/o`: 15, `/p`: 1).
- **Correção (rodada 2):** (1) a navegação SPA interna carrega `utm_*`/`gclid`/`fbclid` da URL atual para o destino (`carryCampaignParams` em `navigate()`), sem cookie e sem depender de consentimento; (2) no envio, precedência URL → last-touch da sessão → first-touch do visitante (`resolveLeadAttribution`), com `landing_path`/referrer persistidos quando existem. Testes em `src/lib/__tests__/campaignParams.test.ts`.
- **Aceite:** landing em `/?utm_source=x` → clique → envio: lead com `utm_source=x` (verificar no admin `/admin/leads` com um lead de teste).

**LEAD-02 · P2 · Confiança alta**
- `notify-lead` não valida entrada no servidor (aceita qualquer JSON; nome vazio vira "Lead sem nome") e não limita taxa. A tabela `leads` tem política `INSERT WITH CHECK (true)` para `anon`, **não usada** pelo front (o insert é feito pela função com service role). Propor: validação zod na função, honeypot no form, remover a política de insert anônimo (migration) — depois de confirmar que nenhum fluxo externo depende dela.

**LEAD-04 · P2** — Os 38 leads estão com `status = novo` no admin; o CRM efetivo é o Bwild Engine. Definir qual é a fonte de verdade para evitar dois funis.

**LEAD-05 · Lacuna** — Não há **critério de lead qualificado** documentado neste repositório. O único material encontrado é o ICP no knowledge do workspace Lovable (projeto "Bwild Visual Budgets"): investidor de studio compacto, 21–35 m², ticket médio R$ 63,5 k, maioria por indicação. Registrado como lacuna; nenhum corte de orçamento foi inventado.

**MEAS-01 · P2** — GA4 (`G-CE7GKKDG4L`), Meta Pixel e tracker interno só carregam após "Aceitar" (LGPD) — correto, mas significa que **recusas não são medidas** (nem em modo sem cookies). `page_view` manual por rota, sem duplicidade (verificado: `google_analytics_id` nulo no banco). Sem GTM. Não há evento de "lead entregue" distinto de "clique em CTA" além do novo parâmetro `delivery`.

### 3.3 Desempenho (laboratório local; sem dados de campo)

Referência: Core Web Vitals no p75 — LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1 ([web.dev/vitals](https://web.dev/articles/vitals)). **Não foi possível rodar PSI/Lighthouse contra produção** (bloqueio de rede). As medições abaixo são do build local; TBT de laboratório não é INP.

**PERF-01 · P1 · Confiança alta — CORRIGIDO (parcial)**
- Bundle único `index-*.js` de **1.450 kB (414 kB gzip)** carregado por todo visitante, incluindo painel admin, `recharts`, `@dnd-kit`. Após `React.lazy` nas 13 páginas admin (`src/router.tsx`): **640 kB (180 kB gzip)** + chunks sob demanda. Ainda alto: `gsap`+`lenis` (home), `marked`+`dompurify` (posts), `lucide-react`. Próximo passo: lazy em `BewildPostPage` e nos pesos da home.

**PERF-03 · P1 · Confiança alta — CORRIGIDO**
- `index.html` fazia `<link rel="preload" as="image" fetchpriority="high">` de `/hero-studio-desktop.webp` (60 kB) + `imagesrcset` mobile — **nenhuma página usa essas imagens** (grep em `src/`: 0 ocorrências). Download prioritário inútil em todas as rotas, competindo com o LCP real. Removido.

**PERF-04 · P2 · Confiança média** — Hero LCP `hero-cozinha.jpg` = 352 kB JPEG sem variantes responsivas (o binário não está no repositório; está no asset store). Gerar webp/avif em 3 larguras e usar `srcset`. Medir LCP antes/depois no PSI.

**PERF-05 · P2 · Confiança média** — `index.html` carrega Google Fonts com 5 famílias/~20 pesos (render-blocking); `HomePage`/`Diagnostico` injetam **outra** folha do Google Fonts. Reduzir às famílias usadas e/ou self-host com `font-display: swap`. Medir.

**PERF-06 · P2** — `src/index.css` global com 238 kB (42 kB gzip) inclui páginas legadas (`.sobre-page`, etc.) em todas as rotas. Limpeza incremental.

**PERF-07 · P2 (informativo)** — Terceiros na home: selo Reclame Aqui (`s3.amazonaws.com/raichu-beta/ra-verified/bundle.js`), Google Fonts. GA4/Pixel só após consentimento. O HTML publicado também traz `<script defer src="/~flock.js" data-proxy-url="/~api/analytics">`, injetado pelo hosting do Lovable (analytics da plataforma; não está no repositório e carrega sem depender do banner) — verificar na documentação do Lovable se é cookieless e, se necessário, desativar nas configurações do projeto.

### 3.4 Design, experiência e acessibilidade

Positivos verificados: um único `<h1>` por página; hierarquia H2/H3 coerente na home; skip link "Pular para o conteúdo"; foco visível em todos os 12 primeiros elementos tabuláveis de cada rota; botão do menu com `aria-label="Abrir menu"` e `aria-expanded`; campos com `<label>`, `autocomplete` e `inputmode`; `lang="pt-BR"`; sem rolagem horizontal em 360/390/768/1440; sem links vazios; `rel="noopener noreferrer"` nos `_blank`.

**UX-01 · P1 · Confiança alta — CORRIGIDO**
- `.cookie-banner__text { flex: 1 1 320px }` + `flex-direction: column` no mobile → o `flex-basis` vira **altura**: banner com **393 px = 49 % da viewport** em 390 px, cobrindo o CTA sticky. Correção: `flex-basis: auto` na media query. Medido depois: 127 px (16 %). Evidência: `docs/auditoria/evidencias/home-390-antes.png` vs `home-390-depois.png`.

**A11Y-01 · P2 · Confiança alta** — 8 de 16 imagens da home com `alt=""` (renders do "story" e do comparador — são conteúdo, não decoração). Escrever `alt` descritivo (copy). No portfólio, 147/161 sem `cover_alt` (admin).

**A11Y-02 · P2 · Confiança média** — axe `color-contrast`: home 1440 (21 nós) — passos inativos do "story" em `#b7b8ba`/`#cacccd` sobre `#faf8f4` (1,5–1,9:1; parece intenção de "apagar" o passo inativo, mas o texto fica ilegível para baixa visão); `/diagnostico` (12 nós) — "(opcional)" `#8d9199` 11 px (3,2:1), nota do rodapé do form `#767b84` 10 px (4,25:1), numerais `#7f8389` 10 px (3,6:1). Escurecer os tokens cinza mantendo a hierarquia.

**A11Y-03 · P2** — `.bwa-mobile-cta` fora de landmarks; `role="listitem"` em `<article>` (`.bwa-ccard`). Ajustes de semântica.

**UX-02 · P2** — Alvos pequenos: link "Política de Privacidade" no banner (135×14 px), "FAQ" no nav desktop (20×35 px), links inline de 24 px de altura nas páginas internas. Aumentar área clicável com padding.

**UX-03 · P2 (clareza da oferta)** — A home explica o que fazemos, para quem (morar/alugar/vender), como funciona e o próximo passo. Faltam na home: **onde atendemos** de forma explícita (só aparece no FAQ e — de forma conflitante — no title) e a prova numérica consistente (CONT-01). O link do LinkedIn no rodapé é genérico (`https://www.linkedin.com/`) — placeholder (CONT-04).

**CODE-04 · P1 · Confiança alta** — `src/pages/LpObraPage.tsx` (`/o`, LP das placas com QR — **15 dos 38 leads** vieram dela) aponta a demonstração do Workflow para o **preview** de outro projeto Lovable (`id-preview--c9754542-….lovable.app/vitrine/…`), com TODO de troca no go-live. `bwildworkflow.com` já resolve para o Lovable. Verificar que a URL de produção responde e trocar.

### 3.5 Código, segurança e manutenção

**SEC-01 · P0 · Confiança alta — CORRIGIDO**
- `public/gpt-knowledge/01…05.md` (estratégia da holding, decisões de negócio da Bewander, copy travada, processo com agentes, mentoria/carreira de pessoa nomeada) e `public/bakeoff/proposta-sol.html` eram servidos publicamente. Nenhum código os referenciava. Movidos para `docs/internal/` (com README). Sem credenciais nos arquivos (as ocorrências de "senha" eram "desenha"). **Verificado em produção (16/09/2026, após o deploy do PR #3):** o hosting do Lovable **continuou servindo** o arquivo antigo (`application/octet-stream`, conteúdo real) — arquivos estáticos removidos do build não são apagados, só sobrescritos. Correção adicional: stubs "Documento removido." nos mesmos caminhos (`public/gpt-knowledge/*.md`, `public/bakeoff/proposta-sol.html` — **não apagar**) + `Disallow: /gpt-knowledge/` e `/bakeoff/` no `robots.txt`. Aceite: `curl -s https://bewild.com.br/gpt-knowledge/01_fonte_de_verdade.md` → `Documento removido.`. Pendente: pedir ao suporte do Lovable a remoção definitiva dos objetos e, se a URL tiver sido indexada, remoção no Search Console.

**SEC-02 · P2 (informativo)** — Chave `anon` do Supabase hardcoded como fallback em `vite.config.ts`. Chave pública por natureza; não é vazamento. RLS de `leads`: SELECT/UPDATE/DELETE só admin; INSERT anônimo aberto (ver LEAD-02). `previewAuthStorage` só ativa em zonas de preview.

**CODE-01 · P1 · Confiança alta — CORRIGIDO** — `prefer-const` em `src/integrations/supabase/previewAuthStorage.ts` fazia o step `Lint (eslint)` do CI falhar (`.github/workflows/ci-build.yml`). Agora: 0 erros, 5 warnings.

**CODE-02 · P2** — A home é uma string HTML de 64 kB em `src/pages/home-bwa-body.ts` (`dangerouslySetInnerHTML`) + `home-bwa-script.js`; scripts `update_home*.py` na raiz. Qualquer ajuste de copy exige editar string escapada. Funciona, mas custa manutenção. Manter até haver justificativa para componentizar.

**CODE-03 · P2** — Nomes legados: pacote `lorenaalvesarq`, repositório "remix-of-site-lorena", chave de consentimento `lal_cookie_consent`, README com "roteador hash", `MAINTENANCE_MODE` em `src/config/site.ts` (hoje `false` — se virar `true`, **todo o site público vira página de manutenção `noindex`**; manter fora do alcance de edições casuais).

**CODE-05 · P2** — `MetaPixel.tsx` diz que o `fbq('init')` "fica no index.html", mas o `index.html` não o tem (LGPD). O componente só dispara PageView de rota quando `fbq` existe (injetado pelo `useSeo` após aceite). Comentário desatualizado; comportamento correto.

---

## 4. Diagnóstico da visibilidade no Google — etapa a etapa

| Etapa | Situação | Evidência / o que falta |
|---|---|---|
| Descoberta | **OK (GSC, 17/09)** | Sitemap "Processado": enviado 11/07, última leitura 06/09, 106 URLs encontradas. Links internos rastreáveis. Regenerado em 17/09 com 173 URLs (161 projetos, 6 posts, 6 estáticas) e `lastmod` reais. Pendente: o domínio novo continua sem links do domínio antigo (DOM-01). |
| Rastreamento | **Gargalo confirmado (GSC, 17/09)** | `/diagnostico` e `/portfolio/ab-the-collection-moema`: "Detectada, mas não indexada no momento", **nunca rastreadas** (no sitemap desde 11/07). `/faq`: último rastreamento **12/07**. Post `/conteudos/reforma-turn-key-ou-tradicional`: rastreado 15/09. O Google visita o domínio muito pouco (típico de domínio novo sem autoridade — DOM-01) e o pouco que rastreou antes de 16/09 se declarava cópia da home (SEO-01). Ver CRAWL-01. Estatísticas de rastreamento (10/07–14/09): **186 solicitações em 90 dias (~2/dia)**, 10,9 MB baixados, resposta média 667 ms; picos isolados (15–38/dia) no envio do sitemap e após deploys, resto do tempo 0–1. |
| Renderização | **OK (teste ao vivo, 17/09)** | "Testar URL publicado" de `/faq` devolveu HTML renderizado completo: `<title>Perguntas frequentes | Bewild</title>`, canonical `/faq`, `robots index, follow`, JSON-LD FAQPage/Breadcrumb, conteúdo do FAQ vindo do banco, sem mensagens de console. Hipótese SEO-05 descartada. |
| Indexação | **Parcial (GSC, 17/09)** | Indexadas: `/` e `/faq`. Não indexadas: `/diagnostico`, projeto e post inspecionados. No post rastreado em 15/09 o Google registrou **"URL canônico declarado pelo usuário: https://bewild.com.br/"** — evidência direta do bug SEO-01 em produção (corrigido em 16/09). GSC › Páginas: **103 URLs "Detectada, mas não indexada no momento"** (fonte: sistemas do Google) e 1 "Página alternativa com tag canônica adequada"; nenhum bloqueio, erro de servidor ou soft 404. |
| Exposição a consultas | **Nula fora da marca (GSC, 17/09)** | Desempenho (3 meses): uma única consulta com impressões — "bewild", 21 impressões, 8 cliques. Nenhuma consulta comercial e nem "bwild" (essas buscas vão para o site Wix). |
| Clique | Só marca | 8 cliques em 21 impressões para "bewild" (CTR alto, típico de marca). Copy alinhada em 17/09 (SP · 60 dias úteis · +160). |
| Conversão | Instrumentada | Formulário → `notify-lead` → banco/Slack/CRM; WhatsApp direto; 20 leads em 30 dias. Falta: taxa por origem (LEAD-03) e confirmação ponta a ponta (LEAD-01 parcial). |

**Conclusão (atualizada em 17/09 com o Search Console):** o Google descobre as URLs (sitemap OK) e consegue renderizar o site (teste ao vivo OK), mas **rastreia muito pouco** o domínio: páginas comerciais no sitemap desde julho nunca foram buscadas, e as poucas rastreadas antes de 16/09 se declaravam cópia da home (SEO-01, confirmado no rastreamento do post em 15/09). Duas causas se somam: baixa prioridade de rastreamento de um domínio novo sem autoridade (DOM-01 — o site Wix continua sendo "a Bwild" para o Google) e o defeito técnico já corrigido. Próximos passos que dependem do Google: pedir indexação das URLs prioritárias (força novo rastreamento com a canonical correta), sitemap regenerado e reenviado, e a decisão de domínio. Ações manuais e problemas de segurança: **nenhum** (17/09) — penalização descartada.

**Evidência mínima pedida (Search Console, propriedade `https://bewild.com.br/`) — recebido em 17/09: itens 1–5 completos (capturas em anexo à conversa):**
1. Sitemaps: status, data da última leitura, URLs descobertas/indexadas.
2. Inspeção de URL de `/`, `/diagnostico`, `/portfolio`, `/faq`, 1 projeto e 1 post: "URL está no Google?", último rastreamento, canonical declarada vs selecionada, **e o teste ao vivo com "Ver página rastreada"** (HTML).
3. Páginas › motivos de "Não indexadas" com contagem e 5 URLs de exemplo por motivo.
4. Desempenho (90 dias): consultas e páginas, filtro de marca vs não marca, país BR, dispositivo.
5. Ações manuais / Problemas de segurança.
6. Se existir propriedade do `bwild.com.br`: os mesmos itens 1, 3 e 4.

**Sobre "aparecemos em IA":** não recebemos plataforma, pergunta, data nem URL citada. Sem isso não dá para distinguir menção à marca (provavelmente vinda do site Wix, Reclame Aqui e Instagram), citação de outra fonte, ou link para `bewild.com.br`. Menção em uma IA externa **não** comprova indexação no Google; elegibilidade para AI Overviews/AI Mode exige a página indexada e com snippet permitido ([Google: recursos de IA](https://developers.google.com/search/docs/appearance/ai-features)). `llms.txt` e `robots.txt` liberando GPTBot/ClaudeBot/PerplexityBot existem, mas não são requisito nem solução central.

---

## 5. Verificações realizadas (registro)

| Verificação | Resultado |
|---|---|
| `npm ci` · `npm run lint` | Antes: 1 erro + 4 warnings (CI vermelho). Depois: 0 erros, 5 warnings. |
| `npx tsc -b` | OK antes e depois. |
| `npm test` (vitest, jsdom) | Antes: 88 passed, 4 skipped. Depois: **98 passed**, 4 skipped (10 testes novos). |
| `npm run build` | Antes: `index-*.js` 1.450 kB / 414 kB gzip. Depois: 640 kB / 180 kB gzip + 14 chunks admin. Prebuild: paridade de rotas OK; sitemap mantido (sem `.env`). |
| Playwright (Chromium) — 7 rotas × 360/390/768/1440 | Sem overflow horizontal; console só com falhas de rede esperadas (backend/fonts bloqueados no ambiente); axe: 2 violações `serious` de contraste (A11Y-02), 2 `minor`/`moderate` (A11Y-03). Relatório: `docs/auditoria/evidencias/browser-report.json`. |
| Fluxo do formulário (390 px) | Validação por campo funciona; submit desabilitado até preencher obrigatórios; após envio com backend indisponível: estado de fallback (antes: falso sucesso). Popup `wa.me` disparado. |
| Tempo de aplicação das metas por rota (backend pendurado) | Antes: 5–9 s. Depois: ≤ 600 ms (`/faq`, `/portfolio`, 404 com `noindex`). |
| Banner de cookies @390 | Antes 393 px (49 %). Depois 127 px (16 %). |
| Imagens da home | Antes: 15 refs ao preview, 7 PNG ≈ 10,8 MB. Depois: 0 refs ao preview; 216 kB (390) / 576 kB (1440), 0 quebradas. |
| Banco (Lovable MCP, somente leitura) | `site_settings`, contagens de projetos/posts/leads/FAQ, campos preenchidos, `seo_404_log` (0 linhas). |
| DNS | `getent hosts` para bewild/bwild/bewander/bwildworkflow (seção 2). |
| Wix (MCP, somente leitura) | Site BWILD, 36 posts (lista de slugs disponível para o mapa de redirecionamento). Endpoint de URLs publicadas devolveu 403 (permissão). |
| Não realizado | HTTP/redirects/headers em produção; PSI/Lighthouse em produção; GSC; teste ponta a ponta Slack/CRM; Wix Analytics. |

**Referências consultadas (por busca, 16/09/2026; páginas não acessíveis diretamente deste ambiente):**
- Lovable — SEO & AI search: https://docs.lovable.dev/features/seo-aeo (pré-renderização sob demanda para crawlers verificados em projetos React+Vite; projetos novos com SSR).
- Lovable — Custom domain: https://docs.lovable.dev/features/custom-domain (A `@` e `www` → `185.158.133.1`; TXT `_lovable`; SSL automático).
- Google — JavaScript SEO basics: https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- Google — Inspeção de URL: https://support.google.com/webmasters/answer/9012289?hl=pt-BR
- Google — Solicitar novo rastreamento: https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl
- Google — Recursos de IA: https://developers.google.com/search/docs/appearance/ai-features
- Web Vitals: https://web.dev/articles/vitals

---

### 5.4 Rodada 3 — plano "Blog SEO + IA" (22/09/2026)

| Verificação | Método | Resultado |
|---|---|---|
| Estado do blog no banco antes da rodada | `information_schema` + `select` em `bewild_posts` | 6 publicados, 8 rascunhos (desde 24/08); 3 rascunhos sem FAQ; 3 `meta_title` com "BeWild"; todos assinados "Equipe Bewild"; `updated_at` existe com trigger `set_updated_at` |
| Correção do plano: "só o /faq emite FAQPage" | leitura de `src/pages/BewildPostPage.tsx` | falso — o post já emitia `FAQPage` do campo `faq`; faltavam editor no admin, `Person`, `dateModified` real e fallback de título |
| Fonte do registro profissional usado no JSON-LD | `docs/internal/gpt-knowledge/03` (rodapé oficial) | "RESP. TÉCNICO · THIAGO DANTAS DO AMOR · CAU A162437-7"; "Pedro Alves, engenheiro USP" não consta nas fontes internas → `Person` só com o nome quando for usado |
| Publicação dos 6 rascunhos prontos | `update … returning` | 6 posts `published = true`, `published_at = 2026-09-22`, FAQ 3–5 perguntas cada, meta titles sem "BeWild" |
| Redirecionamentos provisórios do Wix | `GET /seo-redirects-service/v1/redirects` | 30 apontavam para `/conteudos`; 13 tinham destino final publicado |
| Troca dos 13 (a API não tem update) | bulk create com `options.forceReplace` → `FROM_URL_EXISTS` em todos; depois bulk delete + bulk create | ver mapa em `docs/auditoria/mapa-redirecionamento-wix.md` (seção 8) |
| "Redirects respondem 302" (plano) | documentação da API de Redirecionamentos do Wix | a API emite 301 por definição; o 302 observado deve ser o salto de canonicalização (`http`/`www`) antes do 301 — confirmar com `curl -sIL` (time) |
| Código desta rodada | `npm run lint`, `tsc --noEmit`, `vitest run`, `vite build` | 0 erros; 170 testes passando (8 novos em `postSeo.test.ts`); build OK |
| Não verificado daqui | — | site publicado (proxy bloqueia o domínio); Search Console; renderização das 6 páginas novas |

### 5.5 Rodada 4 — plano "Copy e estrutura vs. Decorafit e Obrafy" (22/09/2026)

| Verificação | Método | Resultado |
|---|---|---|
| Estado da home antes da rodada | leitura de `home-bwa-body.ts` no `main` (commits do bot do Lovable de 22/09, 03:41–03:49) | hero recomendado (7.1) e título travado da seção 01 já aplicados; erros de texto (D14) já corrigidos; nav ainda com 9 itens + "Escopo com IA" |
| CTA | `grep -rc "Solicitar Orçamento" src` | 17 arquivos com a grafia antiga → 0 depois da rodada |
| Página `/diagnostico` | leitura do código | rótulos "Diagnóstico"/"ficha", metragem opcional, sem origem nem cidade → reescrita (A-53, A-54) |
| Coluna `leads.lead_source` / `lives_in_sp` | `information_schema` antes; `ALTER … IF NOT EXISTS` depois | criadas em 22/09; `notify-lead` e admin atualizados na PR |
| Valores do CRM | comentário em `DiagnosticoPage.tsx` ("VALORES verbatim do mockup, dados do CRM") | "Locação tradicional" mantido como valor; só o rótulo virou "Locação longa" |
| FAQ no banco | `select … from faq_items` | 7 itens; item 3 diz "mais de 10 anos de garantia da marcenaria" enquanto a home diz 5 anos → decisão D-3, não alterado |
| Promessas não validadas do documento | leitura (marcas [validar]) | multa por atraso, faixas de preço, nota do Google, "quase metade fora de SP", prazo de resposta "mesmo dia útil": **nada disso entrou no site**; a nota de resposta no mesmo dia útil que já existia no FAQ de `/diagnostico` foi mantida como estava |
| Código desta rodada | `npm run lint`, `tsc --noEmit`, `vitest run`, `vite build` | ver PR |

### 5.6 Rodada 5 — home: marcenaria, depoimentos do Instagram, remoção da história (22/09/2026)

| Verificação | Método | Resultado |
|---|---|---|
| Origem da "mídia de marcenaria" do orçamento público | leitura de `pedrobwild/envision-build-guide` (`CatalogRoomBrowser`, `catalog-preview.ts`, `catalog-preview-api.ts`) | grade de referências do Catálogo Bwild por cômodo, lida por `fetch` no PostgREST do projeto do catálogo com a chave anon; miniaturas via transformação de imagem do Storage |
| Origem dos depoimentos | `src/lib/instagram-posts.ts` e `InstagramTestimonials.tsx` do mesmo repositório | 3 postagens fixas do @bewild.oficial no embed oficial (`/p/<code>/embed/`), altura por `postMessage` MEASURE |
| Chave anon do catálogo | `.env` do repositório do Engine | chave publicável, já exposta no bundle do orçamento público; copiada para `src/lib/homeCatalog.ts` (não é segredo; RLS do catálogo continua valendo) |
| Scripts da home que dependiam das seções removidas | leitura de `home-bwa-script.js` | o bloco da história (`data-story-*`) é protegido por `storySteps.length`; nada quebra sem `#historia` |
| Promessa não validada no ar | leitura do HTML atual (commits do Lovable de 22/09) | "multa se atrasar / a Bewild paga multa por dia de atraso" estava publicada sem a confirmação D-1 → removida nesta rodada |
| Build local após `git pull` | `tsc`, `vitest`, `vite build` | falharam por dependências novas do `main` (`framer-motion`, guia do investidor) que o `npm ci` deste ambiente não conseguia baixar (parte do lockfile aponta para o registro privado do Lovable, `pkg.dev`); o PR #16 foi validado só pelo CI do GitHub (verde). **Correção do registro:** não houve verificação em navegador antes de publicar — e foi isso que deixou passar o defeito abaixo |
| Seções `#marcenaria` e `#depoimentos` "não carregam" (relato do Matheus após o merge do #16) | leitura de `HomePage.tsx` e `grep` por quem chama `useHomeFx` | **Defeito confirmado:** os instaladores (`installCatalogPreview`, `installInstagramEmbeds`) foram ligados em `useHomeFx`, mas a home executa `initHomeBwa()` direto em `HomePage.tsx` e nenhum arquivo chama `useHomeFx` (código morto desde um commit do Lovable). Sem chamada, nem o `fetch` do catálogo nem os iframes eram criados; o esqueleto ficava para sempre. Corrigido ligando os dois no efeito da `HomePage` (A-73) |
| Correção verificada em navegador | Playwright (Chromium) sobre o build de produção local, com respostas **simuladas** do PostgREST do catálogo e do embed do Instagram — o proxy deste ambiente não alcança `supabase.co` nem `instagram.com` | Desktop 1280 e celular 390: nada carrega antes de rolar; ao aproximar, grade com 6 miniaturas (URL de render 800×600), troca de aba (Cozinha) com nova consulta e link "Abrir este cômodo" atualizado; 3 iframes `/p/<code>/embed/` com a altura da mensagem MEASURE aplicada; cookies recusados: nenhum iframe e o botão carrega só aquele card; falha de rede: grade vazia + "não carregaram agora"; 0 erros de JS do app. Consultas enviadas com `apikey`/`Authorization`, idênticas às do orçamento público. **O que não foi verificado:** a resposta real do catálogo (RLS/dados) e o embed real do Instagram — conferir na home publicada |
| Achado no celular durante a verificação | mesma bateria, viewport 390 | Com um observer por card, o 3º card do trilho horizontal nunca "entrava na tela" até o swipe — só começava a carregar depois de o usuário chegar nele (2 de 3 iframes montados). Passou a observar o bloco `[data-instagram]` e montar os 3 de uma vez; teste de DOM em `src/lib/__tests__/homeInstagramDom.test.ts` |

### 5.7 Rodada 6 — assistente de dúvidas não aparecia (22/09/2026)

| Verificação | Método | Resultado |
|---|---|---|
| Onde o assistente é montado | leitura de `src/main.tsx` e `src/components/assistant/SiteAssistant.tsx` | `<SiteAssistant />` renderiza em todas as rotas não-admin via portal no `body`; o botão só existe quando `enabled && !MAINTENANCE_MODE && !isHiddenPath` |
| Por que não aparecia | `src/config/site.ts` | `ASSISTANT_ENABLED = false` — o componente só aparecia com `?assistente=1` (flag de sessão). Não era CSS, z-index, banner nem erro de JS |
| Origem do `false` | histórico de mensagens do projeto no Lovable (22/09 20:43) | o pedido que entregou o código ao Lovable exigia a flag desligada, sem dados na tabela e sem publicar ("eu mesmo vou popular a tabela assistant_kb depois") — gate intencional, cumprido |
| Banco de respostas | `select count(*)` em `assistant_kb` (projeto Supabase do site) | 29 itens, todos ativos; RLS permite leitura pública só de `ativo = true`; `assistant_unanswered` vazia |
| Comportamento com a flag ligada | Playwright sobre o build de produção (desktop 1280, celular 390, `/` e `/faq`; resposta do `assistant_kb` simulada porque o proxy não alcança o Supabase) | botão fixo a 20 px da direita, acima do banner de cookies (offset medido 109 px desktop / 127 px celular); abre, carrega o banco em 1 request, mostra as sugestões da página, responde ao clicar numa sugestão; com banco vazio avisa e oferece WhatsApp; 0 erros de JS |
| Achado de acessibilidade | mesma bateria | depois de clicar numa pergunta sugerida, o botão clicado é substituído pela nova lista, o foco cai no `body` e o Esc (ouvido só no painel) deixava de fechar. Corrigido: Esc ouvido no documento enquanto o painel está aberto; foco vai para o campo (desktop) ou para a conversa (celular) antes de enviar a sugestão |
| O que não foi verificado | — | a resposta real do Supabase em produção (dados reais) e o registro de perguntas sem resposta; conferir na home publicada |

### 5.8 Rodada 7 — home: tour virtual 3D (23/09/2026)

| Verificação | Método | Resultado |
|---|---|---|
| Links dos tours | imagem com os 3 QR codes enviada pelo Pedro, lida por dois decodificadores (OpenCV e ZXing) | os dois concordam: Cozinha / Estar `48c6d935-b812-4e73-ac78-1fee136d0119`, Dormitório `2644b907-7537-49f2-a373-247c5d6d1976`, Banho `6aba3d40-628d-42d8-99a9-70f9bcb133ce`, todos em `https://api2.enscape3d.com/v3/view/<id>` |
| Como o orçamento público mostra o Tour 3D | leitura de `Tour3DViewer.tsx`, `ProjectGallery.tsx`, `useBudgetTours.ts` e `MediaUploadSection.tsx` do `envision-build-guide` (pelo Lovable) | iframe com o link salvo, sem transformação, `allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; magnetometer; xr-spatial-tracking; fullscreen"` e `allowfullscreen`; um cômodo por vez (abas), quadro 16:10, montagem escalonada; no celular, escolher o cômodo abre a tela cheia. Dados em `budget_tours` (leitura pública por `get_public_budget_tours`) |
| Comportamento no navegador | Playwright (Chromium) sobre o build de produção local em 360, 390, 768 (toque), 1024, 1280 e 1440, com o viewer do Enscape **simulado** — o proxy deste ambiente bloqueia `api2.enscape3d.com` | 3 quadros na mesma linha em todas as larguras, sem rolagem horizontal. Desktop com cookies aceitos: nenhum pedido ao Enscape antes de rolar; depois, os 3 com 1,2 s de intervalo. Sem aceite: nenhum pedido até o clique, que carrega só aquele cômodo. Com um viewer que captura a roda do mouse: sobre a capa a página rola; depois do clique, roda e setas vão para o tour; ao sair do card a capa volta e a página rola de novo. "Tela cheia" põe o próprio quadro em tela cheia (sem recarregar). 768 com toque e 390: nenhum iframe na página; o toque abre o `<dialog>` com o cômodo certo, a página não rola por trás, Esc fecha, o iframe sai e o foco volta ao card. 0 erros de JS do app |
| Testes e build | `src/lib/__tests__/homeTour3d.test.ts` (10 testes), suíte completa, `lint`, `routes:check`, `npm run build` | 654 testes passando (4 pulados), 0 erros de lint (os 6 avisos de antes), build ok; bundle principal +11 kB (+2,6 kB gzip) |
| O que não foi verificado | — | o viewer real do Enscape num quadro de ~300–420 px (interface e desempenho com 3 viewers WebGL abertos) e se o Enscape grava cookies; conferir na home publicada |

## 6. Alterações desta rodada (para revisão)

Commits na branch `claude/charming-keller-awrwxk`:
1. `92234a9` — SEO síncrono, assets fora do preview, preload removido, banner mobile, formulário honesto, description de projetos, admin lazy, docs internos fora de `public/`, lint.
2. `69b79e1` — 7 PNGs da home → variantes locais webp/jpg + evidências.

**Efeito esperado:** metadados corretos independentemente do backend; home mais leve (−~10 MB de imagens, −800 kB de JS); nenhuma dependência do domínio de preview; nenhum falso "recebemos"; documentos internos fora do ar; CI verde.

**Riscos concretos e reversão:**
- Assets `/__l5e/…` no domínio de produção: o vídeo já usava esse caminho, e os `.asset.json` do repositório declaram essa URL; ainda assim **verificar após publicar** (comando em SEO-02). Reversão: `git revert` do commit 1 (volta ao preview).
- `React.lazy` no admin: um deploy durante uma sessão admin pode causar erro de chunk; o app já tem `crashRecovery`. Reversão: reverter `src/router.tsx`.
- Estado de fallback do formulário mostra texto novo (copy nova, curta). Se o dono preferir outra redação, é uma string em `DiagnosticoPage.tsx`.
- Description derivada de bairros com erro de digitação expõe os erros até o admin corrigi-los (SEO-03).

**Não é verdade que produção foi corrigida**: as mudanças estão na branch. Ordem de publicação em `PLANO_ACAO_SITE.md`.
