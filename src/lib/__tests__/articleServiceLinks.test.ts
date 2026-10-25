import { describe, expect, it } from "vitest";
import { linkServicePagesInHtml } from "@/lib/articleServiceLinks";

describe("linkServicePagesInHtml", () => {
  it("liga a primeira menção no texto corrido a cada página de serviço", () => {
    const html =
      "<p>Uma reforma de studio leva 60 dias. Outra reforma de studio também.</p><p>Quem vai reformar um apartamento maior precisa de mais tempo.</p>";
    const out = linkServicePagesInHtml(html);
    expect(out).toBe(
      '<p>Uma <a href="/reforma-de-studio-sao-paulo">reforma de studio</a> leva 60 dias. Outra reforma de studio também.</p><p>Quem vai <a href="/reforma-de-apartamento-sao-paulo">reformar um apartamento</a> maior precisa de mais tempo.</p>',
    );
  });

  it("os dois destinos podem cair no mesmo parágrafo", () => {
    const out = linkServicePagesInHtml("<p>A reforma de apartamento e a reforma de studio seguem o mesmo método.</p>");
    expect(out).toContain('<a href="/reforma-de-apartamento-sao-paulo">reforma de apartamento</a>');
    expect(out).toContain('<a href="/reforma-de-studio-sao-paulo">reforma de studio</a>');
  });

  it("não mexe em título, tabela, legenda, citação nem dentro de link", () => {
    const html = [
      "<h2>Reforma de studio em SP</h2>",
      "<table><tr><td>reforma de studio</td></tr></table>",
      "<figure><figcaption>reforma de apartamento</figcaption></figure>",
      "<blockquote><p>reforma de apartamento</p></blockquote>",
      '<p><a href="/orcamento">reforma de studio</a></p>',
    ].join("");
    expect(linkServicePagesInHtml(html)).toBe(html);
  });

  it("não repete destino que o artigo já linka", () => {
    const html = '<p>Veja a <a href="/reforma-de-studio-sao-paulo">página</a>. Uma reforma de studio custa…</p>';
    expect(linkServicePagesInHtml(html)).toBe(html);
    const abs = '<p>Veja <a href="https://bewild.com.br/reforma-de-apartamento-sao-paulo">aqui</a>; reforma de apartamento.</p>';
    expect(linkServicePagesInHtml(abs)).toBe(abs);
  });

  it("palavra inteira: 'reformas de studios' vale, 'prereforma' não", () => {
    expect(linkServicePagesInHtml("<li>reformas de studios em SP</li>")).toContain(
      '<a href="/reforma-de-studio-sao-paulo">reformas de studios</a>',
    );
    expect(linkServicePagesInHtml("<p>contrareforma de studio</p>")).toBe("<p>contrareforma de studio</p>");
  });

  it("texto fora de <p>/<li> fica como está", () => {
    expect(linkServicePagesInHtml("reforma de studio solta")).toBe("reforma de studio solta");
  });
});
