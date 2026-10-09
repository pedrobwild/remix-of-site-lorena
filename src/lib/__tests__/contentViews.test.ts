import { describe, expect, it } from "vitest";
import {
  buildContentRows,
  contentKeyFromPath,
  contentRowsToCsv,
  contentTotals,
  type ContentItem,
  type PathViews,
} from "@/lib/contentViews";

describe("contentKeyFromPath", () => {
  it("reconhece artigo, artigo legado e projeto", () => {
    expect(contentKeyFromPath("/conteudos/o-que-e-short-stay")).toEqual({ kind: "post", slug: "o-que-e-short-stay" });
    expect(contentKeyFromPath("/blog/o-que-e-short-stay")).toEqual({ kind: "post", slug: "o-que-e-short-stay" });
    expect(contentKeyFromPath("/portfolio/studio-moema")).toEqual({ kind: "project", slug: "studio-moema" });
  });
  it("normaliza barra final, maiúsculas, query e acentos codificados", () => {
    expect(contentKeyFromPath("/Conteudos/Abc/")).toEqual({ kind: "post", slug: "abc" });
    expect(contentKeyFromPath("/portfolio/x?utm_source=ig")).toEqual({ kind: "project", slug: "x" });
    expect(contentKeyFromPath("/conteudos/reforma-s%C3%A3o-paulo")).toEqual({ kind: "post", slug: "reforma-são-paulo" });
  });
  it("ignora índices, tags, subpáginas e outras rotas", () => {
    for (const p of ["/conteudos", "/conteudos/", "/conteudos/tag/airbnb", "/conteudos/tags", "/portfolio", "/portfolio/a/b", "/", "/orcamento", null]) {
      expect(contentKeyFromPath(p)).toBeNull();
    }
  });
});

const posts: ContentItem[] = [
  { slug: "a", title: "Artigo A", published: true },
  { slug: "b", title: "Artigo B", published: true },
  { slug: "c", title: "Artigo C", published: false },
];

const paths: PathViews[] = [
  { path: "/conteudos/b", pageviews: 10, sessions: 7 },
  { path: "/blog/b", pageviews: 2, sessions: 1 },
  { path: "/conteudos/b/", pageviews: 1, sessions: 1 },
  { path: "/conteudos/a", pageviews: 3, sessions: 3 },
  { path: "/conteudos/apagado", pageviews: 4, sessions: 2 },
  { path: "/portfolio/p1", pageviews: 50, sessions: 40 },
  { path: "/", pageviews: 999, sessions: 500 },
];

describe("buildContentRows", () => {
  it("lista todo o cadastro, soma variantes do caminho e ordena por pageviews", () => {
    const rows = buildContentRows("post", posts, paths);
    expect(rows.map((r) => [r.slug, r.pageviews, r.sessions, r.orphan])).toEqual([
      ["b", 13, 9, false],
      ["apagado", 4, 2, true],
      ["a", 3, 3, false],
      ["c", 0, 0, false],
    ]);
    expect(rows[0].href).toBe("/conteudos/b");
    expect(rows.every((r) => r.prevPageviews === null)).toBe(true);
  });

  it("projetos só pegam /portfolio/<slug>", () => {
    const rows = buildContentRows("project", [{ slug: "p1", title: "P1", published: true }], paths);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ slug: "p1", pageviews: 50, sessions: 40, href: "/portfolio/p1" });
  });

  it("com período anterior, preenche prevPageviews (0 quando não houve acesso)", () => {
    const rows = buildContentRows("post", posts, paths, [{ path: "/conteudos/a", pageviews: 6, sessions: 5 }]);
    const by = Object.fromEntries(rows.map((r) => [r.slug, r.prevPageviews]));
    expect(by).toMatchObject({ a: 6, b: 0, c: 0, apagado: 0 });
  });

  it("totais contam itens do cadastro e os que tiveram acesso", () => {
    const t = contentTotals(buildContentRows("post", posts, paths));
    expect(t).toEqual({ pageviews: 20, sessions: 14, withViews: 2, items: 3 });
  });
});

describe("contentRowsToCsv", () => {
  it("gera cabeçalho e escapa ponto e vírgula e aspas", () => {
    const rows = buildContentRows("post", [{ slug: "a", title: 'Custo; "real"', published: true }], [
      { path: "/conteudos/a", pageviews: 2, sessions: 1 },
    ]);
    const csv = contentRowsToCsv(rows).split("\n");
    expect(csv[0]).toBe("titulo;slug;url;pageviews;sessoes;pageviews_periodo_anterior;situacao");
    expect(csv[1]).toBe('"Custo; ""real""";a;https://bewild.com.br/conteudos/a;2;1;;publicado');
  });
});
