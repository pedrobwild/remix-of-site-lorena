/**
 * /reforma-de-studio-sao-paulo (análise de palavras-chave de 11/10/2026).
 *
 *  - Título e H1 no singular ("reforma de studio", posição 3,5 no Search
 *    Console de 28 dias até 06/11/2026).
 *  - Plural: até 10/11/2026 "reforma de studios" era da home, que caía na
 *    posição 37 para essa busca. Decisão do Pedro (D1, 10/11/2026; auditoria
 *    de SEO, rodada 4, ação 1): o plural passa para esta página, num H2 no
 *    HTML do servidor, e os artigos de custo e de prazo apontam para cá.
 *  - Gestão de Airbnb: a página dizia, no mesmo texto, que a Bewild "não faz a
 *    gestão do anúncio" e, no FAQ, que faz. A Bewild faz; a frase certa é a do
 *    FAQ, do /faq e dos artigos.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { renderToString } from "react-dom/server";
import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";

// O módulo de conteúdo importa useSeo, que instancia o cliente do Supabase ao
// carregar; sem VITE_SUPABASE_URL (CI e sandbox não têm .env) o import quebra.
// Mesmo mock dos demais testes de SEO: aqui só rodam dados puros, nunca o backend.
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: () => new Promise(() => {}),
    from: () => ({ select: () => new Promise(() => {}) }),
  },
}));
// Para renderizar a página como o servidor (bloco "plural num H2"): menu,
// rodapé, imprensa e medições não interessam aqui.
vi.mock("@/components/BwaNav", () => ({ default: () => null }));
vi.mock("@/components/BwaFooter", () => ({ default: () => null }));
vi.mock("@/components/BwaImprensa", () => ({ default: () => null }));
vi.mock("@/lib/useSeo", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/useSeo")>()),
  useSeo: () => {},
}));
vi.mock("@/lib/trackCta", () => ({ useCtaClickTracking: () => {} }));

import { FAQ, HERO_STUDIO, SEO_DESCRIPTION, SEO_TITLE, STUDIO_SP_JSONLD, heroStudioDaVariante } from "@/content/pages/reforma-de-studio-sao-paulo";

import ReformaStudioSpPage from "@/pages/ReformaStudioSpPage";

const SRC = path.resolve(__dirname, "../..");
const read = (p: string) => readFileSync(path.join(SRC, p), "utf8");

describe("reforma de studio: metadados aprovados e H1 preservado", () => {
  it("título e descrição", () => {
    expect(SEO_TITLE).toBe("Reforma de studio em São Paulo: preço e prazo em contrato");
    expect(SEO_TITLE.length).toBeLessThanOrEqual(60);
    expect(SEO_DESCRIPTION).toBe("Reforma completa de studio e apartamento pequeno em SP: projeto, obra, marcenaria e mobília num contrato. Mediana de R$ 2.744/m² em 188 contratos.");
    // O título continua no singular: é a busca em que a página já está em 3,5.
    expect(SEO_TITLE).toMatch(/^Reforma de studio em São Paulo/);
  });

  it("rota (servidor) e página (navegador) usam o mesmo título e a mesma descrição", () => {
    const rota = read("routes/reforma-de-studio-sao-paulo.tsx");
    const pagina = read("pages/ReformaStudioSpPage.tsx");
    for (const fonte of [rota, pagina]) {
      expect(fonte).toMatch(/title: SEO_TITLE/);
      expect(fonte).toMatch(/description: SEO_DESCRIPTION/);
    }
  });

  it("H1 e dados estruturados", () => {
    // H1 do visitante orgânico (sem utm_*): o padrão do módulo de conteúdo.
    const pagina = read("pages/ReformaStudioSpPage.tsx");
    expect(pagina).toMatch(/\{hero\.h1\}\{" "\}/);
    expect(HERO_STUDIO.padrao.h1).toBe("Reforma de studio em São Paulo,");
    expect(HERO_STUDIO.padrao.destaque).toBe("entregue pronto para alugar, anunciar no Airbnb ou morar.");
    expect(heroStudioDaVariante("arquitetura")).toBe(HERO_STUDIO.padrao);
    // O plural vai num H2 (bloco abaixo); o H1 de toda variante fica no singular.
    for (const hero of Object.values(HERO_STUDIO)) expect(`${hero.h1} ${hero.destaque}`).not.toMatch(/reforma de studios/i);
    expect(STUDIO_SP_JSONLD[0]).toMatchObject({ "@type": "Service" });
    // name = H1 da página (palavra-chave no singular no começo).
    expect(String(STUDIO_SP_JSONLD[0].name)).toMatch(/^Reforma de studio em São Paulo,/);
  });
});

describe("gestão de Airbnb: a Bewild faz", () => {
  it("o texto e o FAQ da página de studio dizem a mesma coisa", () => {
    const pagina = read("pages/ReformaStudioSpPage.tsx").replace(/\s+/g, " ");
    expect(pagina).toContain("também faz a gestão do Airbnb");
    expect(pagina).toContain('href="/conteudos/gestao-propria-vs-gestora"');
    const item = FAQ.find((f) => f.q === "Vocês fazem a gestão do Airbnb?");
    expect(item?.a.startsWith("Sim.")).toBe(true);
    expect(item?.a).toContain("a Bewild faz a gestão do Airbnb");
  });

  it("nenhuma página diz que a Bewild não faz a gestão", () => {
    const arquivos = (dir: string): string[] =>
      readdirSync(dir).flatMap((nome) => {
        const caminho = path.join(dir, nome);
        if (statSync(caminho).isDirectory()) return nome === "__tests__" ? [] : arquivos(caminho);
        return /\.(ts|tsx)$/.test(nome) ? [caminho] : [];
      });
    const negacao = /n[ãa]o\s+(faz|fazemos|oferece|oferecemos)\s+(a\s+)?gest[ãa]o/i;
    const achados = arquivos(SRC)
      .filter((f) => negacao.test(readFileSync(f, "utf8").replace(/\s+/g, " ")))
      .map((f) => path.relative(SRC, f));
    expect(achados).toEqual([]);
  });
});

describe("plural num H2 (D1, 10/11/2026)", () => {
  const html = renderToString(createElement(ReformaStudioSpPage)).replace(/<!-- -->/g, "");
  const doc = new DOMParser().parseFromString(html, "text/html");
  const texto = (el: Element) => (el.textContent ?? "").replace(/\s+/g, " ").trim();

  it("o HTML do servidor tem um H2 com \"reforma de studios\", e o H1 segue no singular", () => {
    const h2s = Array.from(doc.querySelectorAll("h2")).map(texto);
    expect(h2s.filter((t) => /reforma de studios/i.test(t))).toEqual(["Reforma de studios para alugar ou para morar"]);
    const h1 = doc.querySelectorAll("h1");
    expect(h1).toHaveLength(1);
    expect(texto(h1[0])).toMatch(/^Reforma de studio em São Paulo,/);
  });

  it("o H2 do plural abre a seção das duas finalidades (alugar ou vender; morar)", () => {
    const h2 = doc.getElementById("para-quem");
    expect(h2?.tagName).toBe("H2");
    expect(Array.from(h2!.closest("section")!.querySelectorAll("h3")).map(texto)).toEqual(["Para alugar ou vender", "Para morar"]);
  });
});
