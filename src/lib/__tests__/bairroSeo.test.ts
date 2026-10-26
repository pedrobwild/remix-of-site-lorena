/**
 * Título e descrição das páginas de bairro (/reforma/<bairro>). Uma função só
 * para o HTML do servidor (seoLoaders) e para o navegador (BairroPage): antes o
 * texto era escrito em quatro lugares.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

// seoLoaders e useSeo instanciam o cliente do Supabase ao carregar o módulo; sem
// VITE_SUPABASE_URL (CI e sandbox não têm .env) o import quebra. Mesmo mock dos
// demais testes de SEO: aqui só rodam funções puras, nunca o backend.
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: () => new Promise(() => {}),
    from: () => ({ select: () => new Promise(() => {}) }),
  },
}));

import { bairroAreaRange, bairroDescription, bairroHeading, bairroTitle, noBairro } from "@/lib/bairroSeo";
import { bairroSeoFrom } from "@/lib/seoLoaders";
import { VISIBLE_TITLE_MAX } from "@/lib/seoTitle";

describe("noBairro", () => {
  it("usa a preposição que se escreve em português", () => {
    expect(noBairro("Brooklin")).toBe("no Brooklin");
    expect(noBairro("Butantã")).toBe("no Butantã");
    expect(noBairro("Campo Belo")).toBe("no Campo Belo");
    expect(noBairro("Vila Madalena")).toBe("na Vila Madalena");
    expect(noBairro("Vila Nova Conceição")).toBe("na Vila Nova Conceição");
    expect(noBairro("Bela Vista")).toBe("na Bela Vista");
    expect(noBairro("Consolação")).toBe("na Consolação");
    expect(noBairro("República")).toBe("na República");
    expect(noBairro("Pinheiros")).toBe("em Pinheiros");
    expect(noBairro("Moema")).toBe("em Moema");
    expect(noBairro("Higienópolis")).toBe("em Higienópolis");
    expect(noBairro("Campos Elíseos")).toBe("nos Campos Elíseos");
    expect(noBairro("")).toBe("em São Paulo");
  });
});

describe("bairroTitle", () => {
  it("cita apartamento, o bairro, SP, orçamento e prazo", () => {
    expect(bairroTitle("Moema")).toBe("Reforma de apartamento em Moema, SP: orçamento e prazo");
    expect(bairroTitle("Brooklin")).toBe("Reforma de apartamento no Brooklin, SP: orçamento e prazo");
    expect(bairroTitle("Pinheiros")).toBe("Reforma de apartamento em Pinheiros, SP: orçamento e prazo");
    expect(bairroTitle("Vila Olímpia")).toBe("Reforma de apartamento na Vila Olímpia, SP: orçamento e prazo");
  });

  it("a marca só entra quando o título inteiro cabe no que o Google mostra", () => {
    for (const label of ["Moema", "Butantã", "Brooklin", "Vila Olímpia", "Vila Nova Conceição"]) {
      const title = bairroTitle(label);
      if (title.endsWith(" | Bewild")) expect(title.length, label).toBeLessThanOrEqual(VISIBLE_TITLE_MAX);
      expect(title, label).toContain(noBairro(label));
    }
  });

  it("sem bairro, fala de São Paulo", () => {
    expect(bairroTitle()).toBe("Reforma de apartamento em São Paulo, SP: orçamento e prazo");
    expect(bairroTitle("  ")).toBe(bairroTitle(null));
  });
});

describe("página de bairro: servidor e navegador dizem o mesmo", () => {
  const projetos = [
    { neighborhood: "Vila Olímpia", cover_url: "a.jpg", area_m2: 25 },
    { neighborhood: "Vila Olímpia", cover_url: "b.jpg", area_m2: 28 },
    { neighborhood: "Vila Olimpia", cover_url: "c.jpg", area_m2: 25 },
    { neighborhood: "Moema", cover_url: "d.jpg", area_m2: 30 },
  ];

  it("o loader usa bairroTitle e bairroDescription", () => {
    const seo = bairroSeoFrom("vila-olimpia", projetos);
    expect(seo.title).toBe(bairroTitle("Vila Olímpia"));
    expect(seo.description).toBe(bairroDescription(3, "Vila Olímpia", bairroAreaRange(projetos.slice(0, 3))));
    expect(seo.notFound).toBeUndefined();
  });

  it("bairro com menos de 3 projetos não tem página", () => {
    expect(bairroSeoFrom("moema", projetos).notFound).toBe(true);
  });

  it("falha de rede cai no título genérico de São Paulo", () => {
    expect(bairroSeoFrom("moema", null).title).toBe(bairroTitle());
  });

  it("a página e a rota não escrevem o título à mão", () => {
    const read = (p: string) => readFileSync(path.resolve(__dirname, "../../..", p), "utf8");
    for (const f of ["src/pages/BairroPage.tsx", "src/routes/reforma.$slug.tsx", "src/lib/seoLoaders.ts"]) {
      const fonte = read(f);
      expect(fonte, f).toContain("bairroTitle(");
      expect(fonte, f).not.toMatch(/projetos e orçamento/);
    }
    // O H1 acompanha o título.
    expect(read("src/pages/BairroPage.tsx")).toContain('Reforma de apartamento {label ? bairroPreposicao(label) : "em"} <em>{label || "São Paulo"}</em>');
  });

  it("o llms.txt lista os bairros com o mesmo rótulo do título", () => {
    const read = (p: string) => readFileSync(path.resolve(__dirname, "../../..", p), "utf8");
    // O build regrava o trecho entre os marcadores a partir deste modelo.
    expect(read("scripts/generate-sitemap.mjs")).toContain("- [Reforma de apartamento ${noBairro(h.label)}]");
    const llms = read("public/llms.txt");
    const bloco = llms.slice(llms.indexOf("<!-- bairros:start -->"), llms.indexOf("<!-- bairros:end -->"));
    const linhas = bloco.split("\n").filter((l) => l.startsWith("- ["));
    expect(linhas.length).toBeGreaterThan(0);
    const prefixo = /^Reforma de apartamento (?:no|na|nos|em) /;
    for (const linha of linhas) {
      const [, label = ""] = linha.match(/^- \[([^\]]+)\]\(\/reforma\//) ?? [];
      expect(prefixo.test(label), linha).toBe(true);
      expect(bairroTitle(label.replace(prefixo, "")).startsWith(label), linha).toBe(true);
    }
  });

  it("o sitemap data a página de bairro também pelo código dela", () => {
    // Título, H1 e descrição saem de BairroPage/bairroSeo: quando eles mudam, o
    // lastmod do bairro acompanha (antes só mudava com edição de projeto).
    const gerador = readFileSync(path.resolve(__dirname, "../../..", "scripts/generate-sitemap.mjs"), "utf8");
    expect(gerador).toContain('const hoodPageLastmod = page("src/pages/BairroPage.tsx", ["src/lib/bairroSeo.ts"]);');
    expect(gerador).toContain('lastmod: day(newest(h.rows, "content_updated_at", "created_at"), hoodPageLastmod),');
  });
});
