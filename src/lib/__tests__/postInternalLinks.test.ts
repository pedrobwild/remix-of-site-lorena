/**
 * Bloco "Páginas relacionadas" dos artigos (análise de palavras-chave de
 * 11/10/2026): uma palavra-chave, um destino.
 *  - artigo de studio aponta primeiro para /reforma-de-studio-sao-paulo (antes
 *    a categoria "reforma" mostrava apartamento e cobertura, nunca studio);
 *  - artigo de short stay aponta para o pilar /conteudos/o-que-e-short-stay;
 *  - artigo de condomínio aponta para o artigo da NBR 16280 e para a página
 *    de autorização, nessa ordem.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { internalLinksForPost } from "@/lib/postInternalLinks";
import { POST_KEYWORDS } from "@/lib/postKeywords";
import type { BewildPostCategory } from "@/lib/useBewildPosts";

const STUDIO = "/reforma-de-studio-sao-paulo";
const APARTAMENTO = "/reforma-de-apartamento-sao-paulo";
const SHORT_STAY = "/conteudos/o-que-e-short-stay";
const NBR = "/conteudos/nbr-16280-reforma-studio-condominio";
const AUTORIZACAO = "/autorizacao-condominio";

const hrefs = (slug: string, category?: BewildPostCategory | null) =>
  internalLinksForPost(slug, category).map((l) => l.href);

describe("links internos dos artigos", () => {
  it("artigo de studio (categoria reforma) abre com a página de reforma de studio", () => {
    for (const slug of [
      "orcamento-reforma-studio-25-m2-item-a-item",
      "o-que-esta-incluso-orcamento-reforma-studio",
      "como-reformar-studio-gastando-menos-sem-perder-valor",
      "estudo-de-layout-studio-25-m2",
    ]) {
      const list = internalLinksForPost(slug, "reforma");
      expect(list[0].href, slug).toBe(STUDIO);
      expect(list[0].label).toBe("Reforma de studio em São Paulo");
      expect(list.map((l) => l.href), slug).toContain(APARTAMENTO);
    }
  });

  it("artigo de apartamento abre com a página de apartamento e também cita a de studio", () => {
    const list = hrefs("quanto-tempo-demora-reforma-apartamento", "reforma");
    expect(list[0]).toBe(APARTAMENTO);
    expect(list[1]).toBe(STUDIO);
  });

  it("artigo que trata dos dois imóveis segue a ordem do próprio slug", () => {
    const list = hrefs("quanto-custa-reformar-apartamento-studio-ate-50-m2", "reforma");
    expect(list.slice(0, 2)).toEqual([APARTAMENTO, STUDIO]);
  });

  it("artigo só de apartamento usa os links de reforma mesmo com categoria de investimento", () => {
    const list = hrefs("como-pagar-reforma-apartamento-financiamento-sp", "investimento");
    expect(list[0]).toBe(APARTAMENTO);
    expect(list).toContain("/marcenaria");
    expect(list).not.toContain(SHORT_STAY);
  });

  it("artigos de short stay apontam para o pilar; o pilar não aponta para si mesmo", () => {
    for (const [slug, category] of [
      ["melhores-bairros-short-stay-sao-paulo", "mercado"],
      ["gestao-propria-vs-gestora", "operacao"],
      ["custos-de-operar-studio-short-stay", "investimento"],
      ["como-declarar-renda-airbnb-imposto-de-renda", "fiscal"],
      ["quanto-custa-reformar-studio-short-stay-sao-paulo", "reforma"],
    ] as const) {
      expect(hrefs(slug, category), slug).toContain(SHORT_STAY);
    }
    expect(hrefs("o-que-e-short-stay", "mercado")).not.toContain(SHORT_STAY);
    expect(hrefs("o-que-e-short-stay", "mercado")[0]).toBe(STUDIO);
  });

  it("artigos de condomínio citam a norma e depois a página de autorização", () => {
    for (const slug of ["o-que-perguntar-ao-sindico-antes-de-reformar", "fechar-varanda-em-vidro-studio-condominio"]) {
      expect(hrefs(slug, "reforma").slice(0, 2), slug).toEqual([NBR, AUTORIZACAO]);
    }
    // O artigo da norma não cita a si mesmo: abre com a autorização.
    const norma = hrefs("nbr-16280-reforma-studio-condominio", "reforma");
    expect(norma).not.toContain(NBR);
    expect(norma[0]).toBe(AUTORIZACAO);
  });

  it("nunca repete destino, nunca passa de seis e nunca aponta para o próprio artigo", () => {
    const categorias: Array<BewildPostCategory | null> = ["reforma", "investimento", "mercado", "operacao", "fiscal", null];
    for (const slug of [...Object.keys(POST_KEYWORDS), "slug-sem-regra"]) {
      for (const category of categorias) {
        const list = hrefs(slug, category);
        expect(list.length, slug).toBeGreaterThanOrEqual(5);
        expect(list.length, slug).toBeLessThanOrEqual(6);
        expect(new Set(list).size, slug).toBe(list.length);
        expect(list, slug).not.toContain(`/conteudos/${slug}`);
      }
    }
  });

  it("todo destino é uma página que está no sitemap", () => {
    const sitemap = readFileSync(path.resolve(__dirname, "../../../public/sitemap.xml"), "utf8");
    const destinos = new Set<string>();
    for (const slug of Object.keys(POST_KEYWORDS)) {
      for (const category of ["reforma", "investimento", "mercado", "operacao", "fiscal"] as const) {
        hrefs(slug, category).forEach((h) => destinos.add(h));
      }
    }
    for (const href of destinos) {
      // O guia do investidor mora no Radar Bewild (subdomínio próprio, sitemap próprio).
      if (href.startsWith("https://radar.bewild.com.br")) continue;
      expect(sitemap, href).toContain(`<loc>https://bewild.com.br${href}</loc>`);
    }
  });

  it("nenhum rótulo oferece mais o diagnóstico (só existe o orçamento)", () => {
    const fonte = readFileSync(path.resolve(__dirname, "../postInternalLinks.ts"), "utf8");
    expect(fonte).not.toMatch(/diagn[oó]stic/i);
  });
});
