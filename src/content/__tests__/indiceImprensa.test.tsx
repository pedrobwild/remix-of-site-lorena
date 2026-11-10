/**
 * Bloco "Para imprensa" de /indice-de-custo-de-reforma: tem de sair no HTML do
 * servidor (jornalista, Bing e robôs de IA leem sem JS), com números que são
 * exatamente os de src/content/indiceCusto.ts / baseCusto.ts, a frase de fonte
 * pronta, o link para /atribuicao, a planilha e o código de incorporação dos
 * gráficos (SVG estáticos que já existem em public/) com link de atribuição.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
vi.mock("@/components/BwaNav", () => ({ default: () => null }));
vi.mock("@/components/BwaFooter", () => ({ default: () => null }));
vi.mock("@/lib/trackCta", () => ({ useCtaClickTracking: () => {} }));
vi.mock("@/lib/useSeo", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/useSeo")>()),
  useSeo: () => {},
}));
import IndiceCustoPage from "@/pages/IndiceCustoPage";
import AtribuicaoPage from "@/pages/AtribuicaoPage";
import { brl } from "@/content/baseCusto";
import {
  COMPOSICAO,
  FAIXAS_METRAGEM,
  FAIXAS_VALOR,
  INDICE,
  INDICE_ATUALIZADO_EM,
  INDICE_CSV_PATH,
  INDICE_EDICAO,
} from "@/content/indiceCusto";

const raiz = path.resolve(__dirname, "../../..");
const doc = new DOMParser().parseFromString(
  renderToString(createElement(IndiceCustoPage)),
  "text/html"
);
const bloco = doc.getElementById("imprensa")?.closest("section");
const texto = (el: Element | null | undefined) =>
  (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const dataBR = INDICE_ATUALIZADO_EM.split("-").reverse().join("/");
const URL_INDICE = "https://bewild.com.br/indice-de-custo-de-reforma";

describe("Para imprensa no HTML do servidor", () => {
  it("existe, com título e âncora #imprensa ligada no topo da página", () => {
    expect(bloco).toBeTruthy();
    expect(texto(doc.getElementById("imprensa"))).toBe("Para imprensa");
    expect(doc.querySelector('.bwa-servico-intro a[href="#imprensa"]')).toBeTruthy();
  });

  it("traz 3 números citáveis, cada um com a edição, a data e o método em uma frase", () => {
    const itens = [...(bloco?.querySelectorAll("[data-imprensa-numero]") ?? [])];
    expect(itens).toHaveLength(3);
    for (const item of itens) {
      const t = texto(item);
      expect(t).toContain(`Edição de ${INDICE_EDICAO}`);
      expect(t).toContain(dataBR);
      const metodo = texto(item.querySelector("[data-imprensa-metodo]"));
      expect(metodo).toMatch(/^Método: /);
      // Uma frase só: um ponto final, no fim.
      expect(metodo.replace(/\d\.\d/g, "").match(/\.(\s|$)/g)).toHaveLength(1);
    }
  });

  it("os números são os de indiceCusto.ts/baseCusto.ts (sem variação entre edições)", () => {
    const valores = [...(bloco?.querySelectorAll("[data-imprensa-valor]") ?? [])].map(texto);
    const maisCara = FAIXAS_METRAGEM.reduce((a, b) => (b.m2Mediano > a.m2Mediano ? b : a));
    const maisBarata = FAIXAS_METRAGEM.reduce((a, b) => (b.m2Mediano < a.m2Mediano ? b : a));
    expect(valores).toEqual([
      `${brl(INDICE.m2Mediano)} por m²`,
      brl(INDICE.orcamentoMediano),
      `${brl(maisCara.m2Mediano)} por m²`,
    ]);
    const t = texto(bloco);
    expect(t).toContain(`${brl(INDICE.m2P25)} e ${brl(INDICE.m2P75)}`);
    expect(t).toContain(`${INDICE.areaMediana.toLocaleString("pt-BR")} m²`);
    expect(t).toContain(brl(maisBarata.m2Mediano));
    expect(t).toContain(`${maisCara.contratos} contratos`);
    expect(t).toContain(`${maisBarata.contratos} contratos`);
    expect(t).toContain(`${INDICE.contratos} contratos`);
    // Só há uma edição no arquivo: nenhuma comparação no tempo.
    expect(t).not.toMatch(/varia(ção|ou)|edição anterior|em relação a setembro/i);
  });

  it("frase de fonte pronta para copiar e link para /atribuicao", () => {
    const frase = `Fonte: Índice Bewild de Custo de Reforma, edição ${INDICE_EDICAO}, base de ${INDICE.contratos} contratos, bewild.com.br/indice-de-custo-de-reforma`;
    expect(texto(bloco?.querySelector("#imprensa-fonte"))).toBe(frase);
    expect(bloco?.querySelector('button[data-cta="indice-imprensa-copiar-fonte"]')).toBeTruthy();
    expect(bloco?.querySelector('a[href="/atribuicao"]')).toBeTruthy();
  });

  it("planilha: o CSV existente, para baixar", () => {
    const csv = bloco?.querySelector(`a[href="${INDICE_CSV_PATH}"]`);
    expect(csv?.hasAttribute("download")).toBe(true);
    expect(texto(csv)).toMatch(/planilha/i);
    expect(existsSync(path.join(raiz, "public", INDICE_CSV_PATH))).toBe(true);
  });

  it("código de incorporação: SVG estático do site + link de atribuição para a página", () => {
    const areas = [...(bloco?.querySelectorAll("textarea") ?? [])];
    expect(areas).toHaveLength(2);
    for (const area of areas) {
      expect(area.hasAttribute("readonly")).toBe(true);
      expect(doc.querySelector(`label[for="${area.id}"]`)).toBeTruthy();
      const embed = new DOMParser().parseFromString(area.value, "text/html");
      const img = embed.querySelector("img");
      const src = img?.getAttribute("src") ?? "";
      expect(src.startsWith("https://bewild.com.br/images/")).toBe(true);
      const arquivo = path.join(raiz, "public", new URL(src).pathname);
      expect(existsSync(arquivo)).toBe(true);
      const svg = readFileSync(arquivo, "utf8");
      expect(svg).toContain(`width="${img?.getAttribute("width")}"`);
      expect(svg).toContain(`height="${img?.getAttribute("height")}"`);
      const alt = img?.getAttribute("alt") ?? "";
      expect(alt.length).toBeGreaterThan(40);
      expect(alt).not.toMatch(/(^|\s)r\$/);
      // A Bewild emite RRT: o texto alternativo segue o rótulo do SVG ("ART/RRT").
      expect(alt).not.toMatch(/\bART(?!\/RRT)/);
      const link = [...embed.querySelectorAll("a")].find(
        (a) => a.textContent === "Índice Bewild de Custo de Reforma"
      );
      expect(link?.getAttribute("href")).toBe(URL_INDICE);
      expect(embed.querySelector('a[rel="license"]')?.getAttribute("href")).toBe(
        "https://creativecommons.org/licenses/by/4.0/"
      );
      expect(embed.body.textContent).toContain(`edição ${INDICE_EDICAO}`);
    }
  });

  it("os SVG incorporados mostram os mesmos números de indiceCusto.ts", () => {
    const fontes = [...(bloco?.querySelectorAll("textarea") ?? [])].map((a) => {
      const src = new DOMParser()
        .parseFromString(a.value, "text/html")
        .querySelector("img")
        ?.getAttribute("src");
      return readFileSync(path.join(raiz, "public", new URL(String(src)).pathname), "utf8");
    });
    const [distribuicao, composicao] = fontes;
    for (const f of FAIXAS_VALOR) expect(distribuicao).toContain(`>${f.pct}%<`);
    expect(distribuicao).toContain(`${INDICE.contratos} contratos`);
    for (const c of COMPOSICAO)
      expect(composicao).toContain(`R$ ${c.pct.toFixed(1).replace(".", ",")}<`);
  });

  it("o gráfico da proposta real não é atribuído à base de contratos", () => {
    const [, composicao] = [...(bloco?.querySelectorAll("textarea") ?? [])].map(
      (a) => new DOMParser().parseFromString(a.value, "text/html").body.textContent ?? ""
    );
    expect(composicao).toContain("proposta real");
    expect(composicao).not.toContain("contratos");
  });
});

describe("/atribuicao aponta para o kit de imprensa", () => {
  it("link para /indice-de-custo-de-reforma#imprensa no HTML do servidor", () => {
    const html = renderToString(createElement(AtribuicaoPage));
    const a = new DOMParser()
      .parseFromString(html, "text/html")
      .querySelector('a[href="/indice-de-custo-de-reforma#imprensa"]');
    expect(a).toBeTruthy();
  });
});
