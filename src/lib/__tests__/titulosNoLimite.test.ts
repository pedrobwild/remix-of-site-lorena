/**
 * Trava de tamanho de <title> e meta description (auditoria de SEO, rodada 4,
 * 09/11/2026, ação 16). O Google mostra cerca de 60 caracteres do título e
 * 160 da descrição e corta ou reescreve o resto. Na auditoria, 18 títulos de
 * projeto, 6 de bairro e 5 de páginas institucionais passavam de 60.
 *
 * O que entra aqui, montado como o servidor monta (loader + head() da rota):
 *  - toda página estática indexável (lista ROTAS_INDEXAVEIS de
 *    sitemapParidade.test.ts, lida como texto, igual ao jsonLdIntegridade);
 *  - toda página de vídeo do cadastro (src/content/videoPages.json);
 *  - todo bairro com texto próprio (src/content/bairros.ts) e todo bairro da
 *    lista de obras entregues (src/lib/bairrosSp.ts);
 *  - os geradores de título e descrição de projeto, com casos longos: os
 *    projetos reais vêm do banco.
 * Os títulos de ARTIGOS são escritos à mão no painel (meta_title) e saem
 * como estão: a correção deles é no banco, não aqui.
 *
 * Quebrou? Encurte o texto da página ou o gerador. Não aumente o limite.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

/*
 * Rede nenhuma: toda leitura do banco responde vazia na hora. Os loaders caem
 * nos textos padrão (é o que vai para o HTML quando o banco não tem nada
 * salvo) e os que só leem módulos de conteúdo devolvem o texto real.
 */
const { cliente } = vi.hoisted(() => {
  const VAZIO = { data: null, error: null, count: 0 };
  // Consulta encadeável (from().select().eq()…) que responde vazio ao ser aguardada.
  function consulta(): unknown {
    const proxy: unknown = new Proxy(function () {}, {
      get(_t, prop) {
        if (prop === "then") return (ok: (v: unknown) => unknown) => ok(VAZIO);
        return () => proxy;
      },
      apply: () => proxy,
    });
    return proxy;
  }
  const cliente = {
    from: () => consulta(),
    rpc: () => consulta(),
    functions: { invoke: () => Promise.resolve(VAZIO) },
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    },
    channel: () => ({ on: () => ({ subscribe: () => ({}) }), subscribe: () => ({}) }),
    removeChannel: () => {},
  };
  return { cliente };
});
vi.mock("@/integrations/supabase/client", () => ({ supabase: cliente }));
vi.mock("@/integrations/supabase/lazyClient", () => ({
  getSupabase: () => Promise.resolve(cliente),
}));
vi.mock("@/integrations/supabase/publicRest", () => ({
  publicRpc: () => Promise.resolve({ data: null, error: null }),
  publicSelect: () => Promise.resolve({ data: null, error: null }),
}));

import { VISIBLE_TITLE_MAX } from "@/lib/seoTitle";
import { BAIRROS_CONTENT } from "@/content/bairros";
import { BAIRROS } from "@/lib/bairrosSp";
import { neighborhoodSlug } from "@/lib/portfolioFilter";
import { bairroSeoFrom, projectSeoFrom } from "@/lib/seoLoaders";
import {
  projectMetaDescription,
  projectSeoTitleUnique,
  type ProjectSeoPeer,
} from "@/lib/projectSeo";
import { VIDEO_PAGES } from "@/lib/videoPages";

const TITULO_MAX = VISIBLE_TITLE_MAX; // 60
const DESCRICAO_MAX = 160;

const root = path.resolve(__dirname, "../../..");
const paridade = readFileSync(path.join(root, "src/lib/__tests__/sitemapParidade.test.ts"), "utf8");
const bloco = (nome: string) =>
  paridade.slice(paridade.indexOf(nome), paridade.indexOf("];", paridade.indexOf(nome)) + 2);
const ROTAS_INDEXAVEIS = [...bloco("const ROTAS_INDEXAVEIS").matchAll(/path: "([^"]+)"/g)].map(
  (m) => m[1]
);

const routeModules = import.meta.glob("/src/routes/*.tsx");
const INDEX_FILES: Record<string, string> = {
  "/": "index",
  "/portfolio": "portfolio.index",
  "/conteudos": "conteudos.index",
  "/videos": "videos.index",
  "/parceiros": "parceiros.index",
};
const fileFor = (p: string) =>
  `/src/routes/${INDEX_FILES[p] ?? p.slice(1).replace(/\//g, ".")}.tsx`;

type Meta = { title?: string; name?: string; content?: string };
type RouteOptions = {
  loader?: (ctx: unknown) => unknown;
  head?: (ctx: unknown) => { meta?: Meta[] };
};

/** Corre o loader (com teto de tempo) e devolve título e descrição do head(). */
async function textosDa(
  file: string,
  params: Record<string, string> = {}
): Promise<{ title: string; description: string }> {
  const load = routeModules[file];
  if (!load) throw new Error(`sem arquivo de rota ${file}`);
  const { Route } = (await load()) as { Route: { options: RouteOptions } };
  const ctx = {
    params,
    location: { search: {}, pathname: "/" },
    deps: {},
    context: {},
    matches: [],
    match: {},
  };
  let loaderData: unknown;
  if (Route.options.loader) {
    try {
      const teto = new Promise((resolve) => setTimeout(() => resolve(undefined), 5_000));
      loaderData = await Promise.race([Promise.resolve(Route.options.loader(ctx)), teto]);
    } catch {
      loaderData = undefined;
    }
  }
  const meta = Route.options.head?.({ ...ctx, loaderData })?.meta ?? [];
  return {
    title: meta.find((m) => m.title)?.title ?? "",
    description: meta.find((m) => m.name === "description")?.content ?? "",
  };
}

/*
 * Textos que ainda passam do limite no main de 10/11/2026 e já têm correção
 * em PR aberto da mesma rodada. A exceção vale só para ESTE texto exato:
 * quando o PR entra, o texto muda e a página passa a ser conferida como as
 * outras. Depois que os dois PRs entrarem, estas linhas podem sair.
 */
const CORRIGIDO_EM_OUTRO_PR = new Set([
  // Home, descrição de 170 (PR "home e página de studio com uma intenção cada", seo/home-intencao).
  "Reforma de studios em SP: visita e escopo, projeto, autorização do condomínio, obra civil, marcenaria e instalações finais, mobiliário e entrega. Prazo conforme o imóvel.",
  // /marcenaria, título de 61 (PR "/marcenaria com seção para incorporadoras", seo/marcenaria-b2b).
  "Marcenaria sob medida em São Paulo | Fábrica própria — Bewild",
]);

/** Problemas de tamanho, um por linha, para o erro dizer o que encurtar. */
function excessos(rotulo: string, t: { title: string; description: string }): string[] {
  const out: string[] = [];
  if (!t.title) out.push(`${rotulo}: sem título`);
  if (t.title.length > TITULO_MAX && !CORRIGIDO_EM_OUTRO_PR.has(t.title)) {
    out.push(`${rotulo}: título com ${t.title.length} (> ${TITULO_MAX}): "${t.title}"`);
  }
  if (t.description.length > DESCRICAO_MAX && !CORRIGIDO_EM_OUTRO_PR.has(t.description)) {
    out.push(
      `${rotulo}: descrição com ${t.description.length} (> ${DESCRICAO_MAX}): "${t.description}"`
    );
  }
  return out;
}

describe("títulos e descrições no limite: páginas estáticas", () => {
  it("lista de rotas lida de sitemapParidade.test.ts", () => {
    expect(ROTAS_INDEXAVEIS.length).toBeGreaterThan(25);
    expect(ROTAS_INDEXAVEIS).toContain("/marcenaria");
  });

  it.each(ROTAS_INDEXAVEIS)("%s", { timeout: 60_000 }, async (rota) => {
    const textos = await textosDa(fileFor(rota));
    expect(excessos(rota, textos)).toEqual([]);
  });

  it.each(VIDEO_PAGES.map((v) => v.slug))("/videos/%s", { timeout: 60_000 }, async (slug) => {
    const textos = await textosDa("/src/routes/videos.$slug.tsx", { slug });
    expect(excessos(`/videos/${slug}`, textos)).toEqual([]);
  });
});

describe("títulos e descrições no limite: bairros", () => {
  // Rótulo de cada bairro, na grafia da lista de obras entregues. "Paulista" é
  // como o cadastro de projetos escreve o bairro de /reforma/paulista.
  const rotulos = new Map([...BAIRROS, "Paulista"].map((b) => [neighborhoodSlug(b), b]));
  const sitemap = readFileSync(path.join(root, "src/content/snapshots/sitemap.xml"), "utf8");
  const noSitemap = [
    ...new Set([...sitemap.matchAll(/bewild\.com\.br\/reforma\/([a-z0-9-]+)</g)].map((m) => m[1])),
  ];
  const comTexto = [...new Set([...Object.keys(BAIRROS_CONTENT), ...noSitemap])];
  // Exemplo de portfólio do bairro: 12 projetos, metragens com duas casas.
  const projetos = (label: string) =>
    Array.from({ length: 12 }, (_, i) => ({
      neighborhood: label,
      cover_url: `/c${i}.jpg`,
      area_m2: i === 0 ? 21.3 : 25.73,
    }));

  it("todo bairro com texto próprio ou no sitemap tem rótulo", () => {
    expect(noSitemap.length).toBeGreaterThan(10);
    expect(comTexto.filter((slug) => !rotulos.has(slug))).toEqual([]);
  });

  it.each([...new Set([...comTexto, ...rotulos.keys()])])("/reforma/%s", (slug) => {
    const label = rotulos.get(slug)!;
    const seo = bairroSeoFrom(slug, projetos(label));
    expect(
      excessos(`/reforma/${slug}`, { title: seo.title, description: seo.description ?? "" })
    ).toEqual([]);
  });

  it("sem dados do banco, o título e a descrição padrão também cabem", () => {
    const seo = bairroSeoFrom("qualquer", null);
    expect(
      excessos("/reforma (padrão)", { title: seo.title, description: seo.description ?? "" })
    ).toEqual([]);
  });
});

describe("títulos e descrições no limite: geradores de projeto (casos longos)", () => {
  const LONGOS: ProjectSeoPeer[] = [
    {
      id: "a",
      title: "SB - SERGIPE BOUTIQUE APARTMENTS BY YOU",
      neighborhood: "Consolação",
      area_m2: 25,
      created_at: "2026-09-05T12:00:00Z",
    },
    {
      id: "b",
      title: "SB - SERGIPE BOUTIQUE APARTMENTS BY YOU",
      neighborhood: "Consolação",
      area_m2: 25,
      created_at: "2026-09-06T12:00:00Z",
    },
    {
      id: "c",
      title: "LC - HIGHLIGHTS PINHEIROS",
      neighborhood: "Avenida Salgado Filho",
      status: "em_projeto",
      area_m2: 23.61,
    },
    { id: "d", title: "LM - LM URBAN FLEX FLATS BELA CINTRA", status: "em_projeto", area_m2: 21.3 },
    {
      id: "e",
      title: "PS - EDIFÍCIO FORTUNE RESIDENCE",
      neighborhood: "Cerqueira César",
      area_m2: 44.57,
    },
    {
      id: "f",
      title: "Apartamento completo no empreendimento mais desejado da Vila Olímpia",
      neighborhood: "Vila Olímpia",
    },
    {
      id: "g",
      title: "KC - VIVAZ PRIME ALTO DO IPIRANGA",
      neighborhood: "Ipiranga",
      status: "em_obra",
      area_m2: 33.33,
    },
    {
      id: "h",
      title: "XX - RESIDENCIAL ALAMEDA DOS JARDINS PREMIUM",
      neighborhood: "Jardim Paulista",
      status: "em_projeto",
      area_m2: 141.75,
    },
    {
      id: "i",
      title: "XX - RESIDENCIAL ALAMEDA DOS JARDINS PREMIUM",
      neighborhood: "Jardim Paulista",
      status: "em_projeto",
      area_m2: 141.75,
    },
    {
      id: "j",
      title: "XX - RESIDENCIAL ALAMEDA DOS JARDINS PREMIUM",
      neighborhood: "Jardim Paulista",
      status: "em_projeto",
      area_m2: 141.75,
    },
    {
      id: "k",
      title: "AB - THE COLLECTION MOEMA",
      neighborhood: "Moema",
      area_m2: 28.21,
      created_at: "2026-08-25T00:51:00Z",
    },
    {
      id: "l",
      title: "CD - THE COLLECTION MOEMA",
      neighborhood: "Moema",
      area_m2: 28.21,
      created_at: "2026-09-25T21:20:00Z",
    },
    {
      id: "m",
      title: "EF - THE COLLECTION MOEMA",
      neighborhood: "Moema",
      area_m2: 31.5,
      created_at: "2026-09-26T21:20:00Z",
    },
    { id: "n", title: "ZZ - ONE", neighborhood: "Alto da Boa Vista", status: "em_obra" },
    {
      id: "o",
      title: "Cobertura duplex com terraço gourmet e piscina privativa no último andar",
      neighborhood: "Vila Nova Conceição",
      status: "em_projeto",
      area_m2: 212.48,
    },
  ];

  it("nenhum título gerado passa de 60, sozinho ou entre irmãs do mesmo prédio", () => {
    const longos = LONGOS.map((p) => projectSeoTitleUnique(p, LONGOS)).filter(
      (t) => t.length > TITULO_MAX
    );
    expect(longos).toEqual([]);
  });

  it("projetos do mesmo prédio nunca têm o mesmo título", () => {
    const titulos = LONGOS.map((p) => projectSeoTitleUnique(p, LONGOS));
    const repetidos = titulos.filter((t, i) => titulos.indexOf(t) !== i);
    expect(repetidos).toEqual([]);
  });

  it("nenhuma descrição gerada passa de 160, nem com texto longo do painel", () => {
    const longa = "Reforma completa de um apartamento de alto padrão em São Paulo, ".repeat(6);
    const casos = [
      ...LONGOS,
      { ...LONGOS[0], seo_description: longa },
      { ...LONGOS[4], summary: longa },
      { ...LONGOS[5], seo_description: "SB - SERGIPE: " + longa },
    ];
    const fora = casos
      .map((p) =>
        projectMetaDescription(
          p,
          "Reforma de apartamento em São Paulo com projeto, obra e marcenaria pela Bewild."
        )
      )
      .filter((d) => d.length > DESCRICAO_MAX);
    expect(fora).toEqual([]);
  });

  it("o montador da rota (projectSeoFrom) também fica no limite", () => {
    for (const p of LONGOS) {
      const seo = projectSeoFrom(
        { ...p, seo_description: null, summary: null, og_image_url: null, cover_url: null },
        LONGOS
      );
      expect(
        excessos(`projeto ${p.id}`, { title: seo.title, description: seo.description ?? "" })
      ).toEqual([]);
    }
    expect(projectSeoFrom(null, [], true).title.length).toBeLessThanOrEqual(TITULO_MAX);
  });
});

describe("servidor e navegador com o mesmo título nas páginas encurtadas", () => {
  const ler = (f: string) => readFileSync(path.join(root, f), "utf8");
  it.each([
    ["/reforma-de-cobertura-sao-paulo", "src/pages/ReformaCoberturaSpPage.tsx"],
    ["/indique-um-amigo", "src/pages/IndiquePage.tsx"],
    ["/mapa-do-site", "src/pages/MapaDoSitePage.tsx"],
    ["/como-funciona", "src/pages/ComoFuncionaPage.tsx"],
  ])(
    "%s: o useSeo da página usa o título e a descrição do head()",
    { timeout: 60_000 },
    async (rota, pagina) => {
      const { title, description } = await textosDa(fileFor(rota));
      const fonte = ler(pagina).replace(/\s+/g, " ");
      expect(fonte).toContain(`title: ${JSON.stringify(title)}`);
      if (rota === "/como-funciona") expect(fonte).toContain(JSON.stringify(description));
    }
  );
});

describe("/como-funciona: a Bewild emite RRT, não ART", () => {
  // Responsável técnico: Thiago Dantas, arquiteto e urbanista (CAU A162437-7).
  it("descrição e corpo da página falam de RRT", { timeout: 60_000 }, async () => {
    const { description } = await textosDa(fileFor("/como-funciona"));
    expect(description).toContain("RRT");
    expect(description).not.toMatch(/\bART\b/);
    for (const f of ["src/pages/ComoFuncionaPage.tsx", "src/content/etapas.ts"]) {
      const fonte = readFileSync(path.join(root, f), "utf8");
      expect(fonte, f).not.toMatch(/\bART\b|\bCREA\b/);
      expect(fonte, f).toMatch(/\bRRT\b/);
    }
  });
});
