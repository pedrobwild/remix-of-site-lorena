/**
 * /escopo ("Escopo com IA") saiu do ar em 09/10/2026: o endereço faz 301 para
 * /orcamento e a edge function `scope-plan` não chama mais a IA paga
 * (achado crítico do scan de segurança do Lovable).
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { normalizeLegacyPath } from "@/lib/useHashRoute";

const root = path.resolve(__dirname, "../../..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");

describe("/escopo removida", () => {
  it("SPA normaliza /escopo para /orcamento", () => {
    expect(normalizeLegacyPath("/escopo")).toBe("/orcamento");
  });

  it("rota do servidor responde 301 para /orcamento", () => {
    const route = read("src/routes/escopo.tsx");
    expect(route).toMatch(/redirect\(\{\s*to:\s*"\/orcamento",\s*statusCode:\s*301\s*\}\)/);
    expect(route).not.toMatch(/component:/);
  });

  it("scope-plan não chama a IA nem lê o segredo", () => {
    const fn = read("supabase/functions/scope-plan/index.ts");
    expect(fn).not.toMatch(/ai\.gateway\.lovable\.dev/);
    expect(fn).not.toMatch(/LOVABLE_API_KEY/);
    expect(fn).toMatch(/status:\s*410/);
  });

  it("nenhum link do site aponta para /escopo", () => {
    for (const f of ["src/components/BwaFooter.tsx", "src/pages/MarcenariaPage.tsx", "src/lib/publicPages.ts", "public/sitemap.xml"]) {
      expect(read(f)).not.toMatch(/\/escopo\b/);
    }
  });
});
