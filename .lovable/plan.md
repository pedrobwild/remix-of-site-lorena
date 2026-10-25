# Site mais rápido no celular (sem mudar texto, visual nem comportamento)

Ordem: /reforma-de-studio-sao-paulo primeiro, depois /orcamento e as demais páginas institucionais. Cada etapa é medida antes e depois (Lighthouse celular no ambiente de teste). Nada é publicado sem o seu pedido.

## O que já conferi no site publicado (25/10)

- A página de studio pede 6 folhas de estilo e 47 arquivos de código no carregamento inicial.
- Os arquivos de estilo e de código do site já vêm com cache de 1 ano (nome com hash).
- O logo (`/images/opt/...`) vem **sem cache**.
- O HTML vem `no-cache, must-revalidate`. O site já tenta pedir 60 s de cache na borda, mas a hospedagem sobrescreve isso (ver item 5).

## 1. Logo
- Gerar versões de 240 px e 480 px (WebP) do logo azul e do branco, com `srcset` e `sizes="118px"`, e `width/height` na proporção exibida (118×37).
- Passar a importar os arquivos pelo empacotador em vez de `public/`: ganham nome com hash e o cache de 1 ano que os outros arquivos já têm. Isso resolve o cache do logo sem depender da hospedagem.
- Arquivos: `src/components/BewildLogo.tsx`, `src/pages/home-bwa-body.ts`, novos arquivos em `src/assets/`.

## 2. CSS
- Hoje `home-bwa.css`, `bwa-internal.css` e `BwaImprensa.css` entram em toda página (via `seoHead` e `BwaNav`). Vou fazer cada página pedir só as folhas que usa: a de serviço não pede as da home nem a da Imprensa (que passa a carregar com o bloco da Imprensa, perto do rodapé).
- CSS crítico inline: header + H1 + parágrafo de abertura + botões das páginas de serviço e do /orcamento. O resto é carregado sem bloquear (`preload` + troca para `stylesheet`, com `<noscript>`).
- Remover regras não usadas apenas onde houver certeza (seletores sem nenhum uso no código). Fica 1 folha bloqueando no máximo.
- Atenção às regras do projeto: a ordem das folhas `.bwa` (`bwaStylesheetOrder.ts`) e as regras da raiz do documento continuam; os testes `rootStyleInvalidation` e de ordem das folhas precisam continuar passando.
- Arquivos: `src/routes/__root.tsx`, `src/lib/routeHead.ts`, `src/components/BwaNav.tsx`, `src/components/BwaStylesheets.tsx`, `src/lib/bwaStylesheetOrder.ts`, `src/components/BwaImprensa.tsx`, novo `src/lib/criticalCss.ts`.

## 3. Fontes
- `font-display: swap` nas duas (conferir `src/fonts.css`; acertar onde faltar).
- Pré-carregar só a Manrope; tirar o preload da JetBrains Mono (ela não aparece no primeiro bloco). Arquivo: `src/lib/fonts.ts` e `fonts.test.ts`.

## 4. JavaScript
- Separar por página os módulos que hoje entram no carregamento inicial de qualquer página (orçamento, licenças, YouTube, vídeos, filtro do portfólio, bairros, índice de custo, link do Radar, artigos, Imprensa, registro de 404, logs de desenvolvimento). Vou rastrear quem os puxa (`__root.tsx`, `useHashRoute.ts`, `useSeo.ts`, `routeHead.ts`) e trocar por import tardio onde for preciso. A base de custo continua vindo de um só arquivo, como manda a regra das provas.
- Configurações do site (`get_public_site_settings`): o HTML já sai com valores padrão; a busca passa a não segurar a primeira pintura e a resposta fica guardada na sessão.
- Meta Pixel e `/~flock.js`: carregar depois do `load` / em `requestIdleCallback`, mantendo o `fbq` provisório para que PageView e Lead não se percam. O aceite de cookies continua decidindo igual.
- Arquivos: `src/lib/useSeo.ts`, `src/components/MetaPixel.tsx`, `src/lib/useSiteSettings.ts`, `src/routes/__root.tsx` e as rotas envolvidas.

## 5. Cache do HTML — limitação da hospedagem
- O site já manda `s-maxage=60` para páginas públicas, mas a hospedagem da Lovable troca o cabeçalho por `no-cache` no HTML e não respeita nem o `vercel.json`. **Não consigo ligar o cache de borda do HTML a partir do código**, nem gerar as páginas estáticas no build com a hospedagem atual.
- O que dá para fazer daqui: deixar o cabeçalho certo (`s-maxage=600, stale-while-revalidate=86400`, sem variar por gclid/utm) para quando a hospedagem passar a respeitá-lo, e reduzir o tempo que o servidor leva para montar a página (cache em memória das consultas de conteúdo, como os links de bairro).
- O critério de aceite do cache na segunda visita só é atingível colocando um CDN próprio na frente do domínio (por exemplo, Cloudflare na conta de vocês) ou trocando a hospedagem. Isso é decisão sua; não está neste plano.

## Não muda
Textos, layout, cores, imagens de conteúdo, URLs, títulos, meta tags, JSON-LD, sitemap, redirecionamentos, formulário, WhatsApp, GA4 (`generate_lead`), tag do Google Ads e a conversão "Lead - Formulário site (2)" com 1.015 / 5.015, captura de gclid/UTMs, Pixel (PageView e Lead) e a exportação offline.

## Verificação
- Lighthouse celular antes/depois em studio e /orcamento (meta: nota ≥ 95, LCP ≤ 2,5 s). A nota final só vale no site publicado, depois que você pedir a publicação.
- Testes existentes (`vitest run`) e checagem de tipos.
- Ponta a ponta no ambiente de teste: abrir `/orcamento?gclid=teste&utm_source=google`, aceitar cookies, enviar e conferir no banco que o lead gravou gclid e UTMs, e no navegador que saíram a conversão do Google Ads com o valor certo e o Lead do Pixel. Esse lead de teste fica marcado e não é qualificado, para não ir ao Google Ads.
