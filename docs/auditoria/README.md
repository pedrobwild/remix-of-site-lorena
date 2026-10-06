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
