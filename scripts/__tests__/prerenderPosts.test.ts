import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  POST_ALLOWED_ATTR,
  POST_ALLOWED_TAGS,
  carregarSanitizador,
  imagemAbsoluta,
  renderPostHtml,
  type Post,
} from "../prerenderPosts";

const BASE_HTML = `<!doctype html><html><head>
<title>Padrão</title>
<meta name="description" content="padrão" />
<meta name="keywords" content="padrão" />
<link rel="canonical" href="https://bewild.com.br/" />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://bewild.com.br/" />
<meta property="og:image" content="https://bewild.com.br/og_final_v2.jpg">
<meta property="og:image:secure_url" content="https://bewild.com.br/og_final_v2.jpg" />
<meta property="og:image:type" content="image/jpeg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:title" content="padrão" />
<meta property="og:description" content="padrão" />
<meta name="twitter:title" content="padrão" />
<meta name="twitter:description" content="padrão" />
<meta name="twitter:image" content="https://bewild.com.br/og_final_v2.jpg">
</head><body><div id="root"></div></body></html>`;

const post = (over: Partial<Post> = {}): Post => ({
  slug: "teste",
  title: "Título",
  meta_title: null,
  meta_description: null,
  excerpt: null,
  cover_image: null,
  category: null,
  published_at: "2026-09-01T10:00:00Z",
  updated_at: null,
  created_at: null,
  body: "",
  ...over,
});

/** Extrai os literais de string de `const NOME = [ ... ]` num arquivo-fonte. */
function listaDoFonte(fonte: string, nome: string): string[] {
  const m = fonte.match(new RegExp(`const ${nome} = \\[([\\s\\S]*?)\\];`));
  if (!m) throw new Error(`${nome} não encontrado`);
  return [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
}

describe("sanitização do corpo dos posts", () => {
  it("usa a mesma allow-list de src/lib/sanitizeHtml.ts", () => {
    const fonte = readFileSync(path.resolve(__dirname, "../../src/lib/sanitizeHtml.ts"), "utf8");
    expect([...POST_ALLOWED_TAGS].sort()).toEqual(listaDoFonte(fonte, "ALLOWED_TAGS").sort());
    expect([...POST_ALLOWED_ATTR].sort()).toEqual(listaDoFonte(fonte, "ALLOWED_ATTR").sort());
  });

  /** Atributos on* de verdade no HTML de saída (não texto dentro de um valor). */
  const temHandler = (html: string) =>
    [...new DOMParser().parseFromString(html, "text/html").body.querySelectorAll("*")].some((el) =>
      [...el.attributes].some((a) => a.name.toLowerCase().startsWith("on")),
    );

  it.each([
    [`<img src=x/onerror=alert(1)>`],
    [`<img/onerror=alert(1) src=x>`],
    [`<svg/onload=alert(1)>`],
    [`<a href="#" onclick="alert(1)">x</a>`],
  ])("remove handlers on*: %s", async (sujo) => {
    const sanitizar = await carregarSanitizador();
    expect(temHandler(sanitizar(sujo))).toBe(false);
  });

  it.each([
    ["onerror separado por barra", `<img/onerror=alert(1) src=x>`, /onerror/i],
    ["href javascript: sem aspas", `<a href=javascript:alert(1)>x</a>`, /javascript:/i],
    ["javascript: com entidade", `<a href="&#106;avascript:alert(1)">x</a>`, /avascript/i],
    ["meta refresh", `<meta http-equiv="refresh" content="0;url=https://evil.example">`, /http-equiv|<meta/i],
    ["form", `<form action="https://evil.example"><input name="senha"></form>`, /<form|<input/i],
    ["base", `<base href="https://evil.example/">`, /<base/i],
    ["svg com script", `<svg><script>alert(1)</script></svg>`, /<script|<svg/i],
    ["iframe", `<iframe src="https://evil.example"></iframe>`, /<iframe/i],
    ["style inline", `<p style="background:url(javascript:alert(1))">x</p>`, /style=/i],
  ])("neutraliza: %s", async (_nome, sujo, proibido) => {
    const sanitizar = await carregarSanitizador();
    expect(sanitizar(sujo)).not.toMatch(proibido);
  });

  it("mantém o conteúdo legítimo e força rel=noopener em target=_blank", async () => {
    const sanitizar = await carregarSanitizador();
    const limpo = sanitizar(`<h2>Custo</h2><p><a href="https://x.example" target="_blank">link</a></p><table><tr><td>1</td></tr></table>`);
    expect(limpo).toContain("<h2>Custo</h2>");
    expect(limpo).toContain('rel="noopener noreferrer"');
    expect(limpo).toContain("<td>1</td>");
  });
});

describe("renderPostHtml", () => {
  it("não interpreta $&, $' ou $1 vindos do banco", async () => {
    const sanitizar = await carregarSanitizador();
    const html = renderPostHtml(
      post({ title: "Preço $& e $' e $1", excerpt: "Resumo com $`", body: "Corpo com $& literal" }),
      BASE_HTML,
      sanitizar,
    );
    expect(html).toContain("<title>Preço $&amp; e $' e $1 | Bewild</title>");
    expect(html).toContain("<h1>Preço $&amp; e $' e $1</h1>");
    expect(html).toContain("Resumo com $`");
    expect(html).toContain("Corpo com $&amp; literal");
  });

  it("usa a capa do post no og:image/twitter:image e remove dimensões da imagem padrão", () => {
    const html = renderPostHtml(post({ cover_image: "/images/blog/capa.webp" }), BASE_HTML, null);
    expect(html).toContain('<meta property="og:image" content="https://bewild.com.br/images/blog/capa.webp" />');
    expect(html).toContain('<meta name="twitter:image" content="https://bewild.com.br/images/blog/capa.webp" />');
    expect(html).not.toMatch(/og:image:(width|height|type)/);
    expect(html).toContain('"image":["https://bewild.com.br/images/blog/capa.webp"]');
  });

  it("sem capa, mantém a imagem padrão", () => {
    const html = renderPostHtml(post(), BASE_HTML, null);
    expect(html).toContain('og:image" content="https://bewild.com.br/og_final_v2.jpg"');
    expect(html).toContain('og:image:width" content="1200"');
  });

  it("marca o JSON-LD com data-seo-managed para a SPA substituir", () => {
    const html = renderPostHtml(post(), BASE_HTML, null);
    const blocos = html.match(/<script type="application\/ld\+json"[^>]*>/g) ?? [];
    expect(blocos.length).toBe(2);
    for (const b of blocos) expect(b).toContain('data-seo-managed="true"');
  });

  it("sem sanitizador disponível, omite o corpo do artigo (nunca publica HTML cru)", () => {
    const html = renderPostHtml(post({ body: "<img src=x onerror=alert(1)>texto" }), BASE_HTML, null);
    expect(html).not.toContain("onerror");
    expect(html).not.toContain("texto");
  });
});

describe("imagemAbsoluta", () => {
  it.each([
    ["https://cdn.example/a.jpg", "https://cdn.example/a.jpg"],
    ["/images/a.jpg", "https://bewild.com.br/images/a.jpg"],
    ["//evil.example/a.jpg", null],
    ["javascript:alert(1)", null],
    ["", null],
    [null, null],
  ])("%s → %s", (entrada, esperado) => {
    expect(imagemAbsoluta(entrada)).toBe(esperado);
  });
});
