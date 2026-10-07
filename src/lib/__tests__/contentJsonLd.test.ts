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
  it("vídeo de abertura sai no head SSR junto do Article, sem iframe no corpo", () => {
    const p = { ...post, body: "<p>Texto</p>", youtube_video_id: "El1Dxf7RBRk" };
    const { scripts } = seoHead({ title: "T", description: "D", path: `/conteudos/${p.slug}`, jsonLd: postJsonLd(p) });
    const nodes = scripts.map((s) => JSON.parse(s.children));
    const video = nodes.find((n) => n["@type"] === "VideoObject");
    expect(video.name).toBe("Como reformar um studio gastando menos: 4 obras que raramente se pagam");
    expect(video.description).toBe(p.excerpt);
    expect(video.uploadDate).toBe(p.published_at);
    expect(video.embedUrl).toBe("https://www.youtube.com/embed/El1Dxf7RBRk");
    expect(video.contentUrl).toBe("https://www.youtube.com/watch?v=El1Dxf7RBRk");
    expect(video.publisher.name).toBe("Bewild Arquitetura & Reformas");
    expect(nodes.find((n) => n["@type"] === "Article").video["@id"]).toBe(video["@id"]);
    expect(postJsonLd({ ...p, body: '<iframe src="https://www.youtube-nocookie.com/embed/El1Dxf7RBRk"></iframe>' }).filter((n) => n["@type"] === "VideoObject")).toHaveLength(1);
    expect(postJsonLd({ ...p, youtube_video_id: "inválido" }).some((n) => n["@type"] === "VideoObject")).toBe(false);
  });
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

  it("post com vídeo do YouTube: emite VideoObject com miniatura e embedUrl", () => {
    const body = '<p>x</p><iframe src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ" title="Tour pelo studio"></iframe>';
    const { scripts } = seoHead({ title: "T | Bewild", description: "D", path: "/conteudos/o-que-e-short-stay", jsonLd: postJsonLd({ ...post, body }) });
    expect(typesOf(scripts)).toEqual(["WebPage", "Article", "VideoObject", "FAQPage"]);
    const video = JSON.parse(scripts[2].children);
    expect(video.name).toBe("Tour pelo studio");
    expect(video.embedUrl).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(video.thumbnailUrl[0]).toBe("https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
    expect(video.uploadDate).toBeTruthy();
  });

  it("trecho citado (?start=) vira Clip com startOffset e endOffset", () => {
    const clipOf = (src: string, id: string) => {
      const nodes = postJsonLd({ ...post, body: `<iframe src="${src}" title="Trecho"></iframe>` });
      const v = nodes.find((n) => n["@type"] === "VideoObject" && String(n.url).includes(id)) as Record<string, unknown>;
      return (v.hasPart as Array<Record<string, unknown>> | undefined)?.[0];
    };
    // Sem end= no embed: fim = duração cadastrada (pQjZeD8nYEE tem PT9M49S = 589 s).
    const real = clipOf("https://www.youtube-nocookie.com/embed/pQjZeD8nYEE?start=467", "pQjZeD8nYEE");
    expect(real).toMatchObject({ "@type": "Clip", startOffset: 467, endOffset: 589 });
    expect(real?.url).toBe("https://www.youtube.com/watch?v=pQjZeD8nYEE&t=467s");
    // Com end= no embed: o fim marcado tem prioridade.
    expect(clipOf("https://www.youtube-nocookie.com/embed/pQjZeD8nYEE?start=467&end=520", "pQjZeD8nYEE")).toMatchObject({ startOffset: 467, endOffset: 520 });
    // Sem duração cadastrada e sem end=: nada de Clip (evita o aviso de endOffset ausente).
    expect(clipOf("https://www.youtube-nocookie.com/embed/El1Dxf7RBRk?start=30", "El1Dxf7RBRk")).toBeUndefined();
  });

  it("post com vídeo incorporado ganha um VideoObject com capa, arquivo e data do post", () => {
    const withVideo = {
      ...post,
      meta_description: "Resumo do pilar",
      body:
        '<p>Intro</p>\n<figure>\n  <video controls poster="/videos/pilar-poster.jpg" aria-label="Vídeo: resumo da análise">\n    <source src="/videos/pilar.mp4" type="video/mp4">\n  </video>\n  <figcaption>A análise em 2 minutos</figcaption>\n</figure>',
    } as unknown as BewildPost;
    const nodes = postJsonLd(withVideo);
    const video = nodes.find((n) => n["@type"] === "VideoObject") as Record<string, unknown>;
    expect(video).toBeTruthy();
    expect(video.name).toBe("resumo da análise");
    expect(video.description).toBe("Resumo do pilar");
    expect(video.thumbnailUrl).toEqual(["https://bewild.com.br/videos/pilar-poster.jpg"]);
    expect(video.contentUrl).toBe("https://bewild.com.br/videos/pilar.mp4");
    expect(video.uploadDate).toBe("2026-09-01T00:00:00Z");
    // Sem vídeo no corpo, nada de VideoObject.
    expect(postJsonLd({ ...post, body: "<p>só texto</p>" } as unknown as BewildPost).some((n) => n["@type"] === "VideoObject")).toBe(false);
  });

  it("página de autor: ProfilePage com a Person no lugar do WebPage, sem Article, FAQ mantido", () => {
    const authorPost = { ...post, slug: "pedro-henrique-alves-ceo-bewild", author: "Equipe Bewild" } as unknown as BewildPost;
    const nodes = postJsonLd(authorPost);
    expect(nodes.map((n) => n["@type"])).toEqual(["FAQPage"]);
    const { scripts } = seoHead({
      title: "Pedro | Bewild",
      description: "D",
      path: "/conteudos/pedro-henrique-alves-ceo-bewild",
      ogType: "profile",
      jsonLd: nodes,
      pageJsonLd: { "@type": "ProfilePage", mainEntity: { "@type": "Person", name: "Pedro Henrique Alves" } },
    });
    expect(typesOf(scripts)).toEqual(["ProfilePage", "FAQPage"]);
    const page = JSON.parse(scripts[0].children);
    expect(page.mainEntity.name).toBe("Pedro Henrique Alves");
    // O resto do nó da página continua lá (endereço, trilha).
    expect(page["@id"]).toBe("https://bewild.com.br/conteudos/pedro-henrique-alves-ceo-bewild#webpage");
    expect(page.breadcrumb.itemListElement).toHaveLength(3);
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
