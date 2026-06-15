## FASE 2 — `/portfolio` Bewild (lista pública)

Objetivo: criar a página pública de listagem do portfólio Bewild, lendo `public.projects` filtrado por `published = true`, usando os campos novos da FASE 1, com visual alinhado à home (navy/cyan/sand, Poppins+Inter) e **sem tocar em nada do portfólio antigo Lorena**.

---

### Escopo desta fase (só isto)

1. Nova rota `/portfolio` da Bewild.
2. Lista grid de cards de projetos publicados.
3. Filtros simples por `project_type` (Todos · Short stay · Turn-key · Planta).
4. CTA final "Solicitar diagnóstico" → `/diagnostico`.
5. SEO básico (title, meta description, canonical, OG).
6. Sitemap inclui `/portfolio`.

Fora de escopo (vai para FASE 3): página de detalhe `/portfolio/:slug`. Por enquanto cada card abre alert/console ou já aponta para `#/portfolio/:slug` esperando a próxima fase — confirmo na execução.

---

### Decisão importante: rota conflita com a antiga

Hoje `routes.portfolio` e a rota `/portfolio` em `useHashRoute.ts` renderizam `PortfolioPage.tsx` (Lorena). O guardrail é "não quebrar outras páginas".

**Proposta:** mover o portfólio Lorena para `/portfolio-lorena` (rota antiga vira alias interno) **OU** publicar o novo em `/portfolio-bewild` e só promover para `/portfolio` quando você der OK.

Como a Bewild é o produto vivo (home já é Bewild), recomendo:

- Novo Bewild fica em **`/portfolio`** (URL canônica do negócio).
- Antigo Lorena passa a responder em **`/portfolio-lorena`** (mantém funcional, sem 404, sem perder o histórico interno).
- Adiciono redirect leve no hash router: se alguém abrir `#/portfolio` e estiver em modo Lorena legado, segue Bewild — Lorena fica só no path explícito novo.

Se preferir manter `/portfolio` apontando para Lorena por mais tempo, mudo para `/portfolio-bewild` agora e troco depois. **Aviso na execução pedindo OK antes de mover Lorena.**

---

### O que vou construir

**Página `src/pages/BewildPortfolioPage.tsx`** (nome distinto do antigo `PortfolioPage.tsx` para não colidir):

- Header reusa o header da home (mesma nav Bewild, mesmos CTAs).
- Hero curto: eyebrow "Portfólio", h1 "Reformas turn-key entregues", subtítulo de 1 linha.
- Barra de filtros por `project_type` (chips). Estado local, sem query string nesta fase.
- Grid responsivo (1 col mobile, 2 tablet, 3 desktop) de cards:
  - Imagem (`cover_url` como `<img loading="lazy">`).
  - Tag do tipo (`short_stay` → "Short stay", etc.).
  - Título + bairro (`neighborhood` se houver, senão `location`).
  - Meta: `area_m2` m² · `duration`.
  - Link para `#/portfolio/<slug>` (placeholder da FASE 3 — confirmo na execução se você quer que já apareça clicável ou desabilitado).
- Estado vazio: "Em breve novos projetos publicados."
- Estado loading: skeletons (3 cards cinza claro).
- Estado erro: mensagem curta + link voltar para home.
- CTA final em faixa navy: "Pronto para a sua reforma?" + botão "Solicitar diagnóstico" → `/diagnostico`.
- Footer reusa o footer da home.

**Hook `src/lib/useBewildProjects.ts`** (novo, separado de `useProjects.ts` antigo):

- Query: `select id, slug, title, cover_url, project_type, neighborhood, location, area_m2, duration, sort_order from projects where published = true order by sort_order asc, created_at desc`.
- Sem fallback estático (Bewild ainda não tem seed estático — lista vazia se vier vazio).
- Retorna `{ projects, loading, error }`.

**CSS isolado em `src/styles/portfolio.css`** prefixado por `.bw-portfolio`, importado só pela página nova. Tokens reusados da home (navy `#11355B`, cyan `#2F86B8`, sand `#F2ECE1`, Poppins display, Inter body).

**Roteamento:**

- `src/lib/useHashRoute.ts`: adicionar rota `/portfolio-lorena` apontando para o `PortfolioPage` antigo; trocar `/portfolio` para apontar para `BewildPortfolioPage`.
- `scripts/check-routes-parity.mjs` + `STATIC_ROUTES`: incluir `/portfolio` (já existe) e `/portfolio-lorena` (novo).
- `public/sitemap.xml` + edge `supabase/functions/sitemap/index.ts`: garantir `/portfolio` listado (já está) e remover qualquer entrada que apontasse para Lorena se for o caso.
- `useProjects.ts` antigo continua funcionando — só `/portfolio-lorena` o usa agora.

**SEO:**

- Title: "Portfólio Bewild — reformas turn-key em São Paulo" (<60 chars).
- Meta description focada em "reformas entregues, short stay e turn-key em SP" (<160 chars).
- Canonical: `https://bewild.com.br/portfolio`.
- OG image: usa a primeira `cover_url` publicada se houver, senão a OG padrão do site.
- `<h1>` único.

---

### Critério de aceite

- `/portfolio` renderiza a página Bewild nova, lendo do banco, filtrável por tipo, com CTA final para `/diagnostico`.
- `/portfolio-lorena` renderiza o portfólio antigo idêntico (sem regressão visual ou funcional).
- Lista vazia + erro de fetch tratados sem tela branca.
- Home não é tocada. `routesParity` continua verde. Build passa.
- CSS Bewild não vaza para Lorena nem vice-versa (prefixo `.bw-portfolio`).

---

### Pontos que preciso de OK antes de codar

1. **Rota canônica `/portfolio` vai para Bewild, Lorena vai para `/portfolio-lorena`** — confirma?
2. **Cards já apontam para `#/portfolio/:slug`** mesmo sem a página de detalhe existir ainda (vou implementar na FASE 3), ou deixo card não-clicável nesta fase?
3. **Filtros**: chips client-side é suficiente, ou já quer query string (`?tipo=turn_key`) desde já? (Recomendo client-side agora, query string na FASE 3.)

Responde 1+2+3 e eu executo.