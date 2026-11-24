/**
 * Gráficos do Perfil Bewild: os arquivos de public/images/blog/<slug>/, a lista
 * de src/content/perfilGraficos.ts, o conjunto de /graficos/<slug> e a página do
 * estudo têm de contar a mesma história dos dados. Quebrou aqui? Rode
 * `python3 scripts/graficos/perfil_quem_reforma_2026_11.py --og` e atualize as
 * alturas em perfilGraficos.ts.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
vi.mock("@/components/BwaNav", () => ({ default: () => null }));
vi.mock("@/components/BwaFooter", () => ({ default: () => null }));
vi.mock("@/lib/trackCta", () => ({ useCtaClickTracking: () => {} }));
vi.mock("@/lib/useSeo", async (importOriginal) => ({ ...await importOriginal<typeof import("@/lib/useSeo")>(), useSeo: () => {} }));
import PerfilReformaPage from "@/pages/PerfilReformaPage";
import { chartSetForSlug } from "@/content/chartSets";
import {
  perfilGrafico,
  perfilGraficoEmbedHtml,
  perfilGraficoSrc,
  PERFIL_GRAFICO_LARGURA_CELULAR,
  PERFIL_GRAFICOS,
  PERFIL_GRAFICOS_IMPRENSA,
  PERFIL_GRAFICOS_PAGINA,
  PERFIL_GRAFICOS_SLUG,
} from "@/content/perfilGraficos";
import {
  ALUGAR_PCT,
  FORA_PCT,
  PERFIL,
  PERFIL_NOME,
  PERFIL_OG_IMAGE,
  PERFIL_REVISOR,
  PERFIL_TITLE,
  PERFIL_URL_ABSOLUTA,
  RENDA_ALUGAR_PCT,
  RENDA_MORAR_PCT,
  SEM_CHAVE_PCT,
} from "@/content/perfilReforma";

const root = path.resolve(__dirname, "../../..");
const ler = (publico: string) => readFileSync(path.join(root, "public", publico), "utf8");
const semEntidades = (s: string) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

describe("Perfil Bewild: gráficos e infográficos", () => {
  it.each(PERFIL_GRAFICOS)("$file existe nas duas versões, com título e dimensões da lista", (g) => {
    const largo = ler(perfilGraficoSrc(g, "desktop"));
    const celular = ler(perfilGraficoSrc(g, "mobile"));
    expect(largo).toContain(`width="${g.largura}" height="${g.altura}"`);
    expect(celular).toContain(`width="${PERFIL_GRAFICO_LARGURA_CELULAR}" height="${g.alturaM}"`);
    // Leitura no celular: sem margem interna larga e sem texto menor que 12 unidades.
    expect(celular).toContain(`viewBox="20 0 ${PERFIL_GRAFICO_LARGURA_CELULAR} `);
    const tamanhos = [...celular.matchAll(/font-size="([\d.]+)"/g)].map((m) => Number(m[1]));
    expect(Math.min(...tamanhos)).toBeGreaterThanOrEqual(12);
    for (const svg of [largo, celular]) {
      expect(semEntidades(svg)).toContain(`<title id="t">${g.titulo}</title>`);
      expect(svg).toContain("<desc id=\"d\">");
      expect(svg).toContain("bewild.com.br");
      // SVG usado como <img>: nada de script nem de recurso externo.
      expect(svg).not.toMatch(/<script|href=|url\(/);
    }
  });

  it("os números dos gráficos são os do estudo", () => {
    // Texto do SVG sem as tags: os títulos quebram em mais de um <text>.
    const svg = (id: string) =>
      semEntidades(ler(perfilGraficoSrc(perfilGrafico(id), "desktop")).replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ");
    expect(svg("finalidade")).toContain(`${ALUGAR_PCT}% reformam para alugar`);
    expect(svg("origem")).toContain(`${FORA_PCT}% têm telefone de fora`);
    expect(svg("chaves")).toContain(`${SEM_CHAVE_PCT}% pedem o orçamento`);
    expect(svg("temas")).toContain(`Renda: ${RENDA_ALUGAR_PCT}% de quem vai alugar, ${RENDA_MORAR_PCT}% de quem vai morar`);
    expect(svg("metodo")).toContain(`De ${PERFIL.base.negociosIniciais} negócios`);
    expect(svg("metodo")).toContain(`${PERFIL.base.pedidos} orçamentos`);
    expect(svg("resumo")).toContain(`${PERFIL.base.pedidos} orçamentos`);
    for (const b of PERFIL.bairros.itens) expect(svg("bairros")).toContain(`${b.bairro} ${b.pedidos}`);
    for (const g of PERFIL_GRAFICOS) expect(svg(g.id)).toContain(`${PERFIL.base.pedidos} orçamentos`);
  });

  it("o conjunto de /graficos/<slug> lista os mesmos arquivos e títulos", () => {
    const set = chartSetForSlug(PERFIL_GRAFICOS_SLUG);
    expect(set).not.toBeNull();
    expect(PERFIL_GRAFICOS_PAGINA).toBe(`/graficos/${PERFIL_GRAFICOS_SLUG}`);
    expect(set?.charts.map((c) => [c.id, c.file, c.title])).toEqual(PERFIL_GRAFICOS.map((g) => [g.id, g.file, g.titulo]));
  });

  it("a imagem de compartilhamento existe e mede 1200×630", () => {
    const caminho = path.join(root, "public", new URL(PERFIL_OG_IMAGE).pathname);
    expect(existsSync(caminho)).toBe(true);
    const png = readFileSync(caminho);
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
  });

  it("o título da página leva o nome do estudo e cabe no limite", () => {
    expect(PERFIL_TITLE.startsWith(PERFIL_NOME)).toBe(true);
    expect(PERFIL_TITLE.length).toBeLessThanOrEqual(60);
  });

  it("a página mostra os gráficos, o crédito de revisão e o código de incorporação", () => {
    const html = renderToStaticMarkup(createElement(PerfilReformaPage));
    const figuras = [...html.matchAll(/data-perfil-grafico="([a-z]+)"/g)].map((m) => m[1]);
    expect(figuras).toEqual(["perfis", "origem", "regioes", "bairros", "temas", "metodo", "resumo"]);
    for (const id of figuras) {
      const g = perfilGrafico(id);
      expect(html).toContain(`src="${perfilGraficoSrc(g, "desktop")}"`);
      expect(html).toContain(`srcSet="${perfilGraficoSrc(g, "mobile")}" width="${PERFIL_GRAFICO_LARGURA_CELULAR}" height="${g.alturaM}"`);
    }
    expect(html).toContain("Revisão técnica:");
    expect(html).toContain(PERFIL_REVISOR.nome);
    expect(html).toContain("CAU A162437-7");
    expect(html).toContain(`href="${PERFIL_GRAFICOS_PAGINA}"`);
    for (const g of PERFIL_GRAFICOS_IMPRENSA) {
      const codigo = perfilGraficoEmbedHtml(g);
      expect(codigo).toContain(`https://bewild.com.br${perfilGraficoSrc(g, "desktop")}`);
      expect(codigo).toContain(PERFIL_URL_ABSOLUTA);
      expect(html).toContain(`id="embed-${g.id}"`);
    }
  });
});
