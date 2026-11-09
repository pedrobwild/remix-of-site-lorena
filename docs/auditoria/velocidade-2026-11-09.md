# Velocidade — rodada de 09/11/2026: pacote inicial de JavaScript

## O que foi encontrado

Build de produção medido localmente (mesmo `bun run build` da hospedagem, servido com um shim Node sobre o worker gerado). Em TODA página pública o navegador baixava ~1,0 MB de JavaScript (~290–312 kB gzip) antes de hidratar. Lendo os chunks com sourcemap, três causas que não dependem de página:

1. **SDK do Supabase (216 kB brutos, 55 kB gzip) no caminho crítico de todas as páginas.** `@supabase/supabase-js` entrava estaticamente pelo `head()`/loader de rotas (`faq`, `homeSeo`, `seoLoaders`, `lealMoreiraLoader`, `notFoundLog`), por `useAuth` (compartilhado pelas rotas /admin e içado pelo empacotador para o chunk de entrada) e pelo `useSeo`/`useSiteSettings`, que toda página carrega após a hidratação. O brief de 25/10 já apontava "cliente de dados ~54 KiB, 43–44 KiB não usados".
2. **Conteúdo de OUTRAS páginas no pacote de qualquer página (~100 kB brutos).** O `head()` de cada rota entra no pacote inicial de todas as rotas (o roteador não o separa). Importar `bairros.ts` (24 kB), `faqPage.ts`, `incorporadoras.ts` (também puxado pelo menu), `videoPages`+`postSeo`+`youtube` (25 kB), o conteúdo das páginas de serviço, do /orcamento, da LP, do índice de custo e das licenças no `head()` levava tudo isso para a home e para os artigos.
3. **TanStack Query (25 kB brutos) e o script inteiro da home (16 kB) em toda página**, o primeiro só usado no /admin e o segundo porque o header `.bwa` vivia no mesmo módulo da galeria, FAQ, vídeo e mapa da home.

## O que mudou

- `src/integrations/supabase/publicRest.ts`: leituras anônimas quentes (`get_public_site_settings` em toda página, `top_projects` na home, `get_image_alts` no portfólio, FAQ da home) vão direto à API REST com a chave publicável, sem o SDK. `src/integrations/supabase/lazyClient.ts` (`getSupabase()`) carrega o SDK sob demanda para o resto (envio de lead, 404, leituras sem dado do servidor, painel, login). Os `vi.mock` do módulo `client` continuam valendo.
- Conteúdo das páginas sai do `head()` e passa a vir do loader por `import("…")`; o `head()` lê `loaderData`. Metadados pequenos ficaram em módulos `.seo.ts` (LP, Leal Moreira) e o menu "Parceiros" em `src/content/navParceiros.ts`. `NOT_FOUND_SEO` ganhou módulo próprio (`src/lib/notFoundSeo.ts`). Guardado por `src/__tests__/routesCodeSplit.test.ts` ("conteúdo das páginas e cliente do Supabase fora do pacote inicial").
- `QueryClientProvider` saiu do root e do contexto do roteador para o `AdminChunk`.
- `src/pages/bwa-nav-script.ts`: header `.bwa` separado do script da home; o `BwaNav` importa só ele.
- `_headers`: cache de 30 dias (com revalidação em segundo plano) para `/images/**`, `/videos/**`, `/brand/**`, favicons e a imagem de compartilhamento (nitro `routeRules` em `vite.config.ts`). HTML segue com o cache curto de `src/server.ts`.

Sem mudança em consentimento, campanhas, provas, base de custo, sitemap ou banco. Nenhum teste enfraquecido: os ajustes nos testes refletem o novo contrato (dados do loader → head; cliente carregado um tique depois).

## Medições (build local, JavaScript referenciado pelo HTML inicial — `modulepreload` + script de entrada)

| Página | Antes (bruto / gzip) | Depois (bruto / gzip) | Variação gzip |
|---|---|---|---|
| `/` | 1.014.627 / 311.973 | 695.011 / 221.816 | −29 % |
| `/reforma-de-studio-sao-paulo` | 944.277 / 291.858 | 621.926 / 201.583 | −31 % |
| `/portfolio` | 954.500 / 296.218 | 624.351 / 202.972 | −31 % |
| `/orcamento` | 956.768 / 297.586 | 633.314 / 207.328 | −30 % |
| `/conteudos` | 938.216 / 290.400 | 608.390 / 197.401 | −32 % |
| `/servicos` | 949.222 / 294.682 | 633.904 / 206.603 | −30 % |
| `/como-funciona` | 939.686 / 289.619 | 609.765 / 196.497 | −32 % |
| `/faq` | 951.848 / 295.428 | 631.357 / 206.330 | −30 % |
| `/videos` | 932.199 / 288.299 | 606.929 / 197.309 | −32 % |

Chunk de entrada (`index-*.js`): 548.638 → 478.383 bytes (164 → 144 kB gzip); o que resta é React DOM (203 kB brutos), o roteador (~70 kB) e os `head()`/loaders das rotas. O SDK do Supabase e o TanStack Query não aparecem mais em nenhuma lista de `modulepreload` das páginas públicas; o SDK só é baixado ao enviar um formulário, abrir o painel ou quando uma página precisa ler o banco sem dado do servidor. CSS e HTML não mudaram de tamanho.

Não foi possível medir PageSpeed/Lighthouse contra o domínio real a partir deste ambiente (rede bloqueada), nem antes nem depois. A redução é de bytes e de módulos avaliados na hidratação; o efeito em LCP/INP deve ser confirmado no PageSpeed depois de publicado, com o roteiro do brief de 25/10.

## Validação

- `bun run test`: 217 arquivos, 2.191 testes aprovados, 9 ignorados.
- `bun run verify-types`: OK. ESLint nos arquivos alterados: só dois avisos pré-existentes em `__root.tsx` (imports não usados).
- Playwright (Chromium) sobre o build de produção local, 1280 px e Pixel 7: `/`, `/reforma-de-studio-sao-paulo`, `/faq`, `/orcamento`, `/videos/depoimento-vivian`, `/reforma/pinheiros`, 404 e `/admin/login` — HTTP esperado, título e H1 certos, JSON-LD presente, hidratação concluída, navegação interna `/` → `/servicos` pelo interceptador de links, menu mobile abre, sem rolagem horizontal e sem erros de JavaScript (apenas recursos externos bloqueados pela rede do ambiente: selo do Reclame Aqui e miniaturas do YouTube).
