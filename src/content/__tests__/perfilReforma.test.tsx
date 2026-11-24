/**
 * Perfil Bewild de Quem Reforma Studio: a página, os CSV para download e o
 * JSON-LD têm de contar a mesma história (584 orçamentos de reforma completa,
 * pela regra de amostra do Índice Bewild, edição de novembro de 2026). Quebrou aqui? Atualize
 * src/content/perfilReforma.dados.json e os CSV de public/dados juntos.
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
import PerfilReformaPage from "@/pages/PerfilReformaPage";
import {
  ALUGAR_PCT,
  FORA_PCT,
  PERFIL,
  PERFIL_CANONICAL,
  PERFIL_COMO_CITAR,
  PERFIL_CSV_PATH,
  PERFIL_DESCRIPTION,
  PERFIL_DICIONARIO_PATH,
  PERFIL_FAQ,
  PERFIL_FRASE_FONTE,
  PERFIL_IMPRENSA_NUMEROS,
  PERFIL_JSONLD,
  PERFIL_LICENCA_URL,
  PERFIL_PERIODO,
  PERFIL_RESUMO,
  PERFIL_TITLE,
  SEM_CHAVE_PCT,
} from "@/content/perfilReforma";

const root = path.resolve(__dirname, "../../..");
const lerCsv = (p: string) => readFileSync(path.join(root, "public", p), "utf8").trim().split("\n");
const csv = lerCsv(PERFIL_CSV_PATH);
const linhas = csv.filter((l) => !l.startsWith("#")).slice(1).map((l) => l.split(","));
const html = renderToStaticMarkup(createElement(PerfilReformaPage));
const texto = html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");
const soma = <T,>(itens: T[], campo: (i: T) => number) => itens.reduce((s, i) => s + campo(i), 0);

describe("Perfil Bewild de Quem Reforma Studio", () => {
  it("o funil de exclusões fecha na amostra", () => {
    expect(PERFIL.base.negociosIniciais - soma(PERFIL.exclusoes, (e) => e.n)).toBe(PERFIL.base.pedidos);
    expect(PERFIL.base.pessoas).toBeLessThanOrEqual(PERFIL.base.pedidos);
  });

  it("cada distribuição soma a própria base", () => {
    expect(soma(PERFIL.finalidade.itens, (i) => i.pessoas)).toBe(PERFIL.finalidade.base);
    expect(soma(PERFIL.origem.itens, (i) => i.pessoas)).toBe(PERFIL.origem.base);
    expect(PERFIL.metragem.ate30).toBeLessThanOrEqual(PERFIL.metragem.base);
    expect(soma(PERFIL.chaves.itens, (i) => i.pessoas)).toBe(PERFIL.chaves.base);
    expect(soma(PERFIL.regioes.itens, (i) => i.pedidos)).toBe(PERFIL.regioes.base);
    expect(soma(PERFIL.perfis.itens, (i) => i.pessoas)).toBe(PERFIL.perfis.base);
    expect(PERFIL.perfis.base + PERFIL.perfis.semFinalidade + PERFIL.perfis.semTelefone).toBe(PERFIL.base.pessoas);
  });

  it("nenhuma base publicada fica abaixo da regra de publicação", () => {
    expect(PERFIL.bairros.itens.every((b) => b.pedidos >= PERFIL.bairros.minimo)).toBe(true);
    expect(PERFIL.foraPorFinalidade.every((f) => f.base >= 25 && f.fora <= f.base)).toBe(true);
    expect(PERFIL.conversas.temas.every((t) => t.alugar <= PERFIL.conversas.alugar && t.morar <= PERFIL.conversas.morar)).toBe(true);
    expect(PERFIL.reunioes.itens.every((r) => r.negocios <= PERFIL.reunioes.negocios)).toBe(true);
    for (const l of linhas) expect(Number(l[4]), l.join(",")).toBeGreaterThanOrEqual(25);
  });

  it("os números de cabeçalho saem dos dados", () => {
    expect(ALUGAR_PCT).toBe(79);
    expect(FORA_PCT).toBe(49);
    expect(SEM_CHAVE_PCT).toBe(62);
    expect(PERFIL_RESUMO).toContain("584 orçamentos de 507 pessoas");
    expect(PERFIL_RESUMO).toContain("79% vão alugar");
  });

  it("título e descrição cabem no resultado de busca", () => {
    expect(PERFIL_TITLE.length).toBeLessThanOrEqual(60);
    expect(PERFIL_DESCRIPTION.length).toBeLessThanOrEqual(160);
  });

  it("o CSV para download tem os mesmos números da página", () => {
    expect(csv[0]).toContain(`https://bewild.com.br${PERFIL_CANONICAL}`);
    expect(csv[1]).toContain(PERFIL_LICENCA_URL);
    for (const l of linhas) expect(l.length, l.join(",")).toBe(7);
    const linha = (indicador: string, grupo: string) => {
      const l = linhas.find((x) => x[1] === indicador && x[2] === grupo);
      if (!l) throw new Error(`Linha ausente no CSV: ${indicador} / ${grupo}`);
      return { casos: Number(l[3]), base: Number(l[4]), pct: Number(l[5]) };
    };
    for (const f of PERFIL.finalidade.itens) {
      const l = linha("Finalidade declarada", f.rotulo);
      expect(l.casos).toBe(f.pessoas);
      expect(l.base).toBe(PERFIL.finalidade.base);
    }
    expect(Math.round(linha("Finalidade declarada", "Alugar (temporada + tradicional)").pct)).toBe(ALUGAR_PCT);
    expect(Math.round(linha("Telefone de fora da capital e da Grande SP", "Todos").pct)).toBe(FORA_PCT);
    for (const b of PERFIL.bairros.itens) expect(linha("Orçamentos por bairro (15 ou mais)", b.bairro).casos).toBe(b.pedidos);
  });

  it("não publica volume por canal de captação", () => {
    const publico = [csv.join("\n"), lerCsv(PERFIL_DICIONARIO_PATH).join("\n")].join("\n").toLowerCase();
    expect(publico).not.toMatch(/an[uú]ncio|canal|google|meta ads/);
    // Contagens por canal e cadastros da plataforma de anúncios (análise de 24/11/2026).
    for (const n of ["1.253", "2.679", "1.304"]) expect(texto).not.toContain(n);
  });

  it("a página traz o resumo, o kit de imprensa, as planilhas e a licença", () => {
    expect(texto).toContain(PERFIL_RESUMO);
    expect(texto).toContain(PERFIL_FRASE_FONTE);
    expect(texto).toContain(PERFIL_COMO_CITAR);
    for (const n of PERFIL_IMPRENSA_NUMEROS) {
      expect(texto).toContain(n.valor);
      expect(texto).toContain(n.metodo);
    }
    expect(html).toContain(`href="${PERFIL_CSV_PATH}"`);
    expect(html).toContain(`href="${PERFIL_DICIONARIO_PATH}"`);
    expect(html).toContain('rel="license"');
    expect(html).toContain('href="/indice-de-custo-de-reforma"');
    for (const f of PERFIL_FAQ) expect(texto).toContain(f.q);
    expect(texto).toContain("Não é uma amostra do mercado");
  });

  it("os percentuais desenhados em barra ficam entre 0 e 100", () => {
    const larguras = [...html.matchAll(/style="width:(\d+(?:\.\d+)?)%"/g)].map((m) => Number(m[1]));
    expect(larguras.length).toBe(PERFIL.finalidade.itens.length + PERFIL.chaves.itens.length);
    expect(larguras.every((w) => w >= 0 && w <= 100)).toBe(true);
  });

  it("o JSON-LD descreve o conjunto de dados que a página mostra", () => {
    const dataset = PERFIL_JSONLD.find((n) => n["@type"] === "Dataset") as Record<string, unknown>;
    expect(dataset.license).toBe(PERFIL_LICENCA_URL);
    expect(dataset.temporalCoverage).toBe(PERFIL_PERIODO);
    expect(JSON.stringify(dataset.distribution)).toContain(PERFIL_CSV_PATH);
    expect(JSON.stringify(dataset.variableMeasured)).toContain(`"value":${ALUGAR_PCT}`);
    const faq = PERFIL_JSONLD.find((n) => n["@type"] === "FAQPage") as { mainEntity: unknown[] };
    expect(faq.mainEntity.length).toBe(PERFIL_FAQ.length);
  });
});
