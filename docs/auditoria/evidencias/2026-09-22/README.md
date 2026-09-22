# Evidências — rodada 2 (22/09/2026)

Relatório: [`../../rodada-2026-09-22.md`](../../rodada-2026-09-22.md)

## Como foram geradas

```bash
npm run build
npx vite preview --host 127.0.0.1 --port 4173 &
mkdir -p /tmp/pw && cd /tmp/pw && npm init -y && npm i playwright@1 @axe-core/playwright
cp <repo>/docs/auditoria/scripts/*.mjs . && BASE=http://127.0.0.1:4173 node audit.mjs
```

O script desta rodada cobre **10 rotas × 6 larguras** (320, 360, 390, 768, 1280,
1440) — a rodada anterior cobria 7 × 4.

## Arquivos

| Arquivo | O que é |
|---|---|
| `browser-report-2026-09-22-antes.json` | relatório completo no HEAD `77dfad4` (antes das correções) |
| `browser-report-2026-09-22-depois.json` | mesmo relatório no fim da branch |
| `2026-09-22-<rota>-320.png` / `-1280.png` | capturas depois, nas duas larguras exigidas pelo QA |
| `2026-09-22-404-1280.png` | rota inexistente — confirma `robots: noindex, nofollow` |
| `2026-09-22-diagnostico-390-fallback-utm.png` | estado de falha honesta do formulário (LEAD-01) na execução que comprovou LEAD-06 |

## Três ressalvas honestas sobre estas capturas

1. **O backend está inacessível neste ambiente** (o proxy nega `*.supabase.co`).
   Isso foi proposital para a verificação de SEO-01 — é exatamente a condição de
   teste exigida —, mas significa que as telas aparecem **sem dados**:
   `/portfolio` e `/conteudos` mostram estado vazio, e a ficha de projeto não
   renderiza conteúdo.

2. **Por isso não há par antes/depois para PORT-01.** A mudança (esconder o chip
   "Obra pronta" quando nenhum projeto tem foto de obra) só é visível com
   projetos carregados, e `showChips` exige pelo menos 4 projetos com capa. A
   evidência dessa correção é o teste
   `src/lib/__tests__/portfolioFilter.test.ts`, não uma captura.

3. **As 3 imagens marcadas como quebradas nos dois relatórios**
   (`/__l5e/assets-v1/…`: logo do cabeçalho, hero e selo) **não são bug de
   produção** — esse prefixo é servido só pelo hosting do Lovable. Ver CODE-06
   no relatório.

Nenhum dos dois relatórios registra overflow horizontal, imagem de
`lovable.app`, ou violação `serious`/`critical` nova no axe.
