/**
 * /escopo: o "Escopo com IA" saiu do ar em 09/10/2026 (a função scope-plan
 * chamava a IA paga sem login). Em 12/10/2026 a rota voltou como página própria,
 * sem IA: perguntas + faixa por m² calculada no navegador.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { normalizeLegacyPath } from "@/lib/useHashRoute";

const root = path.resolve(__dirname, "../../..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");

describe("/escopo", () => {
  it("é página própria, não redireciona mais para /orcamento", () => {
    expect(normalizeLegacyPath("/escopo")).toBe("/escopo");
    const route = read("src/routes/escopo.tsx");
    expect(route).toMatch(/component:\s*EscopoPage/);
    expect(route).not.toMatch(/redirect\(/);
  });

  it("scope-plan segue sem chamar a IA nem ler o segredo", () => {
    const fn = read("supabase/functions/scope-plan/index.ts");
    expect(fn).not.toMatch(/ai\.gateway\.lovable\.dev/);
    expect(fn).not.toMatch(/LOVABLE_API_KEY/);
    expect(fn).toMatch(/status:\s*410/);
  });

  it("a página não chama função nem IA", () => {
    const page = read("src/pages/EscopoPage.tsx") + read("src/lib/escopoCalc.ts");
    expect(page).not.toMatch(/scope-plan|functions\.invoke|\/functions\/v1|fetch\(/);
  });
});
