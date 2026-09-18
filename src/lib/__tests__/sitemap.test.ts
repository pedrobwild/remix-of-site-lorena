import { describe, expect, it } from "vitest";
import { parseSitemapXml } from "../sitemap";

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://bewild.com.br/</loc></url>
  <url><loc>https://bewild.com.br/portfolio/apto-a</loc><lastmod>2026-09-17</lastmod></url>
  <url><loc>https://bewild.com.br/conteudos/reforma</loc></url>
</urlset>`;

describe("parseSitemapXml", () => {
  it("valida e separa páginas, projetos e conteúdos", () => {
    const generatedAt = new Date("2026-09-18T10:00:00Z");
    expect(parseSitemapXml(xml, generatedAt)).toMatchObject({
      total: 3,
      projects: 1,
      posts: 1,
      pages: 1,
      generatedAt,
    });
  });

  it("rejeita XML inválido e URLs duplicadas", () => {
    expect(() => parseSitemapXml("<html />")).toThrow("não é um sitemap XML válido");
    expect(() =>
      parseSitemapXml(xml.replace("</urlset>", "<url><loc>https://bewild.com.br/</loc></url></urlset>")),
    ).toThrow("URLs duplicadas");
  });
});