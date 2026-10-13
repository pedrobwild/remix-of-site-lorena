/**
 * Índice Bewild de custo de reforma: a página, o CSV para download e o
 * JSON-LD têm de contar a mesma história do artigo pilar (base de 188
 * contratos). Quebrou aqui? Atualize src/content/indiceCusto.ts e o CSV juntos.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

// O módulo usa faqJsonLd (useSeo), que importa o cliente do Supabase.
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
import { CONTRATOS_ANALISADOS } from "@/content/provas";
import {
  FAIXAS_METRAGEM,
  FAIXAS_VALOR,
  INDICE,
  INDICE_CSV_PATH,
  INDICE_DESCRIPTION,
  INDICE_JSONLD,
  INDICE_TITLE,
  EXCLUSOES,
  REGISTROS_INICIAIS,
  RESUMO,
} from "@/content/indiceCusto";

const root = path.resolve(__dirname, "../../..");
const csv = readFileSync(path.join(root, "public", INDICE_CSV_PATH), "utf8").trim().split("\n");
const linhas = csv.slice(1).map((l) => l.split(","));

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
    const geral = linhas.find((l) => l[0] === "geral")!;
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
    const ds = INDICE_JSONLD.find((n) => n["@type"] === "Dataset")!;
    expect(JSON.stringify(ds.distribution)).toContain(INDICE_CSV_PATH);
    expect(String(ds.isBasedOn)).toContain("/conteudos/quanto-custa-reformar-apartamento-studio-ate-50-m2");
  });
});

describe("uma base de custo só no site", () => {
  it("calculadora, /escopo e Índice usam o mesmo custo por m²", async () => {
    const { CUSTO_M2 } = await import("@/lib/reformaCalc");
    expect(CUSTO_M2).toEqual({ baixo: INDICE.m2P25, mediano: INDICE.m2Mediano, alto: INDICE.m2P75 });
  });
});
