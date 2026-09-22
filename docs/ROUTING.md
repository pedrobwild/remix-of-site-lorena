# Roteamento: paridade SPA ↔ edge function

Este documento descreve o contrato entre as rotas da SPA e a edge function
`not-found-check`, e por que listas como `SPA_ONLY_ALLOWED` e
`EDGE_ONLY_ALLOWED` precisam ser mantidas ao adicionar/remover rotas.

## Por que existe essa paridade

O hosting da Lovable entrega `index.html` com **HTTP 200** para qualquer path
desconhecido (SPA fallback), então o navegador sempre carrega a SPA.

> **Atenção (corrigido em 22/09/2026 — SEO-07):** o Googlebot **não** consulta
> `not-found-check`. Nada no caminho do crawler passa por essa edge function —
> nenhum código da SPA a chama (confira com
> `grep -rn "not-found-check" src`: só testes e o script de paridade
> aparecem). Para o Google, o sinal de "página não encontrada" é o
> `<meta name="robots" content="noindex, nofollow">` que a `NotFoundPage`
> injeta no render — um soft-404 que ele classifica como "Não encontrada
> (404)" mesmo recebendo 200. A versão anterior deste documento afirmava que
> os crawlers usavam a função, o que nunca foi verdade.

A edge function `supabase/functions/not-found-check/index.ts` responde:

- **HTTP 200** + `reason` apropriado → rota válida.
- **HTTP 404** → rota inexistente (e registra em `seo_404_log`).

Mesmo sem estar no caminho do crawler, a paridade continua valendo a pena por
dois motivos concretos: é a lista revisável de "quais rotas públicas existem",
consultável por qualquer ferramenta externa de verificação de SEO; e é o
gatilho que obriga quem cria uma rota a lembrar do `sitemap.xml` e da
navegação. Por isso o CI continua quebrando na divergência.

O script `scripts/check-routes-parity.mjs` previne isso comparando as duas
fontes de verdade em todo build e em todo CI.

## Fontes de verdade

| Camada | Arquivo | O que declara |
|---|---|---|
| SPA  | `src/lib/useHashRoute.ts` | Rotas estáticas via `path === "/algo"` |
| Edge | `supabase/functions/not-found-check/index.ts` | Array `STATIC_ROUTES` |
| Allowlists | `scripts/check-routes-parity.mjs` | Exceções intencionais |

**Regra padrão:** toda rota pública estática precisa existir nas *duas*
listas. O CI quebra se uma estiver e a outra não.

Rotas públicas estáticas indexáveis hoje (14): `/`, `/portfolio`,
`/diagnostico`, `/orcamento`, `/conteudos`, `/guia-do-investidor`, `/faq`,
`/autorizacao-condominio`, `/contato`, `/escopo`, `/como-funciona`,
`/onde-atuamos`, `/parceiros`, `/privacidade`. A página pilar
`/guia-do-investidor` entrou em 22/09/2026 e está nas duas listas, no
sitemap (prioridade 0.8) e no `public/llms.txt` — não vai a nenhuma
allowlist.

## Quando usar cada allowlist

### `SPA_ONLY_ALLOWED` — rotas que existem só na SPA

Use quando a rota da SPA **já é tratada por outra regra na edge function**,
sem precisar aparecer em `STATIC_ROUTES`.

**Caso canônico: `/admin/*`.** A edge function tem um short-circuit no topo:

```ts
if (path === "/admin" || path.startsWith("/admin/")) {
  return ok({ reason: "admin_route" });
}
```

Ou seja, toda rota administrativa devolve 200 automaticamente,
independentemente de estar em `STATIC_ROUTES`. Não duplicamos essas rotas
em `STATIC_ROUTES` porque:

1. Áreas autenticadas não devem ser indexadas pelo Google (o conteúdo
   real exige login e o `<meta name="robots" content="noindex">` cuida
   disso no client).
2. Adicionar `/admin/*` em `STATIC_ROUTES` viraria uma segunda fonte de
   verdade que precisaria ser mantida em sincronia — exatamente o que
   esse contrato evita.

**Toda nova rota `/admin/<algo>` precisa ser adicionada em
`SPA_ONLY_ALLOWED`** ao mesmo tempo em que entra no `useHashRoute.ts`,
ou o CI quebra. Não é opcional.

Outros casos válidos (raros): páginas pluggáveis renderizadas como filhas
de uma rota canônica, rotas que casam por regex/dinâmica e portanto não
fazem sentido em uma lista estática.

### `EDGE_ONLY_ALLOWED` — rotas que existem só na edge

Use quando a edge function precisa reconhecer um path **que não tem uma
entrada explícita no `useHashRoute.ts`** porque é tratado como catch-all.

**Caso canônico: `/404`.** É a URL canônica da tela de "página não
encontrada". A SPA não tem `path === "/404"` porque qualquer rota
desconhecida cai no `<NotFoundPage />` via fallback do `router.tsx`.
Mas o `/404` precisa devolver 200 na edge function (com `reason="not_found_page"`)
para o Google entender que é uma página real com `noindex`, e não um soft-404.

Rotas dinâmicas como `/projeto/:slug`, `/blog/:slug`, `/blog/tag/:slug` e
`/admin/projects/:slug` também não aparecem nem em `STATIC_ROUTES` nem em
`useHashRoute.ts` como literais — a edge consulta o banco para validar e
a SPA usa regex no `parsePath`. Essas não precisam de allowlist porque o
script só compara literais estáticos.

## Checklist ao adicionar uma rota nova

| Tipo de rota | Adicione em `useHashRoute.ts` | Adicione em `STATIC_ROUTES` | Adicione em allowlist |
|---|---|---|---|
| Pública estática (ex.: `/sobre`) | sim | sim | não |
| Pública dinâmica (ex.: `/projeto/:slug`) | sim (regex) | não — usa lookup de DB | não |
| `/admin/*` | sim | **não** | sim, em `SPA_ONLY_ALLOWED` |
| Canônica só da edge (raro) | não | sim | sim, em `EDGE_ONLY_ALLOWED` |

Também atualize, quando aplicável:
- `public/sitemap.xml` e `supabase/functions/sitemap/index.ts` (rotas públicas
  indexáveis).
- `src/router.tsx` (componente da página).
- `src/lib/useHashRoute.ts → routes` (helper de URL).

## O que acontece se eu esquecer

- **Esqueceu de adicionar em `STATIC_ROUTES`** → CI quebra no step
  `Routes parity check` com:
  `✗ Rotas presentes na SPA mas AUSENTES em STATIC_ROUTES (...): /minha-rota [não está em nenhuma allowlist]`
- **Esqueceu de adicionar em `SPA_ONLY_ALLOWED` ao criar `/admin/foo`** →
  mesma mensagem acima.
- **Removeu uma rota mas esqueceu de limpar a allowlist** → CI passa, mas
  o script emite warning:
  `! SPA_ONLY_ALLOWED contém rotas que não existem mais na SPA: /admin/foo`.
  Limpe na mesma PR.

## Onde a checagem roda

1. **`npm run routes:check`** — invocação direta do script.
2. **`npm run prebuild`** — antes de `tsc + vite build` (local e CI).
3. **`npm test`** — via `src/__tests__/routesParity.test.ts` (Vitest).
4. **GitHub Actions** — step dedicado em `.github/workflows/ci-build.yml`.

Qualquer um falhando bloqueia o merge/deploy.
