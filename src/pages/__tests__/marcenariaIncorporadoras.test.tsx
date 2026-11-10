/**
 * /marcenaria com seção para incorporadoras (auditoria de SEO, rodada 4,
 * 09/11/2026, ação 10). "marcenaria para incorporadoras": 39 impressões,
 * posição 14,2 (Search Console, 28 dias até 06/11/2026), sem nenhum texto na
 * página que respondesse a busca.
 *
 * A seção sai no HTML do servidor e usa só fatos que o site já publica no
 * case Leal Moreira e no programa para incorporadoras (src/content/lealMoreira.ts
 * e src/content/incorporadoras.ts) e na própria página de marcenaria: nenhum
 * número de unidades, prazo ou cliente novo.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: () => new Promise(() => {}),
    from: () => ({ select: () => new Promise(() => {}) }),
  },
}));
vi.mock("@/components/BwaNav", () => ({ default: () => null }));
vi.mock("@/components/BwaFooter", () => ({ default: () => null }));
vi.mock("@/components/BwaImprensa", () => ({ default: () => null }));
vi.mock("@/lib/useSeo", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/useSeo")>()),
  useSeo: () => {},
}));
vi.mock("@/lib/trackCta", () => ({ useCtaClickTracking: () => {} }));

import MarcenariaPage from "@/pages/MarcenariaPage";
import { MARCENARIA_SEO } from "@/content/pages/marcenaria.seo";
import { Route } from "@/routes/marcenaria";

const SRC = path.resolve(__dirname, "../..");
const read = (p: string) => readFileSync(path.join(SRC, p), "utf8");
const html = renderToString(createElement(MarcenariaPage)).replace(/<!-- -->/g, "");
const doc = new DOMParser().parseFromString(html, "text/html");
const texto = (el: Element | null) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const secao = doc.getElementById("incorporadoras")?.closest("section") ?? null;

describe("/marcenaria: seção para incorporadoras no HTML do servidor", () => {
  it('tem um H2 com "marcenaria para incorporadoras"', () => {
    const h2 = doc.getElementById("incorporadoras");
    expect(h2?.tagName).toBe("H2");
    expect(texto(h2)).toMatch(/marcenaria para incorporadoras/i);
    expect(secao).not.toBeNull();
  });

  it("fala de lotes de unidades, de prazo e do case Leal Moreira", () => {
    const t = texto(secao);
    expect(t).toMatch(/tipologia/);
    expect(t).toMatch(/mínimo de unidades/);
    expect(t).toMatch(/60 dias úteis/);
    expect(t).toContain("LM Urban Flex Bela Cintra");
    expect(t).toContain("Leal Moreira");
  });

  it("linka o case /parceiros/leal-moreira e convida para o /orcamento, sem UTM", () => {
    const links = Array.from(secao!.querySelectorAll<HTMLAnchorElement>("a"));
    const hrefs = links.map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("/parceiros/leal-moreira");
    const cta = links.find((a) => a.getAttribute("href") === "/orcamento");
    expect(cta?.dataset.cta).toBe("marcenaria-incorporadoras-orcamento");
    for (const href of hrefs) expect(href).not.toMatch(/utm_/);
    // Âncora descritiva para o case, não "clique aqui".
    const caso = links.find((a) => a.getAttribute("href") === "/parceiros/leal-moreira");
    expect(texto(caso!)).toMatch(/Leal Moreira/);
  });

  it("todo número da seção já está publicado no case, no programa ou na página de marcenaria", () => {
    const fontes = [
      read("content/incorporadoras.ts"),
      read("content/lealMoreira.ts"),
      read("content/pages/marcenaria.ts"),
      read("pages/MarcenariaPage.tsx"),
    ].join("\n");
    const numeros = texto(secao).match(/\d+(?:[.,]\d+)?/g) ?? [];
    expect(numeros.length).toBeGreaterThan(0);
    for (const n of numeros) expect(fontes, n).toContain(n);
  });
});

describe("/marcenaria: título no limite, igual no servidor e no navegador", () => {
  it("título com até 60 caracteres e a palavra-chave principal", () => {
    expect(MARCENARIA_SEO.title).toBe(
      "Marcenaria sob medida em São Paulo: fábrica própria | Bewild"
    );
    expect(MARCENARIA_SEO.title.length).toBeLessThanOrEqual(60);
    expect(MARCENARIA_SEO.description.length).toBeLessThanOrEqual(160);
  });

  it("o head() da rota usa os metadados compartilhados", () => {
    const head = (
      Route.options.head as unknown as (ctx: unknown) => { meta: Array<Record<string, string>> }
    )({
      loaderData: undefined,
      matches: [],
    });
    expect(head.meta.find((m) => m.title)?.title).toBe(MARCENARIA_SEO.title);
    expect(head.meta.find((m) => m.name === "description")?.content).toBe(
      MARCENARIA_SEO.description
    );
  });

  it("a página (useSeo no navegador) usa a mesma fonte", () => {
    const pagina = read("pages/MarcenariaPage.tsx");
    expect(pagina).toMatch(/title: MARCENARIA_SEO\.title/);
    expect(pagina).toMatch(/description: MARCENARIA_SEO\.description/);
  });
});
