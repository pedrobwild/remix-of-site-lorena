import { describe, it, expect, vi } from "vitest";

// contentJsonLd importa useBewildPosts, que instancia o cliente do Supabase no
// carregamento do módulo. Sem VITE_SUPABASE_URL no ambiente de teste (CI e
// sandbox não têm .env) o import quebra com "supabaseUrl is required". Mesmo
// mock dos demais testes de SEO (identidadeOficial, useSeo.head): este teste
// só exercita JSON-LD puro, nunca o backend.
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: () => new Promise(() => {}),
    from: () => ({ select: () => new Promise(() => {}) }),
  },
}));

import { seoHead } from "../routeHead";
import { postJsonLd, postListJsonLd } from "../contentJsonLd";
import type { BewildPost } from "../useBewildPosts";

const post = {
  id: "1",
  slug: "o-que-e-short-stay",
  title: "O que é short stay",
  excerpt: "Resumo",
  author: "Thiago Dantas do Amor",
  category: "guias",
  published_at: "2026-09-01T00:00:00Z",
  created_at: "2026-09-01T00:00:00Z",
  faq: [
    { question: "P1?", answer: "R1" },
    { question: "P2?", answer: "R2" },
  ],
} as unknown as BewildPost;

function typesOf(scripts: Array<{ children: string }>) {
  return scripts.map((s) => JSON.parse(s.children)["@type"] as string);
}

describe("JSON-LD no head() sem duplicação", () => {
  it("post: WebPage + Article (Person) + FAQPage, cada @type uma vez, sem BreadcrumbList solta", () => {
    const { scripts } = seoHead({ title: "T | Bewild", description: "D", path: "/conteudos/o-que-e-short-stay", jsonLd: postJsonLd(post) });
    const types = typesOf(scripts);
    expect(types).toEqual(["WebPage", "Article", "FAQPage"]);
    expect(new Set(types).size).toBe(types.length);
    expect(types).not.toContain("BreadcrumbList");
    const article = JSON.parse(scripts[1].children);
    expect(article.author["@type"]).toBe("Person");
    expect(article.publisher["@id"]).toBe("https://bewild.com.br/#org");
    const faq = JSON.parse(scripts[2].children);
    expect(faq.mainEntity.map((q: { name: string }) => q.name)).toEqual(["P1?", "P2?"]);
  });

  it("índice: CollectionPage + ItemList com um item por post", () => {
    const { scripts } = seoHead({ title: "C | Bewild", description: "D", path: "/conteudos", jsonLd: postListJsonLd([post, { ...post, slug: "b" }]) });
    expect(typesOf(scripts)).toEqual(["CollectionPage", "ItemList"]);
    expect(JSON.parse(scripts[1].children).itemListElement).toHaveLength(2);
  });

  it("noindex (404) não emite JSON-LD", () => {
    expect(seoHead({ title: "x", description: "y", path: "/conteudos/x", noindex: true, jsonLd: postJsonLd(post) }).scripts).toEqual([]);
  });
});
