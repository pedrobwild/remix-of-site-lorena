## FASE 3 — `/portfolio/:slug` (detalhe do projeto)

Página de detalhe do Anexo B. Foto é o destaque. Tudo é condicional: projeto em obra (sem "depois", sem depoimento, sem galeria) ainda renderiza coerente.

---

### Escopo

1. Rota dinâmica `/portfolio/:slug` que carrega `projects` por `slug` com `published = true`. Sem match → 404.
2. Cards de `/portfolio` (FASE 2) viram links para essa nova rota.
3. Visual reusa `.bw-home` + novo CSS `.bw-detail` em `src/styles/portfolio-detail.css`.

### Seções (todas condicionais quando o campo está vazio)

- **Header**: link "← Portfólio", pill com `bewildTypeLabel(project_type)`, h1 `title`, meta `neighborhood · area_m2 m² · duration` (cada parte só aparece se existir).
- **Cover**: `cover_image` (`projects.cover_url`) — se faltar, slot rotulado "Foto principal do studio entregue".
- **Resumo**: `summary` (texto introdutório). Some se vazio.
- **Cards Desafio / Solução / Resultado**: cada cartão só aparece se o campo correspondente tiver texto. Se nenhum dos três tiver, a seção inteira some.
  - mapping: Desafio → `challenge`, Solução → `solution`, Resultado → `result` (campo já existe na tabela como `result_text`; confirmo no código).
- **Antes e depois**: grid 2 colunas. Some inteiro se `before_image` OU `after_image` estiver vazio.
  - mapping: `before_image` → `before_image_url`, `after_image` → `after_image_url`.
- **Galeria**: grid 2 col com lightbox ao clicar. Some se `gallery` vazio.
  - mapping: `gallery` → `gallery_urls text[]` (FASE 1).
- **O que foi feito (escopo)**: lista com check ✓. Some se `scope text[]` vazio.
- **Depoimento**: blockquote + autor. Some se `testimonial` vazio.
- **CTA navy**: "Solicitar diagnóstico" → `/diagnostico` · "Falar no WhatsApp" → `whatsappHref()`.
- **Footer** igual ao da FASE 2.

### Lightbox

- Componente leve inline: clique em imagem da galeria abre overlay full-screen com a imagem + fechar (X, ESC, click fora) e setas ← →.
- `document.body.overflow = hidden` enquanto aberto.
- Sem dependência extra (segue padrão do `ProjectPage` antigo).

### 404

- Enquanto carrega: skeleton mínimo.
- Carregado + sem projeto OU `published=false`: render `<NotFoundPage />` (já existe).

### Arquivos

- **Novo**: `src/pages/BewildProjectPage.tsx`.
- **Novo**: `src/styles/portfolio-detail.css`.
- **Novo hook**: `src/lib/useBewildProject.ts` (busca um slug).
- **Editar**: `src/lib/useHashRoute.ts` — adiciona parse `/portfolio/<slug>` → `{ name: "bewild-project", slug }`.
- **Editar**: `src/router.tsx` — despacha `bewild-project` → `<BewildProjectPage slug=… />`.
- **Editar**: `src/pages/BewildPortfolioPage.tsx` — `<article>` vira `<a href="/portfolio/<slug>">`.

### Rotas / parity

- `/portfolio/<slug>` é dinâmica → adiciono prefixo `/portfolio/` em `DYNAMIC_PREFIXES` da edge `not-found-check` (table=`projects`, column=`slug`, filtra `published=true`).
- Não toca em `STATIC_ROUTES`. Parity script segue verde.

### Copy

- Sem travessões, sem clichês, separador `·`. Reuso literal do Anexo B onde houver placeholder.

### Critério de aceite

- Card no índice abre detalhe. Slug inválido ou despublicado → 404.
- Projeto sem `testimonial`, sem `after_image_url` e sem `gallery_urls` → renderiza sem essas seções, sem espaço fantasma.
- Lightbox abre/fecha por click, ESC e setas.
- Home, blog, FASE 1 e FASE 2 intactos. Build + parity verdes.

### Fora de escopo (FASE 4)

Painel `/admin` com upload e CRUD.

---

Aprovo e sigo?