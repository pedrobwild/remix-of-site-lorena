import { describe, expect, it } from "vitest";
import { marked } from "marked";
import { sanitizeBlogHtml } from "../sanitizeHtml";
import { tableWrapOpen, wrapArticleTables } from "../articleTables";

const T = "<table><thead><tr><th>Item</th><th>Valor</th></tr></thead><tbody><tr><td>Obra</td><td>R$ 1</td></tr></tbody></table>";

describe("wrapArticleTables", () => {
  it("envolve cada tabela numa região rolável, focável e com nome próprio", () => {
    const html = `<p>antes</p>${T}<p>meio</p>${T}<p>depois</p>`;
    expect(wrapArticleTables(html)).toBe(
      `<p>antes</p>${tableWrapOpen(1)}${T}</div><p>meio</p>${tableWrapOpen(2)}${T}</div><p>depois</p>`,
    );
    expect(tableWrapOpen(1)).toContain('class="pt-table-wrap"');
    expect(tableWrapOpen(1)).toContain('tabindex="0"');
    expect(tableWrapOpen(1)).toContain('role="region"');
    // Nome neutro (vale também onde a tabela cabe inteira) e diferente por tabela.
    expect(tableWrapOpen(1)).toContain('aria-label="Tabela 1"');
    expect(tableWrapOpen(2)).toContain('aria-label="Tabela 2"');
  });

  it("não mexe em HTML sem tabela", () => {
    const html = "<h2>Título</h2><p>Sem tabela, mas com a palavra tablete.</p>";
    expect(wrapArticleTables(html)).toBe(html);
    expect(wrapArticleTables("")).toBe("");
  });

  it("tabela dentro de tabela: só a de fora ganha a região", () => {
    const nested = `<table><tr><td>${T}</td></tr></table>`;
    expect(wrapArticleTables(nested)).toBe(`${tableWrapOpen(1)}${nested}</div>`);
    // A de dentro não entra na contagem: a próxima de fora é a 2.
    expect(wrapArticleTables(nested + T)).toBe(`${tableWrapOpen(1)}${nested}</div>${tableWrapOpen(2)}${T}</div>`);
  });

  it("aceita atributos e maiúsculas na tag", () => {
    const html = '<TABLE class="x"><tr><td>a</td></tr></TABLE>';
    expect(wrapArticleTables(html)).toBe(`${tableWrapOpen(1)}${html}</div>`);
  });

  it("`<table` ou `>` dentro de um atributo não é tag", () => {
    const img = '<p><img src="/a.png" alt="exemplo de <table> em HTML"></p>';
    expect(wrapArticleTables(img + T)).toBe(`${img}${tableWrapOpen(1)}${T}</div>`);
    const withGt = '<table data-nota="a > b"><tr><td title=\'x > y\'>a</td></tr></table>';
    expect(wrapArticleTables(withGt)).toBe(`${tableWrapOpen(1)}${withGt}</div>`);
    // Outras tags que começam com "table" não contam.
    expect(wrapArticleTables("<tablex></tablex>")).toBe("<tablex></tablex>");
  });

  it("HTML truncado (tabela sem fechamento) não deixa a região aberta", () => {
    expect(wrapArticleTables("<p>a</p><table><tr><td>x")).toBe(`<p>a</p>${tableWrapOpen(1)}<table><tr><td>x</div>`);
    expect(wrapArticleTables("</table><p>solto</p>")).toBe("</table><p>solto</p>");
  });

  it("no caminho real (Markdown → HTML limpo → região) a tabela sai inteira dentro da região", () => {
    const md = "Antes.\n\n| Item | Valor |\n| --- | --- |\n| Obra | R$ 1 |\n\nDepois de `<table>` citado em código.";
    const html = wrapArticleTables(sanitizeBlogHtml(marked.parse(md, { async: false }) as string));
    const doc = new DOMParser().parseFromString(html, "text/html");
    const regions = doc.querySelectorAll(".pt-table-wrap");
    expect(regions).toHaveLength(1);
    expect(regions[0].getAttribute("aria-label")).toBe("Tabela 1");
    expect(regions[0].children).toHaveLength(1);
    expect(regions[0].firstElementChild?.tagName).toBe("TABLE");
    expect(regions[0].querySelectorAll("td")).toHaveLength(2);
    // O texto fora da tabela continua fora da região.
    expect(regions[0].textContent).not.toContain("Antes");
    expect(regions[0].textContent).not.toContain("Depois");
  });
});
