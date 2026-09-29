# Decisões técnicas — Bewild

- TanStack Start v1 (migrado do SPA em 2026-09-29): `<head>` por rota via `head()` em `src/routes/` (`routeHead.ts`, `seoLoaders.ts`) — Google lê o cabeçalho sem JS.
- `useSeo.ts` roda no cliente (overrides /admin/seo, trackers, JSON-LD) mas só remove nós com `data-seo-managed` — remover tags do React quebra a reconciliação.
- `navigate()` legado (`useHashRoute.ts`) delega para `window.__bwRouter` (`src/router.tsx`); interceptador de `<a>` ativo — evita reescrever call sites.
- `lovable:navigate` (Pixel da Meta, tracker interno, `useHashRoute`, assistente) sai de `installNavigateEventBridge` no Root (`onResolved` do roteador), não do `navigate()` — sem a ponte, PageView/ViewContent só saíam na entrada.
- `CookieBanner`/`SiteAssistant` montam só após hidratação (`hydrated` no `__root.tsx`) — no SSR divergiam.
- og:image/og:url/og:title/twitter:* só nas rotas-folha via `seoHead`; root só defaults amplos.
- Tailwind v4: `src/styles.css` com `@config "../tailwind.config.ts"` (requer `tailwindcss-animate`); design system segue em `src/index.css`.
- Rotas `/admin/*`: `<AdminChunk><ProtectedRoute>` no arquivo de rota; login livre; AdminChunk não é guarda de auth.
- 24 edge functions ficam no Supabase (URLs fixas + segredos lá); front chama via `functions.invoke` e `/functions/v1/*`.
- Vitest: `vitest.config.ts` próprio (react + jsdom + `src/test/setup.ts`), restaurado em 2026-09-29 — o `vite.config.ts` do TanStack Start não sobe no Vitest. Gerenciador: bun (`bun.lock`); CI (`ci-build.yml`) instala com `bun install --frozen-lockfile`.
- Meta CAPI: o `Lead`/qualidade dos leads do site sai SEM exigir aceite de cookies (decisão 25/09/2026; `META_CAPI_REQUIRE_CONSENT=true` religa). Leads de formulário instantâneo devolvem estágios `lead_recebido/contatado/qualificado/descartado` com `user_data.lead_id` (API de Conversões para CRM) — nomes distintos dos eventos do site de propósito; ver docs/META-CRM.md.
