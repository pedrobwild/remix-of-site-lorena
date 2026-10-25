/**
 * Integridade do JSON-LD que sai no HTML do servidor (head() de cada rota).
 *
 * Mesmo estilo de sitemapParidade.test.ts, de onde lê as listas
 * ROTAS_INDEXAVEIS e NAO_INDEXAVEIS (como texto, para não duplicar). Para cada
 * rota indexável monta o head() sem rede (loaders com fixtures ou ausentes →
 * textos padrão), mais um /portfolio/:slug e um /conteudos/:slug de exemplo, e
 * falha se: JSON inválido; @type de primeiro nível repetido; url/image/logo/
 * item/thumbnailUrl/contentUrl/embedUrl relativa; @id fora de
 * https://bewild.com.br; datePublished/dateModified/uploadDate sem fuso.
 * Rotas noindex não podem ter JSON-LD de página (só o grafo geral do root).
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { postHeadData, postListJsonLd, projectListJsonLd, projectPageJsonLd } from "@/lib/routeHeadData";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: () => new Promise(() => {}),
    from: () => ({ select: () => new Promise(() => {}) }),
    auth: { getSession: () => new Promise(() => {}), onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }) },
    functions: { invoke: () => new Promise(() => {}) },
  },
}));

import { ORG_JSONLD } from "@/lib/orgJsonLd";

const root = path.resolve(__dirname, "../../..");
const paridade = readFileSync(path.join(root, "src/lib/__tests__/sitemapParidade.test.ts"), "utf8");
const bloco = (nome: string) => paridade.slice(paridade.indexOf(nome), paridade.indexOf("};", paridade.indexOf(nome)) + 2);
const ROTAS_INDEXAVEIS = [...bloco("const ROTAS_INDEXAVEIS").matchAll(/path: "([^"]+)"/g)].map((m) => m[1]);
const NAO_INDEXAVEIS = [...bloco("const NAO_INDEXAVEIS").matchAll(/^\s*"(\/[^"]*)":/gm)].map((m) => m[1]);

const routeModules = import.meta.glob("/src/routes/*.tsx");
const INDEX_FILES: Record<string, string> = {
  "/": "index",
  "/portfolio": "portfolio.index",
  "/conteudos": "conteudos.index",
  "/videos": "videos.index",
  "/parceiros": "parceiros.index",
};
const fileFor = (p: string) => `/src/routes/${INDEX_FILES[p] ?? p.slice(1).replace(/\//g, ".")}.tsx`;

const PROJETO = {
  id: "p1",
  slug: "studio-vila-olimpia",
  title: "Studio Vila Olímpia",
  cover_url: "/images/hero-slides/rodrigo-1-lg.jpg",
  og_image_url: null,
  gallery_urls: [],
  neighborhood: "Vila Olímpia",
  project_type: "short_stay",
  area_m2: 28.21,
  created_at: "2026-09-01T12:00:00Z",
};
const POST = {
  id: "1",
  slug: "o-que-e-short-stay",
  title: "O que é short stay",
  excerpt: "Resumo",
  meta_description: "Resumo",
  author: "Pedro Alves",
  category: "guias",
  cover_image: "/images/blog/capa.jpg",
  body: '<p>Texto</p><iframe src="https://www.youtube-nocookie.com/embed/El1Dxf7RBRk" title="Vídeo"></iframe>',
  youtube_video_id: "El1Dxf7RBRk",
  featured: true,
  published: true,
  published_at: "2026-09-01T12:00:00Z",
  created_at: "2026-09-01T12:00:00Z",
  updated_at: "2026-09-05T15:30:00+00:00",
  faq: [{ question: "P?", answer: "R" }],
};
const SEO = { title: "T | Bewild", description: "D" };

/** loaderData de exemplo por rota (o resto usa undefined → textos padrão). */
// O JSON-LD agora é montado no loader (src/lib/routeHeadData.ts): as fixtures
// passam pelo mesmo montador que o loader usa.
const FIXTURES: Record<string, unknown> = {
  "/portfolio": { projects: [PROJETO], jsonLd: projectListJsonLd([PROJETO] as never) },
  "/conteudos": { jsonLd: postListJsonLd([POST, { ...POST, id: "2", slug: "outro", featured: false }] as never) },
  "/faq": null,
};

type Script = { type?: string; children?: string };
type Head = { scripts?: Script[] };

async function headOf(routePath: string, file: string, loaderData: unknown, params: Record<string, string> = {}): Promise<Head> {
  const load = routeModules[file];
  if (!load) throw new Error(`sem arquivo de rota para ${routePath} (${file})`);
  const mod = (await load()) as { Route: { options: { head?: (ctx: unknown) => Head } } };
  return mod.Route.options.head?.({ loaderData, params, matches: [], match: {} }) ?? {};
}

const ldScripts = (h: Head) => (h.scripts ?? []).filter((s) => s.type === "application/ld+json");

const URL_KEYS = new Set(["url", "image", "logo", "item", "thumbnailUrl", "contentUrl", "embedUrl"]);
const DATE_KEYS = new Set(["datePublished", "dateModified", "uploadDate"]);
const TZ = /(Z|[+-]\d{2}:\d{2})$/;

function problemas(nodes: unknown[]): string[] {
  const out: string[] = [];
  const visit = (v: unknown, key: string) => {
    if (Array.isArray(v)) return v.forEach((x) => visit(x, key));
    if (typeof v === "string") {
      if (URL_KEYS.has(key) && !/^https:\/\//.test(v)) out.push(`${key} relativa: "${v}"`);
      if (key === "@id" && !v.startsWith("https://bewild.com.br")) out.push(`@id fora do domínio: ${v}`);
      if (DATE_KEYS.has(key) && !TZ.test(v)) out.push(`${key} sem fuso: ${v}`);
      return;
    }
    if (v && typeof v === "object") {
      const o = v as Record<string, unknown>;
      if (o["@type"] === "VideoObject" && !o.duration) out.push(`VideoObject sem duration: ${String(o.name ?? o["@id"])}`);
      for (const [k, x] of Object.entries(o)) visit(x, k);
    }
  };
  nodes.forEach((n) => visit(n, ""));
  const types = nodes.flatMap((n) => {
    const t = (n as Record<string, unknown>)["@type"];
    return t ? [String(t)] : [];
  });
  const repetidos = types.filter((t, i) => types.indexOf(t) !== i);
  if (repetidos.length) out.push(`@type repetido: ${repetidos.join(", ")}`);
  return out;
}

function parse(scripts: Script[]): unknown[] {
  return scripts.map((s) => JSON.parse(s.children ?? ""));
}

describe("JSON-LD no HTML do servidor: integridade", () => {
  it("lista de rotas lida de sitemapParidade.test.ts", () => {
    expect(ROTAS_INDEXAVEIS.length).toBeGreaterThan(20);
    expect(NAO_INDEXAVEIS).toContain("/o");
  });

  it("grafo geral do root é válido", () => {
    const graph = JSON.parse(ORG_JSONLD)["@graph"];
    expect(problemas(graph)).toEqual([]);
  });

  it("logo da Organization: PNG/SVG/WebP; PNG termina em -512.png e é quadrado", () => {
    const org = JSON.parse(ORG_JSONLD)["@graph"].find((n: Record<string, unknown>) => n["@type"] === "Organization");
    const logo = String(org.logo);
    expect(logo).toMatch(/\.(png|svg|webp)$/);
    if (logo.endsWith(".png")) {
      expect(logo).toMatch(/-512\.png$/);
      // Cabeçalho IHDR do PNG: largura e altura em big-endian nos bytes 16–23.
      const buf = readFileSync(path.join(__dirname, "../../../public", new URL(logo).pathname));
      expect([buf.readUInt32BE(16), buf.readUInt32BE(20)]).toEqual([512, 512]);
    }
  });

  it.each(ROTAS_INDEXAVEIS)("%s", { timeout: 60_000 }, async (rota) => {
    const head = await headOf(rota, fileFor(rota), FIXTURES[rota]);
    const nodes = parse(ldScripts(head));
    expect(problemas(nodes)).toEqual([]);
  });

  it("/portfolio/:slug (fixture de projeto)", { timeout: 60_000 }, async () => {
    const head = await headOf("/portfolio/$slug", "/src/routes/portfolio.$slug.tsx", { seo: SEO, project: PROJETO, peers: [], jsonLd: projectPageJsonLd(PROJETO as never) }, { slug: PROJETO.slug });
    const nodes = parse(ldScripts(head)) as Array<Record<string, unknown>>;
    expect(problemas(nodes)).toEqual([]);
    const work = nodes.find((n) => n["@type"] === "CreativeWork")!;
    expect(work["@id"]).toBe("https://bewild.com.br/portfolio/studio-vila-olimpia#projeto");
    expect(work.image).toBe("https://bewild.com.br/images/hero-slides/rodrigo-1-lg.jpg");
    expect(work.creator).toEqual({ "@id": "https://bewild.com.br/#local" });
  });

  it("/conteudos/:slug (fixture de post)", { timeout: 60_000 }, async () => {
    const head = await headOf("/conteudos/$slug", "/src/routes/conteudos.$slug.tsx", { seo: SEO, post: POST, bodyHtml: POST.body, head: postHeadData(POST as never, POST.body) }, { slug: POST.slug });
    const nodes = parse(ldScripts(head)) as Array<Record<string, unknown>>;
    expect(problemas(nodes)).toEqual([]);
    const article = nodes.find((n) => n["@type"] === "Article")!;
    expect(article.mainEntityOfPage).toBe("https://bewild.com.br/conteudos/o-que-e-short-stay");
    expect(article.datePublished).toBe("2026-09-01T09:00:00-03:00");
    expect(article.dateModified).toBe("2026-09-05T12:30:00-03:00");
    expect(article.publisher).toEqual({ "@id": "https://bewild.com.br/#org" });
    expect((article.author as Record<string, unknown>)["@id"]).toBe("https://bewild.com.br/#pedro-henrique-alves");
  });

  it("ItemList de /conteudos segue a ordem da tela (destaque primeiro)", async () => {
    const posts = [{ ...POST, id: "2", slug: "outro", featured: false }, POST];
    const head = await headOf("/conteudos", fileFor("/conteudos"), { posts, jsonLd: postListJsonLd(posts as never) });
    const list = parse(ldScripts(head)).find((n) => (n as Record<string, unknown>)["@type"] === "ItemList") as {
      itemListElement: Array<{ url: string }>;
    };
    expect(list.itemListElement.map((i) => i.url)).toEqual([
      "https://bewild.com.br/conteudos/o-que-e-short-stay",
      "https://bewild.com.br/conteudos/outro",
    ]);
  });

  it.each(NAO_INDEXAVEIS)("%s (noindex) não tem JSON-LD de página", { timeout: 60_000 }, async (rota) => {
    const head = await headOf(rota, fileFor(rota), undefined);
    expect(ldScripts(head)).toEqual([]);
  });
});
