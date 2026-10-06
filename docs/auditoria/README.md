# Evidências e scripts da auditoria (16/09/2026)

- `evidencias/` — capturas (antes/depois) e `browser-report.json` (7 rotas × 360/390/768/1440 px: overflow, console, requisições, headings, imagens, alvos de toque, foco, axe).
- `scripts/` — scripts Playwright usados. Reproduzir:

```bash
npm run build && npx vite preview --host 127.0.0.1 --port 4173 &
mkdir -p /tmp/pw && cd /tmp/pw && npm init -y && npm i playwright@1 @axe-core/playwright
cp <repo>/docs/auditoria/scripts/*.mjs . && node audit.mjs   # relatório em ./out
```

Os scripts usam o Chromium de `/opt/pw-browsers/chromium`; ajuste `executablePath` se necessário.
Verificação automática não substitui certificação de acessibilidade.

## Rodada 3 — 06/10/2026 (`rodada-2026-10-06.md`)

Primeira rodada com produção, Search Console, GA4 e Perfil da Empresa acessíveis. Evidências em `evidencias/2026-10-06/` (destinos 301 das 59 URLs do sitemap Wix, links internos de entrada por URL). Plano de ação em rodadas:

- **Rodada 1 (PR desta rodada):** `bewild_posts.content_updated_at` (migration `20261006150000`, exige aplicação manual — ver abaixo), `postDates`/sitemap lendo a coluna, títulos sem " | Bewild" acima de 60 caracteres (`src/lib/seoTitle.ts`), irmãs de portfólio numeradas em vez de "(cadastro dd/mm/aaaa)", `utm_*` removido de links internos no corpo dos posts (`stripInternalUtm`).
- **Rodada 2:** CSS por rota (9–11 folhas bloqueantes em toda página), JS da home (467 kB), CLS 0,15 em `/reforma-de-studio-sao-paulo`.
- **Rodada 3:** conteúdo — `/orcamento`, `/reforma-de-studio-sao-paulo`, FAQ nas 11 páginas de bairro sem FAQ, página de autor do Thiago.
- **Fora do código:** Mudança de endereço no Search Console (`sc-domain:bwild.com.br` → `https://bewild.com.br/`), responder as 50 avaliações no Perfil da Empresa, revisar edições sugeridas pelo Google e serviços listados, tráfego interno no GA4.

**Migrations escritas à mão não são aplicadas pelo deploy** (a `20260930120000` só valeu quando a Lovable a reaplicou como `20260930130146`). Aplique `20261006150000_bewild_posts_content_updated_at.sql` pelo SQL Editor do Supabase ou peça à Lovable; o código funciona antes e depois (consulta cai para `updated_at` enquanto a coluna não existe).

### Rodada 2 — desempenho (PR de 06/10/2026, tarde)

Diagnóstico (build `.output/server/_tanstack-start-manifest_*.mjs` + laboratório):

1. **CSS de todas as páginas em toda rota.** O `head()` de 9 rotas importava a constante `*_JSONLD` de dentro de `src/pages/*Page.tsx`. Como `head()` não é dividido pelo TanStack Start (fica no `routeTree`), a página inteira — CSS e componentes — entrava no grafo raiz. Correção: dados + JSON-LD movidos para `src/content/pages/<rota>.ts(x)` (sem componentes nem CSS); rota e página importam de lá. CSS da raiz: 8 → 2 arquivos (`index`, `post` — este via `NotFoundPage` no `__root`).
2. **Home carregava recharts (~92 kB gz).** `WorkflowPortalReplica` (réplica do portal do cliente) passou a `lazy()` + `Suspense`, montado só quando `#workflow-portal-root` chega a 600 px da tela (`mountPortalWhenNear`).
3. **CLS 0,15 nas internas.** `home-bwa.css` e `bwa-internal.css` (caixa `.bwa-shell`, cabeçalho) só entravam no cliente, pela `useEffect` de `BwaNav`. Agora `seoHead()` as emite no HTML do servidor (`bwaCss` padrão `true`; `false` na home, `/guia-do-investidor`, `/o`, `/p`), e `BwaNav` só move os `<link>` para o fim do `<head>`.

Medições (390 px, 1,6 Mbps/150 ms, CPU 4×; antes = produção 06/10 15:00 UTC, depois = build local):

| Rota | CSS (arquivos, KB gz) | JS pré-carregado (arquivos, KB gz) | CLS |
|---|---|---|---|
| `/` | 11 → 5 · 69 → 62 | 39 → 32 · 426 → 381 (+ recharts fora do caminho crítico) | — |
| `/faq` | 9 → 4 · 47 → 41 | 29 → 20 · 303 → 254 | — |
| `/reforma-de-studio-sao-paulo` | 9 → 5 · 47 → 41 | 27 → 20 · 296 → 198 | 0,149 → 0 |
| `/conteudos/:slug` | 10 → 4 · 49 → 41 | 28 → 18 · 315 → 213 | — |

Pendente para outra rodada: `styles.css` (199 kB bruto) ainda carrega o design system inteiro (admin, analytics, blog legado) em toda página; `post.css` entra na raiz por causa de `NotFoundPage`; `generateCategoricalChart` continua na home abaixo da dobra.
