import { describe, expect, it, vi } from "vitest";
import { LICENCAS, mergeLicenca } from "@/content/pages/licencas";

// licencas → indiceCusto → useSeo importa o cliente do Supabase, que exige
// VITE_SUPABASE_URL (ausente no CI). Mesmo mock dos testes vizinhos.
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

describe("licenças editáveis no painel", () => {
  it("campo vazio no banco usa o texto padrão", () => {
    const m = mergeLicenca("cc-by-4-0", { title: "", intro: "  ", body: null });
    expect(m.title).toBe(LICENCAS["cc-by-4-0"].title);
    expect(m.body).toBe(LICENCAS["cc-by-4-0"].body);
  });

  it("texto salvo no painel vence o padrão", () => {
    expect(mergeLicenca("cc-by-sa-4-0", { title: "Novo título", intro: null, body: null }).title).toBe("Novo título");
  });

  it("CC BY-SA traz o termo CompartilhaIgual e o link oficial", () => {
    expect(LICENCAS["cc-by-sa-4-0"].body).toContain("CompartilhaIgual");
    expect(LICENCAS["cc-by-sa-4-0"].body).toContain("https://creativecommons.org/licenses/by-sa/4.0/legalcode");
  });
});
