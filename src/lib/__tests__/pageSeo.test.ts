import { describe, expect, it } from "vitest";
import { PAGE_SEO_DEFAULTS, resolvePageSeo } from "@/lib/pageSeo";
import { pageSeoOverride } from "@/lib/publicPages";
import { applyPageSeoOverride, seoHead } from "@/lib/routeHead";

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

describe("noindex pelo painel (aba Páginas)", () => {
  it("pageSeoOverride só repassa noindex quando é true de verdade", () => {
    expect(pageSeoOverride({ "/faq": { noindex: true } }, "/faq").noindex).toBe(true);
    expect(pageSeoOverride({ "/faq": { noindex: false } }, "/faq").noindex).toBeUndefined();
    expect(pageSeoOverride({ "/faq": { noindex: "true" as unknown as boolean } }, "/faq").noindex).toBeUndefined();
    expect(pageSeoOverride(null, "/faq").noindex).toBeUndefined();
  });
  it("applyPageSeoOverride liga o noindex e nunca desliga o da rota", () => {
    const base = { title: "T", description: "D", path: "/faq" };
    expect(applyPageSeoOverride({ ...base, pagesSeo: { "/faq": { noindex: true } } }, "/faq").noindex).toBe(true);
    expect(applyPageSeoOverride({ ...base, pagesSeo: { "/faq": {} } }, "/faq").noindex).toBeUndefined();
    expect(applyPageSeoOverride({ ...base, noindex: true, pagesSeo: { "/faq": { noindex: false } } }, "/faq").noindex).toBe(true);
  });
  it("seoHead emite robots noindex e some com canonical quando o painel marca", () => {
    const head = seoHead({
      title: "Licença",
      description: "D",
      path: "/licenca-cc-by-4-0",
      pagesSeo: { "/licenca-cc-by-4-0": { noindex: true } },
    });
    expect(head.meta.find((m) => m.name === "robots")?.content).toBe("noindex, nofollow");
    expect(head.links.some((l) => l.rel === "canonical")).toBe(false);
    expect(head.scripts).toHaveLength(0);
  });
  it("sem a marca do painel a página segue indexável", () => {
    const head = seoHead({ title: "Licença", description: "D", path: "/licenca-cc-by-4-0" });
    expect(head.meta.find((m) => m.name === "robots")?.content).toContain("index, follow");
    expect(head.links.some((l) => l.rel === "canonical")).toBe(true);
  });
});
