import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

/**
 * Configuração do Vitest.
 *
 * Os testes rodam no ambiente jsdom para que possamos inspecionar `document.head`
 * (title, <meta name="robots">, JSON-LD) e o DOM renderizado pelo React.
 * Os testes dos scripts de build (scripts/**) também rodam aqui: eles só
 * manipulam strings/HTML, e o setup compartilhado (src/test/setup.ts) exige
 * `window`, então ficam no mesmo ambiente.
 *
 * A suíte é executada via `npm test` (script `vitest run`). O workflow de CI
 * `ci-build.yml` roda `npm test` antes de `npm run build`, garantindo que
 * regressões em SEO (ex.: alguém remover `noindex` da NotFoundPage) bloqueiem
 * o merge antes de virar soft-404 no Google.
 *
 * Fuso fixo em São Paulo: os testes de datas do painel de Analytics dependem
 * do horário local (dia que vira às 21h UTC, "hoje até agora" × "ontem até o
 * mesmo horário"). Definir o TZ aqui, antes de os workers subirem, vale em
 * qualquer runtime; trocar `process.env.TZ` dentro de um `beforeAll` não
 * muda o fuso em todos eles (a sandbox da Lovable, por exemplo, ignora).
 */
process.env.TZ = "America/Sao_Paulo";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}", "scripts/**/*.{test,spec}.{ts,mjs}"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
