import { describe, expect, it } from "vitest";
import { PAGE_SEO_DEFAULTS, resolvePageSeo } from "@/lib/pageSeo";

describe("SEO das páginas editáveis", () => {
  it("usa o padrão quando o painel está vazio", () => {
    expect(resolvePageSeo("/contato", { "/contato": { title: "  " } }).title)
      .toBe(PAGE_SEO_DEFAULTS["/contato"].title);
  });
  it("isola os textos por página e preserva descrição padrão", () => {
    const map = { "/servicos": { title: "Título salvo" }, "/portfolio": { title: "Outro título" } };
    expect(resolvePageSeo("/servicos", map)).toMatchObject({
      title: "Título salvo", description: PAGE_SEO_DEFAULTS["/servicos"].description,
    });
  });
  it("a prévia herda os textos salvos quando não tem campos próprios", () => {
    expect(resolvePageSeo("/orcamento", { "/orcamento": { title: "Salvo", description: "Resumo salvo" } }))
      .toMatchObject({ ogTitle: "Salvo", ogDescription: "Resumo salvo" });
  });
  it("respeita os campos próprios da prévia", () => {
    expect(resolvePageSeo("/conteudos", { "/conteudos": { title: "Google", og_title: "Prévia" } }).ogTitle)
      .toBe("Prévia");
  });
});
