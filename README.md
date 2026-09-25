# Bewild

Site institucional da **Bewild** — reforma turn-key de studios para short stay em São Paulo. Projeto, obra, marcenaria, mobiliário e tecnologia de acompanhamento em um processo único.

Domínio canônico: [https://bewild.com.br](https://bewild.com.br)

## Stack

SPA React + TypeScript com:

- **Vite 5** — bundler / dev server
- **React 18** + roteador próprio baseado em **path** (`src/lib/useHashRoute.ts`)
  — o nome do arquivo é histórico: o roteador lê `window.location.pathname` e
  navega com `history.pushState`. O hash só é lido para migrar URLs legadas
  (`#/rota` → `/rota`) e para âncoras da home. Renomear o arquivo mexeria em
  dezenas de imports sem ganho nenhum, então fica como está (CODE-03).
- **Supabase / Lovable Cloud** — banco, auth, storage e edge functions (`src/integrations/supabase`)
- **GSAP 3.12** + **ScrollTrigger** — timelines e reveals
- **Lenis** — smooth scroll editorial
- **Tailwind 3** — utilitários complementares ao design system
- **Vitest** + **@testing-library/react** — testes em ambiente jsdom

## Variáveis de ambiente

O app espera três variáveis prefixadas com `VITE_` (expostas ao bundle):

| Variável | Origem |
| --- | --- |
| `VITE_SUPABASE_URL` | Project Settings → API → Project URL |
| `VITE_SUPABASE_PROJECT_ID` | Project Settings → General → Reference ID |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Project Settings → API → `anon` public key |

Copie o template e preencha localmente:

```bash
cp .env.example .env
# edite .env com os valores do painel
```

> **Importante:** `.env` não é versionado (entrou no `.gitignore`). Apenas `.env.example` permanece no repositório como referência.

## Rodar localmente

```bash
npm ci          # instala dependências exatas do package-lock.json
npm run dev     # Vite dev server em http://localhost:5173
```

## Testes

```bash
npm test            # roda a suíte completa uma vez (vitest run)
npm run test:watch  # modo watch
```

## Build de produção

```bash
npm run build       # parity check + tsc -b + vite build
npm run preview     # serve o bundle de dist/ localmente
```

## Estrutura

```
.
├── index.html                  shell SPA (carrega /src/main.tsx)
├── src/
│   ├── main.tsx                bootstrap (router + cursor + analytics)
│   ├── App.tsx                 monta HomePage e rotas públicas
│   ├── pages/                  rotas (Portfolio, Conteúdos, Diagnóstico, FAQ, admin/*)
│   ├── components/             componentes compartilhados (nav, footer, banners)
│   ├── lib/                    hooks e serviços (useAuth, useSeo, analytics)
│   ├── integrations/supabase/  cliente do Supabase e tipos gerados
│   └── __tests__/              testes de unidade do roteador e fluxos SEO
├── supabase/                   migrações e edge functions
├── scripts/                    utilitários (check-routes-parity, etc.)
└── public/                     ativos estáticos servidos como-são
```

## Rastreamento de leads na Meta e no Google Ads

Pixel (`Lead`, `Contact`, `ViewContent`) + Conversions API (`Lead`,
`QualifiedLead`, `DisqualifiedLead`), com deduplicação por `event_id`, só para
formulários de cliente e só com aceite de cookies; Google Ads com conversões
otimizadas. Segredos, passo a passo de ativação e SQL de auditoria em
[docs/META-CAPI.md](docs/META-CAPI.md).

Campanhas e formulários instantâneos da Meta no painel (edge function
`meta-sync`, a cada 30 min): métricas diárias por campanha, leads dos
formulários do Facebook/Instagram com aviso no Slack, e-mail e CRM — ver
[docs/META-SYNC.md](docs/META-SYNC.md).

Página /admin/integracoes (status de cada integração e registro de envios),
pixel próprio 1×1 e links rastreados (edge function `px`, sem dados
pessoais) e exportação para planilha/BI com chaves revogáveis (edge function
`data-export`, CSV/JSON sem dados pessoais) — ver
[docs/INTEGRACOES.md](docs/INTEGRACOES.md).

## Deploy

O site é publicado pelo **hosting da Lovable** (projeto
`6a6657bf-3700-4d35-867e-c076acbf7613`), em `https://bewild.com.br`.

> **O bundle não é portátil hoje** (corrigido no texto em 22/09/2026 — CODE-06).
> Parte dos assets — incluindo o logo do cabeçalho e a imagem do hero — é
> referenciada por caminhos `/__l5e/assets-v1/<uuid>/...`, servidos **apenas**
> pelo hosting da Lovable (ver `src/assets/*.asset.json`). Num `vite preview`
> local ou em qualquer outro CDN essas imagens voltam 404. Migrar de hosting
> exige antes trazer esses arquivos para `public/` e trocar as referências.
> A versão anterior deste README dizia "qualquer CDN compatível", o que não se
> sustenta enquanto isso não for feito.

Um build servido localmente (`npm run build && npm run preview`) funciona para
auditar rotas, SEO e acessibilidade; só as imagens `/__l5e/...` ficam faltando.

As três variáveis `VITE_*` precisam estar definidas no ambiente de build
(existe fallback público em `vite.config.ts` para a chave `anon`).
