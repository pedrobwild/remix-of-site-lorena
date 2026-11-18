// @vitest-environment node
import { describe, expect, it } from "vitest";
import { articleUrls, articleImages, imageSitemap } from "../../../scripts/blog-image-sitemap.mjs";

describe("XML de imagens do blog público", () => {
  const url = "https://bewild.com.br/conteudos/studio";
  it("lê todos os artigos sem incluir painel ou páginas de serviço", () => {
    expect(articleUrls(`<urlset><url><loc>${url}</loc></url><url><loc>https://bewild.com.br/admin</loc></url><url><loc>${url}-2</loc></url></urlset>`)).toEqual([url, `${url}-2`]);
  });
  it("inclui gráficos desktop/mobile e download sem logotipo nem relacionados", () => {
    const html = `<img src="/logo.svg"><article id="main"><div class="pt-body"><picture><source srcset="/images/m.svg"><img src="/images/d.svg"></picture><a href="/images/interactive.svg">SVG</a></div><div class="related"><img src="/related.jpg"></div></article>`;
    expect(articleImages(html, url)).toEqual(["https://bewild.com.br/images/d.svg", "https://bewild.com.br/images/interactive.svg", "https://bewild.com.br/images/m.svg"]);
  });
  it("exclui artigos noindex e canônicos de outro endereço", () => {
    expect(articleImages('<meta name="robots" content="noindex, follow">', url)).toEqual([]);
    expect(articleImages('<link rel="canonical" href="https://bewild.com.br/conteudos/outro">', url)).toEqual([]);
  });
  it("falha em vez de ignorar um artigo sem corpo público", () => {
    expect(() => articleImages("<html></html>", url)).toThrow("Corpo do artigo ausente");
  });
  it("inclui a capa mesmo quando o artigo não tem gráficos", () => {
    expect(articleImages('<article id="main"><div class="pt-cover"><img src="/cover.jpg"></div><div class="pt-body"></div></article>', url)).toEqual(["https://bewild.com.br/cover.jpg"]);
  });
  it("deduplica imagens, escapa URLs e não inventa lastmod", () => {
    const xml = imageSitemap([{ url, images: ["https://bewild.com.br/img.svg?a=1&b=2", "https://bewild.com.br/img.svg?a=1&b=2"] }]);
    expect(xml.match(/<image:image>/g)).toHaveLength(1);
    expect(xml).toContain("a=1&amp;b=2");
    expect(xml).not.toContain("lastmod");
  });
});