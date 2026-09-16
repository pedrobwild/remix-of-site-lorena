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
