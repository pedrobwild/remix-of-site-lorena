import { describe, expect, it } from "vitest";
import { addHeadingAnchors, bodyWordCount, extractPostCredits, headingSlug, structurePostBody } from "@/lib/postStructure";

describe("extractPostCredits", () => {
  it("remove a linha de créditos em itálico e lê o revisor", () => {
    const html =
      "<p><em>Autor: Thiago Dantas, arquiteto (CAU A162437-7) · Revisão editorial: Pedro Alves, engenheiro e CEO da Bewild</em></p>\n<p>Resposta direta.</p>";
    const r = extractPostCredits(html);
    expect(r.html).toBe("<p>Resposta direta.</p>");
    expect(r.credits).toEqual({ reviewer: "Pedro Alves", reviewKind: "editorial" });
  });
  it("formato antigo com 'Atualizado em' e 'Revisão Técnica'", () => {
    const html = "<p>Atualizado em: 22/09/2026\nAutor: Pedro Alves, Engenheiro | Revisão Técnica: Thiago Dantas, Arquiteto</p><p>Texto</p>";
    const r = extractPostCredits(html);
    expect(r.html).toBe("<p>Texto</p>");
    expect(r.credits).toEqual({ reviewer: "Thiago Dantas", reviewKind: "técnica" });
  });
  it("não toca em parágrafo editorial", () => {
    const html = "<p>Autoria de projeto é tema deste guia.</p>";
    expect(extractPostCredits(html).html).toBe(html);
  });
});

describe("addHeadingAnchors", () => {
  it("gera ids únicos e sumário", () => {
    const { html, toc } = addHeadingAnchors("<h2>Quanto custa por m²?</h2><p>x</p><h2>Quanto custa por m²?</h2><h3>Detalhe <strong>A</strong></h3>");
    expect(html).toContain('<h2 id="quanto-custa-por-m2">');
    expect(html).toContain('<h2 id="quanto-custa-por-m2-2">');
    expect(html).toContain('<h3 id="detalhe-a">Detalhe <strong>A</strong></h3>');
    expect(toc.map((t) => t.level)).toEqual([2, 2, 3]);
  });
  it("evita ids reservados da página", () => {
    expect(addHeadingAnchors("<h2>Perguntas frequentes</h2>").toc[0].id).toBe("perguntas-frequentes-2");
  });
  it("slug sem acento", () => expect(headingSlug("O que é a NBR 16280?")).toBe("o-que-e-a-nbr-16280"));
});

describe("structurePostBody", () => {
  it("pipeline completo e contagem de palavras", () => {
    const r = structurePostBody("<p><em>Autor: X · Revisão técnica: Thiago Dantas</em></p><p>um dois três</p><h2>Seção</h2>");
    expect(r.credits.reviewer).toBe("Thiago Dantas");
    expect(r.html.startsWith("<p>um dois")).toBe(true);
    expect(bodyWordCount(r.html)).toBe(4);
  });
});
