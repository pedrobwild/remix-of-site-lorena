/**
 * Site × Radar sem canibalização (17/10/2026): o Radar fica com dados e
 * ferramentas (diária, ocupação, comparador), o site com a análise e a reforma.
 * Cada /reforma/<bairro> aponta para o dado do bairro no Radar, e o link para
 * uma página profunda do Radar não pode ser trocado pela home do Radar.
 */
import { describe, expect, it } from "vitest";
import { BAIRROS_CONTENT } from "@/content/bairros";
import { BASE_CUSTO } from "@/content/baseCusto";
import { RADAR_URL } from "@/config/site";
import { RADAR_RANKING_URL, radarBairroLink, rewriteGuiaLinksInHtml } from "@/lib/radarLinks";

describe("páginas de bairro → Radar", () => {
  it("bairro com dado no Radar aponta para a página do bairro", () => {
    const l = radarBairroLink("pinheiros", "Pinheiros");
    expect(l.href).toBe(`${RADAR_URL}bairro/pinheiros`);
    expect(l.label).toContain("Pinheiros");
  });

  it("bairro sem dado no Radar aponta para o comparador", () => {
    for (const slug of ["butanta", "higienopolis", "paulista", "vila-madalena", "vila-clementino", "santo-amaro", "campo-belo", "vila-nova-conceicao"]) {
      expect(radarBairroLink(slug, slug).href, slug).toBe(RADAR_RANKING_URL);
    }
  });

  it("todo bairro com texto próprio ganha um link para o Radar", () => {
    for (const slug of Object.keys(BAIRROS_CONTENT)) {
      expect(radarBairroLink(slug, slug).href.startsWith(RADAR_URL), slug).toBe(true);
    }
  });
});

describe("links do Radar dentro dos artigos", () => {
  it("link para uma página do Radar mantém a página (não vira a home)", () => {
    const html = rewriteGuiaLinksInHtml(`<p><a href="${RADAR_RANKING_URL}">comparador</a></p>`);
    expect(html).toContain(`href="${RADAR_RANKING_URL}" target="_blank" rel="noopener"`);
  });

  it("endereço antigo do guia continua indo para a home do Radar", () => {
    const html = rewriteGuiaLinksInHtml('<p><a href="/guia-do-investidor#faq">guia</a></p>');
    expect(html).toContain(`href="${RADAR_URL}"`);
  });
});

describe("custo nas páginas de bairro", () => {
  it.each(Object.entries(BAIRROS_CONTENT))("%s usa apenas os valores da base única de contratos", (slug, content) => {
    const custo = content.faq.find(faq => faq.q.startsWith("Quanto custa"))?.a ?? "";
    const reais = [...custo.matchAll(/R\$\s*([\d.]+)/g)].map(match => Number(match[1].replaceAll(".", "")));
    expect(reais, slug).toEqual([BASE_CUSTO.m2Mediano, BASE_CUSTO.orcamentoMediano]);
    const contratos = custo.match(/analisa (\d+) contratos/);
    expect(Number(contratos?.[1]), slug).toBe(BASE_CUSTO.contratos);
    const valoresIntro = [...content.intro.join(" ").matchAll(/R\$\s*([\d.]+) por m²/g)].map(match => Number(match[1].replaceAll(".", "")));
    for (const valor of valoresIntro) expect(valor, slug).toBe(BASE_CUSTO.m2Mediano);
  });
});
