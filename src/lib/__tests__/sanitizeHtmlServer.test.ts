import { describe, it, expect } from "vitest";
import { sanitizeBlogHtmlServer, stripInternalUtm } from "@/lib/sanitizeHtml";

const VECTORS = [
  "<img src=x onerror=alert(1)>",
  "<a href=javascript:alert(1)>x</a>",
  '<a href="&#106;avascript:alert(1)">x</a>',
  "<svg onload=alert(1)>",
  '<meta http-equiv=refresh content="0;url=//x">',
  "<form><input></form>",
  "<base href=//x>",
  "<script>alert(1)</script>",
  '<p style="x">ok</p>',
];

describe("sanitizeBlogHtmlServer", () => {
  it.each(VECTORS)("neutraliza %s", (v) => {
    const out = sanitizeBlogHtmlServer(v).toLowerCase();
    expect(out).not.toMatch(/onerror|onload|javascript:|<svg|<meta|<form|<input|<base|<script|style=|alert\(1\)<\/script/);
    expect(out).not.toContain("//x");
  });

  it("mantém conteúdo seguro e força noopener", () => {
    expect(sanitizeBlogHtmlServer('<p style="x">ok</p>')).toBe("<p>ok</p>");
    const a = sanitizeBlogHtmlServer('<a href="https://x.com" target="_blank" rel="opener">y</a>');
    expect(a).toContain('rel="noopener noreferrer"');
    expect(a).toContain('href="https://x.com"');
    expect(sanitizeBlogHtmlServer('<a href="/orcamento">o</a>')).toContain('href="/orcamento"');
  });
});

describe("sanitizeBlogHtmlServer — vídeo", () => {
  const VIDEO = `<figure>
  <video controls playsinline preload="none" poster="/videos/quanto-custa-reformar-ate-50m2-poster.jpg" width="1920" height="1080" aria-label="Vídeo: resumo da análise">
    <source src="/videos/quanto-custa-reformar-ate-50m2.mp4" type="video/mp4">
  </video>
  <figcaption>legenda</figcaption>
</figure>`;
  it("mantém o vídeo com controls, playsinline, preload, poster e source", () => {
    const out = sanitizeBlogHtmlServer(VIDEO);
    expect(out).toMatch(/<video\b[^>]*\scontrols\b/);
    expect(out).toMatch(/\splaysinline\b/);
    expect(out).toContain('preload="none"');
    expect(out).toContain('poster="/videos/quanto-custa-reformar-ate-50m2-poster.jpg"');
    expect(out).toContain('aria-label="Vídeo: resumo da análise"');
    expect(out).toContain('<source src="/videos/quanto-custa-reformar-ate-50m2.mp4" type="video/mp4">');
    expect(out).toContain("<figcaption>legenda</figcaption>");
  });
  it("remove autoplay e loop", () => {
    const out = sanitizeBlogHtmlServer('<video autoplay loop muted controls src="/v.mp4"></video>');
    expect(out).not.toMatch(/autoplay|loop/);
    expect(out).toMatch(/\smuted\b/);
  });
  it("remove poster javascript:", () => {
    const out = sanitizeBlogHtmlServer('<video poster="javascript:alert(1)"></video>');
    expect(out).not.toMatch(/javascript:/i);
    expect(out).not.toMatch(/poster="[^"]+"/);
  });
  it("continua removendo iframe", () => {
    expect(sanitizeBlogHtmlServer('<p>a</p><iframe src="https://x.com"></iframe>')).not.toMatch(/<iframe/i);
  });
});

describe("stripInternalUtm — UTM em link interno (auditoria 06/10/2026)", () => {
  it("remove utm_* de links relativos e absolutos do próprio site, mantendo outros parâmetros e âncora", () => {
    const html =
      '<p><a href="/orcamento?utm_source=conteudo&amp;utm_medium=post&amp;utm_campaign=x">Orçamento</a> ' +
      '<a href="https://bewild.com.br/orcamento?tipo=studio&amp;utm_source=conteudo#form">A</a> ' +
      '<a href="https://www.bewild.com.br/contato?utm_source=a">B</a></p>';
    const out = stripInternalUtm(html);
    expect(out).toContain('<a href="/orcamento">Orçamento</a>');
    expect(out).toContain('<a href="https://bewild.com.br/orcamento?tipo=studio#form">A</a>');
    expect(out).toContain('<a href="https://www.bewild.com.br/contato">B</a>');
    expect(out).not.toMatch(/utm_/);
  });

  it("não mexe em links externos nem em href sem UTM", () => {
    const html = '<a href="https://example.com/?utm_source=bewild" target="_blank" rel="noopener noreferrer">x</a><a href="/faq?x=1">y</a>';
    expect(stripInternalUtm(html)).toBe(html);
  });

  it("sanitizador do servidor já devolve o link limpo", () => {
    const out = sanitizeBlogHtmlServer('<p><a href="/orcamento?utm_source=conteudo&utm_medium=post">Peça</a></p>');
    expect(out).toContain('href="/orcamento"');
    expect(out).not.toMatch(/utm_/);
  });
});
