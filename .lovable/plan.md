
# Integração das páginas internas ao sistema .bwa

## Fase 0 — Inventário (relatório, sem edição)

### a) Rotas e componentes

Todas as 4 rotas alvo já existem em `src/lib/useHashRoute.ts` e são despachadas por `src/router.tsx`:

- `/diagnostico` → `src/pages/DiagnosticoPage.tsx` (544 linhas — hero + formulário + `SupportSections` + `CtaFinal`; usa `BewildSiteNav`, `SiteFooter`, `StickyMobileCTA`; CSS `bwh-tokens`, `bw-diag`, `bwh-sol-fusion`).
- `/faq` → `src/pages/FaqPage.tsx` (94 linhas — hero + acordeão `<details>` + CTA escuro; consome `useFaq()` de Lovable Cloud, com fallback).
- `/portfolio` → `src/pages/BewildPortfolioPage.tsx` (290 linhas — grade de projetos; consome `useBewildProjects()`).
- `/conteudos` → `src/pages/BewildConteudosPage.tsx` (202 linhas — índice de posts; consome `useBewildPosts()`). Post individual em `src/pages/BewildPostPage.tsx` (`/conteudos/:slug`).

Conteúdo dinâmico (posts, projetos, FAQ, settings) é preservado por vir dos hooks — só a camada visual muda.

### b) Formulário /diagnostico — INTOCÁVEL

- 9 campos: `nome` (req, ≥2), `whats` (req, mask `(11) 99999-9999`, ≥10 dígitos), `email` (opc, regex), `local` (req, ≥2), `metragem` (opc, numérico), `objetivo` (chip req), `chaves` (chip req), `planta` (chip opc), `mensagem` (opc, ≤1000).
- Submit: `supabase.functions.invoke("notify-lead", { body: leadPayload })` + `trackEvent("generate_lead", …)` (GA4) + abre `https://wa.me/${CONTACT.whatsappNumber}?text=…` em nova aba + reseta form + estado `success`.
- Payload inclui UTM params, referrer, landing_path, user_agent.
- Nada da lógica, validação, endpoint, payload, tracking ou estado de sucesso será alterado — apenas classes, markup wrapper e CSS.

### c) Roteamento — teste crítico

O router é **path-based** (não hash), com `installLinkInterceptor` em `main.tsx` que captura cliques em `<a href="/…">` internos e chama `navigate()` (pushState + evento custom). Links planos `href="/diagnostico"` do HTML aprovado da home **funcionam** — verificado no código do interceptor (linhas 173-206 de `useHashRoute.ts`).

**Risco identificado**: âncoras da home (`#certeza`, `#historia`, `#projetos`, `#workflow`, `#prova`) começam com `#` e o interceptor faz early-return (linha 193). Em páginas internas, clicar num link `#certeza` do nav vai tentar rolar para `#certeza` na página atual (que não existe) em vez de ir para a home. **Correção necessária antes da Fase 1**: nas páginas internas o nav precisa usar `href="/#certeza"`, e o app precisa passar a scrollar para a âncora ao aterrissar em `/` com hash. Detalhes na Fase 1 abaixo.

## Fase 1 — Chrome compartilhado .bwa

### Novos arquivos

- `src/components/BwaSharedChrome.tsx` — componente wrapper que:
  1. Injeta `home-bwa.css` no `<head>` no mount (mesma técnica do `HomePage.tsx`), remove no unmount.
  2. Aplica classes `bwa-home-root` em `html`/`body`.
  3. Renderiza o mesmo `<header class="bwa-nav">` + `<div class="bwa-mobile-menu">` da home, mas com prop `variant="internal"` que adiciona classe `bwa-nav--internal` (nav inicia em estado escuro-sobre-papel, sem esperar scroll).
  4. Renderiza o mesmo footer da home (extraído do `HOME_BWA_HTML` para JSX estático — sem alterar copy, CNPJ, resp. técnico).
  5. Re-executa a lógica de nav do `home-bwa-script.js` (scroll state, menu mobile), com o mesmo guard de idempotência.
- `src/pages/bwa-internal.css` — pequeno complemento com:
  - `.bwa-nav--internal` (força texto escuro/borda visível desde o topo, sem depender do `.bwa-scrolled`).
  - Tokens locais para inputs, chips e cards das páginas internas usando as MESMAS variáveis do `home-bwa.css` (paper, navy, mono, borders 1px).
  - Nenhum override das regras .bwa* já existentes.

### Menu — mudanças coordenadas com o dono

Aplicar em `src/pages/home-bwa-body.ts` (nav desktop, mobile-menu) e replicar no `BwaSharedChrome`:

- Nav desktop (5 links atuais → 6):
  - `O contrato` → `/#certeza`
  - `Projetos` → `/#projetos`
  - `Bwild Workflow` → `/#workflow`
  - `Portfólio` → `/portfolio` **(novo)**
  - `Conteúdos` → `/conteudos` **(novo)**
  - `FAQ` → `/faq` **(novo)**
  - Remover `A história` e `Prova` do desktop (decisão implícita: 6 é o limite visual do nav; se o dono quiser manter, ajustar). **Assunção a confirmar**: se preferir manter os 8 links no desktop, aplicar em vez disso um layout com wrap ou reduzir spacing. Estou removendo os 2 menos usados; se estiver errado, corrijo antes de seguir.
- Menu mobile: manter os 8 links atuais + acrescentar `Portfólio`, `Conteúdos`, `FAQ` antes de `Solicitar diagnóstico`.
- Footer: acrescentar `FAQ` ao grupo de navegação.
- Marcador em ambos os locais: `<!-- MENU atualizado 17/jul por ordem do dono: páginas internas integradas -->`.

### Correção de âncora cross-page

- `src/lib/useHashRoute.ts` (`navigate`) ou `src/main.tsx`: ao aterrissar em `/` com `window.location.hash` não vazio e não-rota, após renderizar a home, disparar `document.getElementById(hash)?.scrollIntoView()` (respeitar transição). Isto habilita `/#certeza` das páginas internas.
- Nav da home mantém `#certeza` (âncora local, mais rápida); nav do `BwaSharedChrome` das internas usa `/#certeza`.

### Não vai mudar

- Rotas `admin-*` continuam usando `AdminLayout` — chrome .bwa não é aplicado.
- `LpObraPage`, `LpPanfletoPage`, `PrivacidadePage`, `NotFoundPage`, `MaintenancePage` — sem alteração (não estão no escopo).

## Fase 2 — Páginas (uma por vez, com relatório entre elas)

### 1. `/diagnostico`

- Trocar `BewildSiteNav` + `SiteFooter` + `StickyMobileCTA` pelo `BwaSharedChrome`.
- Reconstruir apenas o markup visual (hero e formulário) com classes `bwa-*`:
  - Hero: `<section class="bwa-section">` com label numerada (`bwa-label` "001 · Diagnóstico"), `bwa-title`, `bwa-lead`, e à direita o card com prova (150+ studios, 5 anos garantia, preço fechado) usando `bwa-proof-card`.
  - Formulário: mesmo componente `<DiagnosticoForm>` — só as classes CSS mudam. Inputs ganham borda 1px, radius 0, fundo paper. Chips no padrão `bwa-chip` (a criar como variação de `.bwa-scope-toggle`). Botão submit: `.bwa-button` (padrão da home).
  - Todo `useState`, `onSubmit`, `messageText`, `trackEvent`, `supabase.functions.invoke` **intactos byte a byte**.
- Meta: `title="Diagnóstico Bewild · Análise do seu studio"`, description mantida.

### 2. `/faq`

- Trocar `BewildSiteNav`/`SiteFooter` pelo `BwaSharedChrome`.
- Substituir `<details>` por markup `.bwa-faq-item` (mesmo padrão da home, controle via `home-bwa-script.js` — precisa reinicializar no mount da página; encapsular a lógica de FAQ em função exportada de `home-bwa-script.js` chamável isoladamente).
- Preservar `useFaq()`, JSON-LD `FAQPage` + `BreadcrumbList`, microdata Schema.org.
- Manter CTA final (converter para o padrão `.bwa-cta` escuro do fim da home).

### 3. `/portfolio`

- Trocar chrome. Reconstruir a grade com classes `.bwa-project-card` (a mesma do carrossel de projetos da home) num `<div class="bwa-portfolio-grid">` (grid CSS 1/2/3 colunas responsivas — nova regra CSS aditiva em `bwa-internal.css`, sem tocar em `home-bwa.css`).
- Preservar `useBewildProjects()`, filtros existentes, links `/portfolio/:slug`.
- Detalhe do projeto (`BewildProjectPage`) recebe o mesmo chrome; conteúdo interno (galeria, textos) preservado com wrapper `.bwa-shell`.

### 4. `/conteudos`

- Trocar chrome. Índice em lista com bordas 1px (padrão editorial `.bwa-story-step`).
- Título serif (usar mesma fonte da home — Manrope; se "serif" for interpretação do dono, confirmar; **assunção**: uso Manrope 300 para títulos de post, coerente com o `.bwa-title` da home).
- Labels mono (`.bwa-label` do sistema).
- Preservar `useBewildPosts()`, paginação/filtros se existirem, links `/conteudos/:slug`.
- Página de post individual (`BewildPostPage`) recebe o mesmo chrome; conteúdo do post (renderer HTML sanitizado) preservado com wrapper `.bwa-shell` e tipografia .bwa.

## Fase 3 — QA

Para cada página (viewports 1440 / 1015 / 390):

- HTTP 200 e 0 erros de console.
- Screenshot full-page.
- Nav funcional: cada link do desktop e do mobile clicável, navegando corretamente (âncoras cross-page também).
- Footer com FAQ presente.
- `CookieBanner` presente.
- `/diagnostico`: preencher todos os campos, submeter, e via Playwright interceptar `supabase.functions.invoke` para confirmar payload idêntico ao atual (name, whatsapp, email, location, area_m2, objetivo, chaves, planta, message, utm_*, referrer, landing_path, user_agent) e disparo de `generate_lead` no GA4. Sem enviar lead real (mock do fetch de functions).
- Regressão da home: nav com 6 links + hambúrguer, âncoras funcionando, mobile menu com 8+3 links, footer com FAQ, home visualmente idêntica exceto pelas mudanças de menu/footer.
- Regressão admin: `/admin/dashboard` continua com `AdminLayout` sem `home-bwa.css`.
- Regressão `/privacidade`: continua usando o sistema antigo (fora do escopo).

## Detalhes técnicos

### Arquitetura de estilo

`home-bwa.css` continua sendo a folha fonte da linguagem visual. Estende via `src/pages/bwa-internal.css` (importado por `BwaSharedChrome`) apenas com regras **aditivas** para elementos que a home não tem (inputs de formulário, grid de portfólio, lista de posts). Nenhum valor aprovado é sobrescrito.

### Refactor do script da home

`home-bwa-script.js` hoje inicializa tudo num único `initHomeBwa`. Vou extrair funções puras (`initNav(el)`, `initFaqAccordions(container)`, etc.) preservando a lógica atual — a home continua chamando `initHomeBwa()` que orquestra tudo, e as páginas internas chamam só o que precisam (`initNav`, `initFaqAccordions`). Guard `data-bwa-inited` permanece.

### Arquivos que serão criados

- `src/components/BwaSharedChrome.tsx`
- `src/pages/bwa-internal.css`

### Arquivos que serão editados

- `src/pages/home-bwa-body.ts` (menu desktop 6 links, menu mobile +3, footer +FAQ)
- `src/pages/home-bwa-script.js` (extrair funções reutilizáveis; nada de comportamento muda)
- `src/pages/DiagnosticoPage.tsx` (só markup, JSX; toda lógica intacta)
- `src/pages/FaqPage.tsx` (markup)
- `src/pages/BewildPortfolioPage.tsx` (markup)
- `src/pages/BewildConteudosPage.tsx` (markup)
- `src/pages/BewildPostPage.tsx` (markup — mesmo chrome)
- `src/pages/BewildProjectPage.tsx` (markup — mesmo chrome)
- `src/lib/useHashRoute.ts` OU `src/main.tsx` (scroll para âncora ao aterrissar em `/#foo`)

### Arquivos NÃO tocados

- `BewildSiteNav.tsx`, `SiteFooter.tsx`, `StickyMobileCTA.tsx`, `bwh-*.css`, `bw-diag.css` — permanecem para o caso de alguma rota ainda depender (e para reversibilidade); podem ser removidos numa fase posterior se o dono confirmar que nenhuma outra rota os usa.
- Componentes `admin/*`, `landing/*`, `Header.tsx`, `Footer.tsx` legado.
- Todos os hooks (`useFaq`, `useBewildPosts`, `useBewildProjects`, `useSeo`, `useSiteSettings`).
- `home-bwa.css`, `HomePage.tsx`.

## Assunções que preciso confirmar antes de executar

1. **Nav desktop com 6 links**: removi `A história` e `Prova` do desktop (mantidos no mobile). Se preferir manter todos, digo qual layout aplico.
2. **`/portfolio`, `/conteudos`, `/faq` recebem o mesmo nav claro (não navy)**. Confirmado no briefing ("nas internas o nav inicia no estado de texto escuro sobre papel").
3. **Página de detalhe de projeto e post** também recebem o novo chrome (não estão explicitamente listadas, mas seria estranho o índice ser .bwa e o detalhe voltar ao sistema antigo).
4. **Título dos posts em Manrope** (design system .bwa) — o briefing menciona "título serif" na descrição de `/conteudos`; se for literal, uso a fallback serif do sistema; se for referência genérica a "título editorial", uso Manrope como no resto do .bwa.

Se as 4 estiverem OK, sigo com Fase 1 e reporto antes de iniciar cada página.
