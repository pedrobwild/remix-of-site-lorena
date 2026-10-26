/**
 * /sitemap.xml e /llms.txt gerados pelo servidor (src/lib/sitemapServer.ts).
 *
 * O cliente do banco é o fake dos testes do painel: cada tabela recebe linhas
 * de exemplo e o teste confere o XML e o texto montados, o memo e a resposta
 * quando o banco falha (503, nunca um sitemap vazio).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", async () => {
  const fake = await import("./helpers/supabaseFake");
  return { supabase: fake.fakeSupabase };
});

import { calls, resetFake, setResponder } from "./helpers/supabaseFake";
import { resetServerMemo } from "../serverMemo";
import { loadSitemapSaida, montarSaida, responderSitemap } from "../sitemapServer";
import { VIDEO_PAGES } from "../videoPages";
import { parseSitemapXml } from "../sitemap";

const BASE = "https://bewild.com.br";

const projects = [
  ...Array.from({ length: 4 }, (_, i) => ({
    slug: `ap-${i}-pinheiros`,
    neighborhood: "Pinheiros",
    cover_url: "https://cdn/x.png",
    created_at: "2026-10-01T12:00:00Z",
    content_updated_at: i === 0 ? "2026-10-20T12:00:00Z" : null,
  })),
  { slug: "ap-solo", neighborhood: "Moema", cover_url: "https://cdn/x.png", created_at: "2026-10-02T12:00:00Z", content_updated_at: null },
  { slug: "ap-sem-capa", neighborhood: "Brooklin", cover_url: null, created_at: "2026-10-02T12:00:00Z", content_updated_at: null },
];
const posts = [
  {
    slug: "studio-airbnb-pinheiros-quanto-rende",
    title: "Studio para Airbnb em Pinheiros",
    body: "<p>texto</p>",
    meta_description: "d",
    excerpt: "e",
    youtube_video_id: null,
    published_at: "2026-10-26T20:00:00Z",
    created_at: "2026-10-26T20:00:00Z",
    content_updated_at: null,
  },
  {
    slug: "antigo-com-video",
    title: "Artigo [antigo] com vídeo",
    body: '<p>x</p><iframe src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ" title="Vídeo"></iframe>',
    meta_description: "desc",
    excerpt: null,
    youtube_video_id: null,
    published_at: "2026-10-01T10:00:00Z",
    created_at: "2026-09-30T10:00:00Z",
    content_updated_at: "2026-10-05T10:00:00Z",
  },
];
const faqRows = [{ updated_at: "2026-10-10T00:00:00Z" }, { updated_at: "2026-09-01T00:00:00Z" }];

function responderComDados() {
  setResponder((call) => {
    if (call.table === "projects") return { data: projects };
    if (call.table === "bewild_posts") return { data: posts };
    if (call.table === "assistant_kb") return { data: faqRows };
    return { data: [] };
  });
}

beforeEach(() => {
  resetFake();
  resetServerMemo();
});

describe("montarSaida (puro)", () => {
  const saida = montarSaida({ projects, posts, faqRows });
  const locs = [...saida.xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

  it("é um sitemap válido, sem URL repetida, com páginas fixas, bairros, projetos, artigos e vídeos", () => {
    const parsed = parseSitemapXml(saida.xml);
    expect(parsed.total).toBe(locs.length);
    expect(locs).toContain(`${BASE}/`);
    expect(locs).toContain(`${BASE}/orcamento`);
    expect(locs).toContain(`${BASE}/reforma/pinheiros`);
    // Bairro com menos de 3 projetos, ou sem capa, não ganha página.
    expect(locs).not.toContain(`${BASE}/reforma/moema`);
    expect(locs).not.toContain(`${BASE}/reforma/brooklin`);
    for (const p of projects) expect(locs).toContain(`${BASE}/portfolio/${p.slug}`);
    for (const p of posts) expect(locs).toContain(`${BASE}/conteudos/${p.slug}`);
    for (const v of VIDEO_PAGES) expect(locs).toContain(`${BASE}/videos/${v.slug}`);
    expect(saida.urls).toBe(locs.length);
  });

  it("data cada página pela fonte certa", () => {
    const tag = (loc: string) => saida.xml.split("\n").find((l) => l.includes(`<loc>${loc}</loc>`)) ?? "";
    expect(tag(`${BASE}/portfolio`)).toContain("<lastmod>2026-10-20</lastmod>");
    expect(tag(`${BASE}/conteudos`)).toContain("<lastmod>2026-10-26</lastmod>");
    expect(tag(`${BASE}/faq`)).toContain("<lastmod>2026-10-10</lastmod>");
    expect(tag(`${BASE}/portfolio/ap-0-pinheiros`)).toContain("<lastmod>2026-10-20</lastmod>");
    expect(tag(`${BASE}/conteudos/antigo-com-video`)).toContain("<lastmod>2026-10-05</lastmod>");
    // Páginas fixas: data do git gravada em src/content/sitemapLastmod.json.
    expect(tag(`${BASE}/orcamento`)).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
    // Bairro: a mais nova entre os projetos e o código da página.
    expect(tag(`${BASE}/reforma/pinheiros`)).toMatch(/<lastmod>2026-10-2\d<\/lastmod>/);
  });

  it("vídeo no corpo do artigo sem página própria vai no artigo; os com página ficam só em /videos", () => {
    const artigo = saida.xml.split("\n").find((l) => l.includes("/conteudos/antigo-com-video</loc>")) ?? "";
    expect(artigo).toContain("<video:player_loc>https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ</video:player_loc>");
    for (const v of VIDEO_PAGES) {
      const linhas = saida.xml.split("\n").filter((l) => l.includes(v.youtubeId ?? v.file ?? "∅"));
      expect(linhas, v.slug).toHaveLength(1);
      expect(linhas[0]).toContain(`<loc>${BASE}/videos/${v.slug}</loc>`);
    }
  });

  it("escapa o XML e nunca expõe admin, LPs ou mockups", () => {
    expect(saida.xml).not.toContain("<loc>https://bewild.com.br/admin");
    for (const p of ["/o", "/p", "/mockups", "/graficos", "/buscar", "/mapa"]) {
      expect(locs.some((l) => l === `${BASE}${p}` || l.startsWith(`${BASE}${p}/`)), p).toBe(false);
    }
  });

  it("llms.txt lista artigos (mais novo primeiro), bairros com o rótulo do título e vídeos", () => {
    expect(saida.llms).toContain("- [Studio para Airbnb em Pinheiros](/conteudos/studio-airbnb-pinheiros-quanto-rende)\n- [Artigo antigo com vídeo](/conteudos/antigo-com-video)");
    expect(saida.llms).toContain("- [Reforma de apartamento em Pinheiros](/reforma/pinheiros): 4 projetos entregues");
    expect(saida.llms).not.toContain("/reforma/moema");
    for (const v of VIDEO_PAGES) expect(saida.llms).toContain(`](/videos/${v.slug}): ${v.kind}`);
    // O resto do modelo sai intacto.
    expect(saida.llms).toContain("# Bewild");
    expect(saida.llms).toContain("- [Vídeos](/videos):");
    expect(saida.llms).toContain("CNPJ: 47.350.338/0001-37");
  });
});

describe("loadSitemapSaida e responderSitemap", () => {
  it("lê projetos publicados e visíveis, artigos publicados e FAQ ativa, e guarda no memo por 10 minutos", async () => {
    responderComDados();
    // O memo só vale no servidor (sem `window`); o jsdom dos testes tem um.
    vi.stubGlobal("window", undefined);
    let a: Awaited<ReturnType<typeof loadSitemapSaida>>;
    try {
      a = await loadSitemapSaida();
      const b = await loadSitemapSaida();
      expect(b).toBe(a);
    } finally {
      vi.unstubAllGlobals();
    }
    const tabelas = calls.map((c) => c.table);
    expect(tabelas).toEqual(["projects", "bewild_posts", "assistant_kb"]);
    const ops = (t: string) => calls.find((c) => c.table === t)!.ops.map(([op, args]) => `${op}(${args.map((x) => JSON.stringify(x)).join(",")})`);
    expect(ops("projects")).toContain('eq("published",true)');
    expect(ops("projects")).toContain('eq("visible",true)');
    expect(ops("bewild_posts")).toContain('eq("published",true)');
    expect(ops("assistant_kb")).toContain('eq("ativo",true)');
    expect(a.xml).toContain("/conteudos/studio-airbnb-pinheiros-quanto-rende</loc>");
  });

  it("responde XML e texto com cache curto de borda", async () => {
    responderComDados();
    const xml = await responderSitemap("xml");
    expect(xml.status).toBe(200);
    expect(xml.headers.get("content-type")).toBe("application/xml; charset=utf-8");
    expect(xml.headers.get("cache-control")).toBe("public, max-age=0, s-maxage=600, stale-while-revalidate=86400");
    expect((await xml.text()).startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    const llms = await responderSitemap("llms");
    expect(llms.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(await llms.text()).toContain("<!-- posts:start -->\n- [");
  });

  it("banco fora do ar: 503 sem cache, nunca um sitemap vazio", async () => {
    setResponder(() => ({ data: null, error: { message: "fetch failed" } }));
    const r = await responderSitemap("xml");
    expect(r.status).toBe(503);
    expect(r.headers.get("cache-control")).toBe("no-store");
    expect(calls.map((c) => c.table)).toContain("projects");
  });

  it("resposta vazia por falha passageira não entra no memo", async () => {
    setResponder(() => ({ data: [] }));
    vi.stubGlobal("window", undefined);
    try {
      const vazio = await loadSitemapSaida();
      expect(vazio.artigos).toBe(0);
      responderComDados();
      const cheio = await loadSitemapSaida();
      expect(cheio.artigos).toBe(posts.length);
      expect(cheio.urls).toBeGreaterThan(vazio.urls);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
