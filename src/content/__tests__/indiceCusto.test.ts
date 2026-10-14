/**
 * Índice Bewild de custo de reforma: a página, o CSV para download e o
 * JSON-LD têm de contar a mesma história do artigo pilar (base de 188
 * contratos). Quebrou aqui? Atualize src/content/indiceCusto.ts e o CSV juntos.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

// O módulo usa faqJsonLd (useSeo), que importa o cliente do Supabase.
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
vi.mock("@/components/BwaNav", () => ({ default: () => null }));
vi.mock("@/components/BwaFooter", () => ({ default: () => null }));
vi.mock("@/lib/trackCta", () => ({ useCtaClickTracking: () => {} }));
vi.mock("@/lib/useSeo", async (importOriginal) => ({ ...await importOriginal<typeof import("@/lib/useSeo")>(), useSeo: () => {} }));
import IndiceCustoPage from "@/pages/IndiceCustoPage";
import { CONTRATOS_ANALISADOS } from "@/content/provas";
import {
  FAIXAS_METRAGEM,
  FAIXAS_VALOR,
  INDICE,
  INDICE_CSV_PATH,
  INDICE_DESCRIPTION,
  INDICE_JSONLD,
  INDICE_LICENCA_URL,
  INDICE_LICENCA_NOME,
  INDICE_PERIODO,
  INDICE_FAQ,
  INDICE_TITLE,
  EXCLUSOES,
  REGISTROS_INICIAIS,
  RESUMO,
} from "@/content/indiceCusto";

const root = path.resolve(__dirname, "../../..");
const csv = readFileSync(path.join(root, "public", INDICE_CSV_PATH), "utf8").trim().split("\n");
const linhas = csv.filter((l) => !l.startsWith("#")).slice(1).map((l) => l.split(","));
const html = renderToStaticMarkup(createElement(IndiceCustoPage));

describe("Índice Bewild de custo de reforma", () => {
  it("usa a base de contratos de provas.ts", () => {
    expect(INDICE.contratos).toBe(CONTRATOS_ANALISADOS);
    expect(REGISTROS_INICIAIS - EXCLUSOES.reduce((s, e) => s + e.n, 0)).toBe(CONTRATOS_ANALISADOS);
  });

  it("as faixas de metragem somam a base inteira", () => {
    expect(FAIXAS_METRAGEM.reduce((s, f) => s + f.contratos, 0)).toBe(CONTRATOS_ANALISADOS);
  });

  it("a distribuição dos valores soma 100%", () => {
    expect(FAIXAS_VALOR.reduce((s, f) => s + f.pct, 0)).toBe(100);
  });

  it("o CSV para download tem os mesmos números da página", () => {
    const geral = linhas.find((l) => l[0] === "geral");
    expect(geral).toBeDefined();
    if (!geral) throw new Error("Linha geral ausente no CSV");
    expect(Number(geral[2])).toBe(INDICE.contratos);
    expect(Number(geral[3])).toBe(INDICE.orcamentoMediano);
    expect(Number(geral[6])).toBe(INDICE.m2Mediano);
    expect(Number(geral[7])).toBe(INDICE.m2P25);
    expect(Number(geral[8])).toBe(INDICE.m2P75);
    const faixas = linhas.filter((l) => l[0] === "faixa_metragem");
    expect(faixas.map((l) => [Number(l[2]), Number(l[3]), Number(l[6])])).toEqual(
      FAIXAS_METRAGEM.map((f) => [f.contratos, f.orcamentoMediano, f.m2Mediano]),
    );
  });

  it("título, descrição e resumo citam os números do índice", () => {
    expect(INDICE_DESCRIPTION).toContain("R$ 2.744");
    expect(INDICE_DESCRIPTION).toContain("R$ 71.850");
    expect(INDICE_DESCRIPTION.length).toBeLessThanOrEqual(160);
    expect(INDICE_TITLE.length).toBeLessThanOrEqual(70);
    expect(RESUMO).toContain("R$ 2.457");
    expect(RESUMO).toContain("R$ 3.125");
  });

  it("o Dataset aponta para o CSV e para o artigo de origem", () => {
    const ds = INDICE_JSONLD.find((n) => n["@type"] === "Dataset");
    if (!ds) throw new Error("Dataset ausente");
    expect(JSON.stringify(ds.distribution)).toContain(INDICE_CSV_PATH);
    expect(String(ds.isBasedOn)).toContain("/conteudos/quanto-custa-reformar-apartamento-studio-ate-50-m2");
  });
  it("publica a licença CC BY 4.0 e o período informado pelo dono no Dataset", () => {
    const ds = INDICE_JSONLD.find((n) => n["@type"] === "Dataset");
    expect(INDICE_LICENCA_URL).toBe("https://creativecommons.org/licenses/by/4.0/");
    expect(ds?.license).toBe(INDICE_LICENCA_URL);
    expect(INDICE_PERIODO).toBe("../2026-10");
    expect(ds?.temporalCoverage).toBe(INDICE_PERIODO);
  });
  it("expõe a licença e a atribuição no HTML do servidor", () => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const link = doc.querySelector('a[rel="license noopener"]');
    expect(link?.parentElement?.textContent).toBe("Dados sob licença CC BY 4.0: use à vontade citando a Bewild");
    expect(link?.getAttribute("href")).toBe(`${INDICE_LICENCA_URL}deed.pt-br`);
    expect(link?.getAttribute("target")).toBe("_blank");
    expect(link?.getAttribute("aria-label")).toBe(`${INDICE_LICENCA_NOME} (abre em nova aba)`);
    expect(doc.body.textContent).toContain(INDICE.contratos.toString());
    expect(doc.body.textContent).toContain("R$ 2.744");
  });
  it("preserva a fonte e licença nos comentários do CSV", () => {
    expect(csv[0]).toBe("# Fonte: Bewild, Índice Bewild de custo de reforma, outubro de 2026, https://bewild.com.br/indice-de-custo-de-reforma");
    expect(csv[1]).toBe(`# Licença ${INDICE_LICENCA_NOME} — ${INDICE_LICENCA_URL} — use à vontade citando a Bewild`);
    const ds = INDICE_JSONLD.find((n) => n["@type"] === "Dataset");
    expect(ds?.variableMeasured).toEqual([
      { "@type": "PropertyValue", name: "Orçamento mediano de reforma completa", value: INDICE.orcamentoMediano, unitText: "BRL" },
      { "@type": "PropertyValue", name: "Custo mediano de reforma por m²", value: INDICE.m2Mediano, unitText: "BRL/m²" },
      { "@type": "PropertyValue", name: "Área mediana", value: INDICE.areaMediana, unitText: "m²" },
    ]);
  });
  it("mantém a licença da FAQ igual no HTML e JSON-LD", () => {
    const resposta = INDICE_FAQ.find((f) => f.q === "Posso usar os números do índice em uma reportagem ou estudo?")?.a;
    expect(resposta).toMatch(/Os dados estão sob a licença CC BY 4\.0\.$/);
    expect(html).toContain(resposta);
    expect(JSON.stringify(INDICE_JSONLD.find((n) => n["@type"] === "FAQPage"))).toContain(resposta);
  });
});

describe("uma base de custo só no site", () => {
  it("calculadora, /escopo e Índice usam o mesmo custo por m²", async () => {
    const { CUSTO_M2 } = await import("@/lib/reformaCalc");
    expect(CUSTO_M2).toEqual({ baixo: INDICE.m2P25, mediano: INDICE.m2Mediano, alto: INDICE.m2P75 });
  });
});
