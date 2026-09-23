/**
 * Smoke test do /guia-do-investidor: a página monta inteira (seções, tabela,
 * FAQ) e aplica no <head> o mesmo título/JSON-LD do pré-render.
 */
import { beforeAll, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { BAIRROS } from "@/guia/data/bairros";
import { GUIA_FAQ, GUIA_MODIFIED, GUIA_TITLE } from "@/guia/data/guiaMeta";

vi.mock("@/integrations/supabase/client", () => ({
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "test-anon-key",
  supabase: { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }) },
}));

vi.mock("@/lib/useSiteSettings", async () => {
  const actual = await vi.importActual<typeof import("@/lib/useSiteSettings")>("@/lib/useSiteSettings");
  return {
    ...actual,
    fetchSiteSettings: vi.fn().mockResolvedValue({ site_title: "Bewild", seo_canonical_base: "https://bewild.com.br" }),
    invalidateSiteSettings: vi.fn(),
  };
});

vi.mock("@/components/BwaFooter", () => ({ default: () => null }));

describe("GuiaInvestidorPage", () => {
  beforeAll(() => {
    if (!("ResizeObserver" in globalThis)) {
      (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
      };
    }
    // jsdom não implementa rolagem.
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  });

  it("monta todas as seções e aplica título e JSON-LD compartilhados", { timeout: 90_000 }, async () => {
    const { default: GuiaInvestidorPage } = await import("@/pages/GuiaInvestidorPage");
    render(<GuiaInvestidorPage />);

    await waitFor(() => expect(document.title).toBe(GUIA_TITLE));
    const ld = [...document.head.querySelectorAll('script[type="application/ld+json"][data-seo-managed]')].map((s) =>
      JSON.parse(s.textContent || "{}"),
    );
    expect(ld.find((o) => o["@type"] === "Article")?.dateModified).toBe(GUIA_MODIFIED);
    expect(ld.find((o) => o["@type"] === "FAQPage")?.mainEntity).toHaveLength(GUIA_FAQ.length);

    // Tabela de bairros: uma linha por bairro da base única, sem texto de placeholder.
    const tabela = screen.getByRole("table", { name: /Faixas observadas de diária/ });
    expect(within(tabela).getAllByRole("rowheader")).toHaveLength(BAIRROS.length);
    expect(document.body.textContent).not.toMatch(/Seed \(substituir|guiadoinvestidor/);

    // Seções carregadas sob demanda também montam.
    // (o primeiro import dinâmico passa pelo transform do Vite: dá mais prazo)
    expect(screen.queryByText(/Não foi possível carregar a seção/)).toBeNull();
    expect(await screen.findByRole("heading", { name: "Simulador de Receita" }, { timeout: 30_000 })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Tendências 2026" }, { timeout: 30_000 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Checklist do Investidor" })).toBeInTheDocument();

    // O botão sr-only "Abrir menu" que não fazia nada saiu.
    expect(screen.queryByRole("button", { name: "Abrir menu" })).toBeNull();
  });
});
