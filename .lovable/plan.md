## FASE 4 — CMS Bewild em `/admin/bewild`

O `/admin/projects` atual gerencia a mesma tabela `projects` mas com o esquema **Lorena** (tag, em, number, year, materials, ready_items, order_index, visible). Não vou misturar os dois formulários — risco alto de quebrar Lorena. Em vez disso, crio uma área paralela dedicada aos campos Bewild, sem tocar no admin Lorena.

---

### Rotas novas (todas protegidas por `<ProtectedRoute>`)

- `/admin/bewild` — lista de projetos Bewild (publicados + rascunhos), ordenada por `sort_order`.
- `/admin/bewild/new` — criar.
- `/admin/bewild/:slug` — editar.

`/admin/login`, `/admin/dashboard`, `/admin/projects` (Lorena), etc., **intocados**.

### Lista `/admin/bewild`

Tabela com: thumb (`cover_url`), título, tipo (`project_type`), bairro, m², status (publicado/rascunho com toggle), ações (editar, excluir, ↑ / ↓ para `sort_order`). Botão "+ novo projeto Bewild" no topo. Empty state se vazio.

Reusa `AdminLayout` com novo item de menu "Portfólio Bewild".

### Formulário `/admin/bewild/new` e `/admin/bewild/:slug`

Em português, agrupado em seções para reduzir carga cognitiva:

1. **Identificação**
   - `title` (texto, obrigatório)
   - `slug` (texto, auto-gerado a partir do título via slugify; editável; valida unicidade no submit)
   - `project_type` (select: Short stay / Turn-key / Studio na planta)
   - `published` (toggle)
   - `sort_order` (number)

2. **Localização e dados**
   - `neighborhood` (texto)
   - `area_m2` (number)
   - `duration` (texto livre, ex.: "55 dias úteis")

3. **História do projeto** (todos opcionais — projeto em obra pode salvar vazio)
   - `summary` (textarea curta, 1-2 linhas)
   - `challenge`, `solution`, `result_text` (textareas)

4. **Escopo** (`scope text[]`)
   - Lista editável: input + botão "+ adicionar item", chips removíveis. Sem ordering complexo.

5. **Mídia** — upload no bucket `project-images`
   - **Capa** (`cover_url`) — campo único com botão upload + preview + "remover".
   - **Antes** (`before_image_url`) — idem.
   - **Depois** (`after_image_url`) — idem.
   - **Galeria** (`gallery_urls text[]`) — múltiplos uploads, preview em grid, reordenar (↑/↓), remover.
   - Cada upload chama `supabase.storage.from("project-images").upload(path, file)` com path `bewild/<slug-ou-uuid>/<timestamp>-<nome>` e grava a public URL.

6. **Depoimento**
   - `testimonial` (textarea)
   - `testimonial_author` (texto)

Botões: **Salvar rascunho** (mantém `published=false`), **Salvar e publicar** (seta `published=true`), **Cancelar** (volta à lista).

### Validação e feedback

- Slug obrigatório, lowercase, sem espaços (regex). Mostra erro inline se inválido ou duplicado.
- Toast/inline message: "Projeto salvo", "Projeto publicado", "Erro ao subir imagem: …".
- Upload em progresso desabilita o botão de salvar.

### Arquivos

- **Novo**: `src/pages/admin/BewildProjectsListPage.tsx`
- **Novo**: `src/pages/admin/BewildProjectFormPage.tsx`
- **Novo**: `src/components/admin/BewildImageField.tsx` (campo único de imagem)
- **Novo**: `src/components/admin/BewildGalleryField.tsx` (campo multi-imagem)
- **Novo**: `src/lib/bewildAdmin.ts` (helpers: `slugify`, `uploadToProjectImages`)
- **Editar**: `src/lib/useHashRoute.ts` — adiciona `admin-bewild`, `admin-bewild-new`, `admin-bewild-edit`
- **Editar**: `src/router.tsx` — despacha as 3 rotas
- **Editar**: `scripts/check-routes-parity.mjs` — adiciona em `SPA_ONLY_ALLOWED`
- **Editar**: `src/components/admin/AdminLayout.tsx` — item de menu "Portfólio Bewild" (sem alterar os existentes)

### Banco

**Nenhuma migração nova.** RLS já cobre: `admin all projects` permite ao admin tudo; `Bewild portfolio published readable` permite leitura pública só dos publicados. Bucket `project-images` já existe e está público (FASE 1).

### Critério de aceite

- Sem login: `/admin/bewild` redireciona para `/admin/login`.
- Logado como admin: crio um projeto, faço upload de capa + 4 fotos de galeria, marco como publicado, vou em `/portfolio` e ele aparece; abro `/portfolio/<slug>` e a página de detalhe renderiza com as fotos.
- Salvar como rascunho NÃO mostra o projeto em `/portfolio`.
- Admin Lorena (`/admin/projects`) continua funcionando igual.
- Build, parity e testes verdes.

### Fora de escopo

- Edição em batch, histórico de versões, preview lado-a-lado, drag-and-drop de galeria via @dnd-kit (uso ↑/↓ simples para evitar nova dependência de complexidade).

Aprovo e sigo?