# Decisões técnicas — Bewild

- TanStack Start v1 (migrado do SPA em 2026-09-29): `<head>` por rota via `head()` em `src/routes/` (`routeHead.ts`, `seoLoaders.ts`) — Google lê o cabeçalho sem JS.
- `useSeo.ts` roda no cliente (overrides /admin/seo, trackers, JSON-LD) mas só remove nós com `data-seo-managed` — remover tags do React quebra a reconciliação.
- `navigate()` legado (`useHashRoute.ts`) delega para `window.__bwRouter` (`src/router.tsx`); interceptador de `<a>` ativo — evita reescrever call sites.
- `CookieBanner`/`SiteAssistant` montam só após hidratação (`hydrated` no `__root.tsx`) — no SSR divergiam.
- og:image/og:url/og:title/twitter:* só nas rotas-folha via `seoHead`; root só defaults amplos.
- Tailwind v4: `src/styles.css` com `@config "../tailwind.config.ts"` (requer `tailwindcss-animate`); design system segue em `src/index.css`.
- Rotas `/admin/*`: `<AdminChunk><ProtectedRoute>` no arquivo de rota; login livre; AdminChunk não é guarda de auth.
- 24 edge functions ficam no Supabase (URLs fixas + segredos lá); front chama via `functions.invoke` e `/functions/v1/*`.
- Vitest: config removida na migração; script `test` precisa ser religado antes de rodar.
- `.env` (só chaves públicas VITE_*) é versionado: sem ele o build publicado quebra com 'supabaseUrl is required'.
