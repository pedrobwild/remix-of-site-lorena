import { describe, expect, it } from "vitest";
import { AVISO_AFILIADO, type ProdutoAfiliado } from "@/lib/afiliados";
import { affiliateCardHtml, applyAffiliates } from "@/lib/articleAffiliates";

const tv: ProdutoAfiliado = {
  id: "1",
  slug: "smart-tv-43",
  nome: 'Smart TV 43"',
  motivo: "Tamanho certo para studio.",
  categoria: "Eletros grandes",
  perfil: "ambos",
  link_afiliado: "https://meli.la/1VF4Tbq",
  imagem_url: null,
  imagem_alt: null,
  projeto_slug: null,
  ativo: true,
  sort_order: 0,
};

describe("applyAffiliates: marcação [[produto:slug]]", () => {
  it("troca a marcação pelo cartão", () => {
    const out = applyAffiliates("<p>Antes</p><p>[[produto:smart-tv-43]]</p><p>Depois</p>", [tv]);
    expect(out).toContain('href="https://meli.la/1VF4Tbq"');
    expect(out).toContain('rel="sponsored nofollow noopener"');
    expect(out).toContain('target="_blank"');
    expect(out).toContain('data-afiliado="smart-tv-43"');
    expect(out).toContain('data-cta="afiliado-smart-tv-43"');
    expect(out).toContain(AVISO_AFILIADO);
    expect(out).not.toContain("[[produto:");
    expect(out).not.toContain("<p></p>");
    expect(out.startsWith("<p>Antes</p><aside")).toBe(true);
    expect(out.endsWith("</aside><p>Depois</p>")).toBe(true);
  });

  it("produto inexistente: a marcação some sem deixar parágrafo vazio", () => {
    expect(applyAffiliates("<p>A</p><p>[[produto:nao-existe]]</p><p>B</p>", [tv])).toBe("<p>A</p><p>B</p>");
  });

  it("produto desligado: a marcação some", () => {
    expect(applyAffiliates("<p>[[produto:smart-tv-43]]</p>", [{ ...tv, ativo: false }])).toBe("");
  });

  it("lista vazia (catálogo fora do ar): remove todas as marcações", () => {
    expect(applyAffiliates("<p>[[produto:smart-tv-43]]</p>", [])).toBe("");
  });

  it("marcação com espaços e quebra de linha em volta também vale", () => {
    expect(applyAffiliates("<p>\n  [[produto:smart-tv-43]] \n</p>", [tv])).toContain("<aside");
  });

  it("marcação no meio de uma frase é só removida, sem cartão dentro do parágrafo", () => {
    const out = applyAffiliates("<p>Veja [[produto:smart-tv-43]] aqui.</p>", [tv]);
    expect(out).not.toContain("<aside");
    expect(out).not.toContain("[[produto:");
  });

  it("produto com link fora do Mercado Livre não vira cartão", () => {
    expect(applyAffiliates("<p>[[produto:smart-tv-43]]</p>", [{ ...tv, link_afiliado: "https://exemplo.com/x" }])).toBe("");
  });

  it("HTML vazio e sem marcação voltam iguais", () => {
    expect(applyAffiliates("", [tv])).toBe("");
    expect(applyAffiliates("<p>Texto comum.</p>", [tv])).toBe("<p>Texto comum.</p>");
  });
});

describe("applyAffiliates: link do Mercado Livre colado à mão", () => {
  it("ganha rel e nova aba, e o artigo ganha um aviso só", () => {
    const out = applyAffiliates(
      '<p>Veja <a href="https://meli.la/abc">este</a> e <a target="_blank" rel="noopener noreferrer" href="https://www.mercadolivre.com.br/x/p/MLB1?a=1&amp;b=2">aquele</a>.</p>',
      [],
    );
    expect(out.match(/rel="sponsored nofollow noopener"/g)?.length).toBe(2);
    expect(out.match(/target="_blank"/g)?.length).toBe(2);
    expect(out).not.toContain("noreferrer");
    expect(out.split(AVISO_AFILIADO).length - 1).toBe(1);
    expect(out).toContain('href="https://www.mercadolivre.com.br/x/p/MLB1?a=1&amp;b=2"');
  });

  it("link interno e link externo comum ficam intactos", () => {
    const html = '<p><a href="/orcamento">a</a> <a href="https://exemplo.com" target="_blank" rel="noopener noreferrer">b</a></p>';
    expect(applyAffiliates(html, [tv])).toBe(html);
  });

  it("endereço parecido não é tratado como afiliado", () => {
    const html = '<p><a href="https://meli.la.exemplo.com/x">a</a> <a href="http://meli.la/x">b</a></p>';
    expect(applyAffiliates(html, [])).toBe(html);
  });

  it("aplicar duas vezes dá o mesmo resultado", () => {
    const once = applyAffiliates('<p><a href="https://meli.la/abc">x</a></p><p>[[produto:smart-tv-43]]</p>', [tv]);
    expect(applyAffiliates(once, [tv])).toBe(once);
  });
});

describe("affiliateCardHtml", () => {
  it("nome e motivo com < e aspas saem escapados", () => {
    const out = affiliateCardHtml({ ...tv, nome: 'TV <b>"x"</b>', motivo: "<script>alert(1)</script>" });
    expect(out).not.toContain("<b>");
    expect(out).not.toContain("<script>");
    expect(out).toContain("&lt;b&gt;");
  });

  it("sem imagem não escreve <img>", () => {
    expect(affiliateCardHtml(tv)).not.toContain("<img");
  });

  it("com imagem: lazy, dimensões e alt", () => {
    const out = affiliateCardHtml({ ...tv, imagem_url: "https://bewild.com.br/f.webp", imagem_alt: "Studio com TV" });
    expect(out).toMatch(/<img[^>]+loading="lazy"[^>]+width="\d+"[^>]+height="\d+"/);
    expect(out).toContain('alt="Studio com TV"');
  });

  it("imagem que não é https é ignorada", () => {
    expect(affiliateCardHtml({ ...tv, imagem_url: "javascript:alert(1)" })).not.toContain("<img");
  });

  it("com projeto_slug: link interno para o portfólio, sem rel sponsored", () => {
    const out = affiliateCardHtml({ ...tv, projeto_slug: "studio-pinheiros" });
    expect(out).toContain('<a href="/portfolio/studio-pinheiros">');
  });

  it("projeto_slug inválido é ignorado", () => {
    expect(affiliateCardHtml({ ...tv, projeto_slug: '"><script>' })).not.toContain("/portfolio/");
  });

  it("não usa título (h1–h6), para não mexer na hierarquia do artigo", () => {
    expect(affiliateCardHtml(tv)).not.toMatch(/<h[1-6]/);
  });

  it("avisa que abre em nova aba depois do texto visível", () => {
    expect(affiliateCardHtml(tv)).toContain('Ver no Mercado Livre<span class="sr-only"> (abre em nova aba)</span>');
  });
});
