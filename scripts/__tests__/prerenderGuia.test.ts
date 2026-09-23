import { describe, expect, it } from "vitest";
import { renderGuiaHtml } from "../prerenderGuia";
import { BAIRROS } from "../../src/guia/data/bairros";
import { CHECKLIST_ITEMS } from "../../src/guia/data/checklist";
import {
  GUIA_DESCRIPTION,
  GUIA_FAQ,
  GUIA_MODIFIED,
  GUIA_TITLE,
} from "../../src/guia/data/guiaMeta";

const BASE_HTML = `<!doctype html><html><head>
<title>Padrão</title>
<meta name="description" content="padrão" />
<link rel="canonical" href="https://bewild.com.br/" />
<meta property="og:title" content="padrão" />
</head><body><div id="root"></div></body></html>`;

const attr = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

describe("pré-render do /guia-do-investidor", () => {
  const html = renderGuiaHtml(BASE_HTML);

  it("usa o mesmo título, descrição e canonical da SPA (guiaMeta.ts)", () => {
    expect(html).toContain(`<title>${attr(GUIA_TITLE)}</title>`);
    expect(html).toContain(`<meta name="description" content="${attr(GUIA_DESCRIPTION)}" />`);
    expect(html).toContain('<link rel="canonical" href="https://bewild.com.br/guia-do-investidor" />');
  });

  it("JSON-LD marcado com data-seo-managed e com a data de modificação real", () => {
    const blocos = [...html.matchAll(/<script type="application\/ld\+json"([^>]*)>([\s\S]*?)<\/script>/g)];
    expect(blocos).toHaveLength(3);
    for (const [, atributos] of blocos) expect(atributos).toContain('data-seo-managed="true"');
    const article = JSON.parse(blocos[0][2]);
    expect(article.dateModified).toBe(GUIA_MODIFIED);
    const faq = JSON.parse(blocos[2][2]);
    expect(faq.mainEntity).toHaveLength(GUIA_FAQ.length);
  });

  it("a tabela de bairros tem uma linha por bairro da base única", () => {
    const tabela = html.match(/<h3>Diária e ocupação por bairro<\/h3><table>([\s\S]*?)<\/table>/)?.[1] ?? "";
    const linhas = tabela.match(/<th scope="row">/g) ?? [];
    expect(linhas).toHaveLength(BAIRROS.length);
    // pt-BR e "—" onde não há recorte por metragem
    expect(tabela).toContain("<th scope=\"row\">Pinheiros</th><td>R$ 320</td><td>R$ 480</td><td>82%</td>");
    expect(tabela).toContain("<th scope=\"row\">Itaquera</th>");
    expect(tabela).toContain("<td>—</td>");
  });

  it("checklist e FAQ vêm dos módulos compartilhados", () => {
    for (const item of CHECKLIST_ITEMS) expect(html).toContain(`<li>${attr(item)}</li>`);
    expect(html).toContain("Pronto para investir");
    for (const f of GUIA_FAQ) expect(html).toContain(`<h3>${attr(f.q)}</h3>`);
  });

  it("não sobra texto do app antigo nem decimal com ponto", () => {
    expect(html).not.toContain("guiadoinvestidor");
    expect(html).not.toMatch(/\b1\.(0|2|45)×/);
    expect(html).not.toContain("Cada nível é cumulativo");
    expect(html).not.toContain("sazonalidade, perfil");
  });
});
