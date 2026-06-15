## Contexto crítico (precisa ler antes)

Já existe uma tabela `public.projects` no banco com 36 colunas, populada e usada pelo sistema antigo Lorena/Be Wild em várias páginas (`PortfolioPage`, `ProjectPage`, admin, `useProjects.ts`, `data/projects.ts`) e por `project_images`, `project-covers`, `project-gallery`.

**Não dá para "criar a tabela `projects`"** como o prompt original pede — DROP ou CREATE conflitando destruiria conteúdo real e quebraria 6+ páginas. O guardrail do próprio prompt diz "não quebre tabelas existentes".

Proponho duas opções. Preciso da sua escolha antes de rodar qualquer SQL.

---

## Opção A — Reaproveitar `public.projects` (recomendado)

Adicionar à tabela existente APENAS as colunas que faltam vs. o spec Bewild, sem mexer nas que já existem:

- `neighborhood text` (spec pede; hoje só tem `location`)
- `project_type text` com check (`short_stay` | `turn_key` | `planta`) — não uso o nome `type` porque já existe `tag`/`portfolio_tags`
- `area_m2 int` (hoje só tem `area text`)
- `duration text`
- `challenge text`, `solution text` (hoje tem `intro`, `before_text`, `result_text`)
- `scope text[]` (hoje tem `ready_items text[]` — semanticamente diferente, mantenho separado)
- `testimonial text`, `testimonial_author text`
- `after_image_url text` (já existe `before_image_url` e `ready_image_url`; adiciono o "depois" explícito)
- `gallery_urls text[]` (hoje galeria vem da tabela `project_images`; adiciono array simples como o spec pede, sem mexer em `project_images`)
- `published boolean default false` (hoje usa `visible boolean`; adiciono `published` como o spec pede e mantenho `visible` para não quebrar o front antigo)
- `sort_order int default 0` (hoje tem `order_index`; idem, adiciono sem remover)

**RLS:** as policies atuais já existem (2 policies). Vou revisar e garantir:
- SELECT público restrito a `published = true` (nova policy, sem remover a de `visible = true` para não quebrar páginas antigas)
- INSERT/UPDATE/DELETE só para `authenticated` (já existe via admin)

**Bucket:** criar `project-images` novo (público, escrita autenticada) — separado dos existentes `project-covers`/`project-gallery` para não conflitar.

Vantagem: zero quebra. Desvantagem: a tabela fica com colunas redundantes (`visible`+`published`, `area`+`area_m2`, `order_index`+`sort_order`) até decidirmos depreciar as antigas.

---

## Opção B — Migrar tudo de uma vez

Renomear/dropar colunas antigas, unificar nomes, reescrever `useProjects.ts`, `data/projects.ts`, `ProjectPage`, `PortfolioPage`, admin antigo. Mais limpo, mas é um refactor grande que VAI tocar páginas existentes — fura o guardrail "não altere outras rotas".

---

## Recomendação

**Opção A.** Mantém os guardrails, não quebra nada, e nas próximas fases criamos `/portfolio` e `/portfolio/:slug` novos que leem só os campos novos (`published`, `project_type`, `neighborhood`, etc.). O portfólio antigo continua funcionando em paralelo até você decidir desligá-lo.

## SQL que vou rodar se aprovar A

```sql
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS neighborhood text,
  ADD COLUMN IF NOT EXISTS project_type text
    CHECK (project_type IN ('short_stay','turn_key','planta')),
  ADD COLUMN IF NOT EXISTS area_m2 int,
  ADD COLUMN IF NOT EXISTS duration text,
  ADD COLUMN IF NOT EXISTS challenge text,
  ADD COLUMN IF NOT EXISTS solution text,
  ADD COLUMN IF NOT EXISTS scope text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS testimonial text,
  ADD COLUMN IF NOT EXISTS testimonial_author text,
  ADD COLUMN IF NOT EXISTS after_image_url text,
  ADD COLUMN IF NOT EXISTS gallery_urls text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sort_order int NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS projects_published_sort_idx
  ON public.projects (published, sort_order);

-- Policy nova para leitura pública dos projetos do novo portfólio Bewild
CREATE POLICY "Bewild portfolio published readable"
  ON public.projects FOR SELECT
  TO anon, authenticated
  USING (published = true);
```

Bucket `project-images` criado via tool dedicada (público).

Policies de storage:
```sql
CREATE POLICY "project-images public read"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'project-images');

CREATE POLICY "project-images auth write"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-images');

CREATE POLICY "project-images auth update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'project-images');

CREATE POLICY "project-images auth delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'project-images');
```

## Critério de aceite

- Tabela `projects` ganhou as colunas novas, nenhuma coluna antiga removida.
- Bucket `project-images` existe e é público para leitura.
- Visitante anônimo lê apenas linhas com `published = true` via o caminho novo (e continua lendo `visible = true` no caminho antigo — sem regressão).
- `useProjects.ts` antigo continua funcionando idêntico (não toco nele).

## Sua decisão

Responde **A** (recomendado, sigo direto) ou **B** (vou ter que repactuar guardrails e planejar um refactor maior antes de rodar).
