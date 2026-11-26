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
    const html = '<p><a href="https://meli.la.exemplo.com/x">a</a> <a href="https://exemplo.com/meli.la">b</a></p>';
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

describe("ordem com o sanitizador (o rel de afiliado não pode ser trocado)", () => {
  const md = '<p>Texto.</p>\n<p>[[produto:smart-tv-43]]</p>\n<p>Veja <a href="https://meli.la/abc" target="_blank">este</a>.</p>';

  it("navegador (DOMPurify): marcação sobrevive e o cartão entra depois", async () => {
    const { sanitizeBlogHtml } = await import("@/lib/sanitizeHtml");
    const clean = sanitizeBlogHtml(md);
    expect(clean).toContain("[[produto:smart-tv-43]]");
    const out = applyAffiliates(clean, [tv]);
    expect(out).toContain("<aside");
    expect(out.match(/rel="sponsored nofollow noopener"/g)?.length).toBe(2);
    expect(out).not.toContain("noreferrer");
  });

  it("servidor (js-xss): mesma coisa", async () => {
    const { sanitizeBlogHtmlServer } = await import("@/lib/sanitizeHtml");
    const out = applyAffiliates(sanitizeBlogHtmlServer(md), [tv]);
    expect(out).toContain("<aside");
    expect(out.match(/rel="sponsored nofollow noopener"/g)?.length).toBe(2);
  });

  it("sanitizar DEPOIS do cartão estragaria o rel: por isso a ordem é fixa", async () => {
    const { sanitizeBlogHtmlServer } = await import("@/lib/sanitizeHtml");
    expect(sanitizeBlogHtmlServer(affiliateCardHtml(tv))).not.toContain('rel="sponsored nofollow noopener"');
  });
});

describe("revisão final: marcação fora do parágrafo simples (editor do painel grava HTML)", () => {
  const semResto = (out: string) => {
    expect(out).not.toContain("[[produto:");
    expect(out).not.toMatch(/<(p|li|h[1-6]|strong|em)>(\s|&nbsp;|<br\s*\/?>)*<\/\1>/);
  };

  it.each([
    "<p>[[produto:smart-tv-43]]<br></p>",
    "<p>[[produto:smart-tv-43]]&nbsp;</p>",
    "<p><strong>[[produto:smart-tv-43]]</strong></p>",
    "<p> <em>[[produto:smart-tv-43]]</em> <br/></p>",
  ])("%s vira cartão", (html) => {
    const out = applyAffiliates(html, [tv]);
    expect(out).toContain("<aside");
    semResto(out);
  });

  it("duas marcações na mesma linha viram dois cartões", () => {
    const out = applyAffiliates("<p>[[produto:smart-tv-43]] [[produto:smart-tv-43]]</p>", [tv]);
    expect(out.match(/<aside/g)?.length).toBe(2);
    semResto(out);
  });

  it.each([
    "<ul><li>[[produto:smart-tv-43]]</li><li>fica</li></ul>",
    "<h2>[[produto:smart-tv-43]]</h2><p>fica</p>",
    "<p>[[produto:TV]]</p><p>fica</p>",
    "<p>[[produto: tv]]</p><p>fica</p>",
    "<p>[[produto:smart_tv]]<br></p><p>fica</p>",
    "<p><strong>[[produto:nao-existe]]</strong></p><p>fica</p>",
  ])("%s: nada vazio sobra para o leitor", (html) => {
    const out = applyAffiliates(html, [tv]);
    semResto(out);
    expect(out).toContain("fica");
  });

  it("parágrafo vazio que já existia no artigo não é mexido", () => {
    const html = "<p><br></p><p>[[produto:nao-existe]]</p><p>fim</p>";
    expect(applyAffiliates(html, [tv])).toBe("<p><br></p><p>fim</p>");
  });

  it("marcação no meio da frase some sem deixar espaço duplo", () => {
    expect(applyAffiliates("<p>Veja [[produto:smart-tv-43]] aqui.</p>", [tv])).toBe("<p>Veja aqui.</p>");
  });
});

describe("revisão final: link colado à mão em outros endereços do Mercado Livre", () => {
  it.each([
    "https://produto.mercadolivre.com.br/MLB-1",
    "https://lista.mercadolivre.com.br/tv",
    "http://meli.la/x",
    "https://www.mercadolivre.com/sec/abc",
  ])("%s sai marcado e com aviso", (href) => {
    const out = applyAffiliates(`<p><a href="${href}">x</a></p>`, []);
    expect(out).toContain('rel="sponsored nofollow noopener"');
    expect(out.split(AVISO_AFILIADO).length - 1).toBe(1);
  });

  it.each(["https://mercadolivre.com.br.exemplo.com/x", "https://xmercadolivre.com.br/x", "https://exemplo.com/?u=meli.la"])(
    "%s não é Mercado Livre",
    (href) => {
      const html = `<p><a href="${href}">x</a></p>`;
      expect(applyAffiliates(html, [])).toBe(html);
    },
  );
});

describe("revisão final: espaçamento do cartão não pode ser anulado por especificidade", () => {
  it("o reset de margem dos parágrafos do cartão não usa seletor mais forte que as regras de margin-top", async () => {
    const { readFileSync } = await import("node:fs");
    const path = await import("node:path");
    const css = readFileSync(path.resolve(__dirname, "../../styles/post.css"), "utf8");
    expect(css).not.toContain(".pt-body .bw-afiliado p{");
    expect(css).toContain(".bw-afiliado p{margin:0}");
  });
});
