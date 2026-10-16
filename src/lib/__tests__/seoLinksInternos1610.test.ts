/**
 * Avaliação de SEO de 16/10/2026 (claude/avaliacao-seo-2026-10-16.md).
 *
 * 1. Indexação parada: 12 das 16 páginas de bairro eram "desconhecidas para o
 *    Google" e a home, a página mais forte do site, não linkava nenhuma. A home
 *    passa a linkar os bairros com mais obras e os guias principais.
 * 2. Canibalização: o artigo de etapas aparecia para "quanto tempo demora uma
 *    reforma de apartamento"; etapas e cronogramas apontam para o de prazo.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { HOME_BWA_HTML } from "@/pages/home-bwa-body";
import { bairroContent } from "@/content/bairros";
import { internalLinksForPost } from "@/lib/postInternalLinks";

const root = path.resolve(__dirname, "../../..");
const sitemap = readFileSync(path.join(root, "public/sitemap.xml"), "utf8");
const PRAZO = "/conteudos/quanto-tempo-demora-reforma-apartamento";

const hrefsDaHome = (prefixo: string) =>
  [...HOME_BWA_HTML.matchAll(/href="([^"]+)"/g)].map((m) => m[1]).filter((h) => h.startsWith(prefixo));

describe("home → páginas de bairro e guias", () => {
  const bairros = hrefsDaHome("/reforma/");

  it("linka ao menos 10 páginas de bairro, sem repetir", () => {
    expect(bairros.length).toBeGreaterThanOrEqual(10);
    expect(new Set(bairros).size).toBe(bairros.length);
  });

  it("todo bairro linkado tem texto próprio e está no sitemap (nada de link para página inexistente)", () => {
    for (const href of bairros) {
      const slug = href.replace("/reforma/", "");
      expect(bairroContent(slug), href).not.toBeNull();
      expect(sitemap, href).toContain(`<loc>https://bewild.com.br${href}</loc>`);
    }
  });

  it("linka /onde-atuamos e os guias de custo, prazo, NBR 16280 e o guia de reforma", () => {
    const conteudos = hrefsDaHome("/conteudos/");
    expect(hrefsDaHome("/onde-atuamos").length).toBeGreaterThan(0);
    for (const href of [
      "/conteudos/reforma-de-apartamento-em-sao-paulo-guia",
      "/conteudos/quanto-custa-reformar-apartamento-studio-ate-50-m2",
      PRAZO,
      "/conteudos/nbr-16280-reforma-studio-condominio",
    ]) {
      expect(conteudos, href).toContain(href);
      expect(sitemap, href).toContain(`<loc>https://bewild.com.br${href}</loc>`);
    }
  });
});

describe("prazo: um assunto, um artigo", () => {
  it("o artigo de etapas aponta para o de prazo com a âncora da busca", () => {
    const links = internalLinksForPost("etapas-de-reforma-de-apartamento-cronograma", "reforma");
    const prazo = links.find((l) => l.href === PRAZO);
    expect(prazo?.label).toBe("Quanto tempo demora uma reforma de apartamento");
    expect(links.length).toBeLessThanOrEqual(6);
  });

  it("o próprio artigo de prazo não aponta para si", () => {
    const links = internalLinksForPost("quanto-tempo-demora-reforma-apartamento", "reforma");
    expect(links.map((l) => l.href)).not.toContain(PRAZO);
  });
});
