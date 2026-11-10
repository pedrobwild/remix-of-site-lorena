/**
 * Bloco "Projetos no mesmo bairro" da página de projeto (/portfolio/$slug),
 * auditoria de SEO rodada 4 (09/11/2026), ação 14: o portfólio tem 158 URLs
 * (58% do sitemap) e 112 delas recebiam até 3 links internos; a página de
 * projeto não listava nenhum outro projeto.
 *
 * Três camadas: a seleção (pura, determinística), o loader do servidor (lista
 * de projetos + descrições das fotos) e o HTML do servidor (renderToString).
 */
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  RELATED_PROJECTS_MAX,
  RELATED_PROJECTS_TITLE,
  selectRelatedProjects,
} from "@/lib/portfolioFilter";
import { formatAreaM2 } from "@/lib/formatArea";

type P = { id: string; slug: string; neighborhood: string | null; area_m2: number | null };
const p = (slug: string, neighborhood: string | null, area_m2: number | null): P => ({
  id: `id-${slug}`,
  slug,
  neighborhood,
  area_m2,
});

/** Vila Mariana com 6 projetos, Brooklin com 2, Moema com 1 e um sem bairro. */
const LISTA: P[] = [
  p("vm-a", "Vila Mariana", 24),
  p("vm-b", "Vila Mariana", 25),
  p("vm-c", "Vila Mariana", 26.5),
  p("vm-d", "vila mariana", 28.21),
  p("vm-e", "Vila Mariana ", 30),
  p("vm-f", "VILA MARIANA", 41),
  p("br-a", "Brooklin", 22),
  p("br-b", "Brooklin", 35),
  p("mo-a", "Moema", 27),
  p("sem-bairro", null, 29),
];

const slugs = (xs: { slug: string }[]) => xs.map((x) => x.slug);

describe("seleção dos projetos relacionados (pura)", () => {
  it("bairro com vizinhos suficientes: 4 do mesmo bairro, nunca o próprio, na ordem do anel", () => {
    const self = LISTA[1]; // vm-b
    const r = selectRelatedProjects(self, LISTA);
    expect(r.criterio).toBe("bairro");
    expect(slugs(r.items)).toEqual(["vm-c", "vm-d", "vm-e", "vm-f"]);
    // No fim da ordem alfabética, o anel volta para o começo.
    expect(slugs(selectRelatedProjects(LISTA[4], LISTA).items)).toEqual([
      "vm-f",
      "vm-a",
      "vm-b",
      "vm-c",
    ]);
  });

  it("bairro igual sem diferença de acento, caixa ou espaço", () => {
    const lista = [
      p("x", "Vila Olímpia", 25),
      p("y", "vila olimpia", 25),
      p("z", " VILA OLÍMPIA", 25),
      p("w", "Vila Olimpia", 25),
      p("v", "Moema", 25),
    ];
    const r = selectRelatedProjects(lista[0], lista);
    // Os 3 vizinhos de Vila Olímpia (anel a partir de "x") e 1 de metragem parecida.
    expect(slugs(r.items)).toEqual(["y", "z", "w", "v"]);
    expect(r.criterio).toBe("misto");
    expect(selectRelatedProjects(lista[1], lista.slice(0, 4)).criterio).toBe("bairro");
  });

  it("ordem estável: a mesma lista em outra ordem dá o mesmo resultado", () => {
    const embaralhada = [...LISTA].reverse();
    const trocada = [
      LISTA[5],
      LISTA[0],
      LISTA[9],
      LISTA[3],
      LISTA[7],
      LISTA[1],
      LISTA[8],
      LISTA[2],
      LISTA[6],
      LISTA[4],
    ];
    for (const self of LISTA) {
      const base = slugs(selectRelatedProjects(self, LISTA).items);
      expect(slugs(selectRelatedProjects(self, embaralhada).items)).toEqual(base);
      expect(slugs(selectRelatedProjects(self, trocada).items)).toEqual(base);
    }
  });

  it("poucos vizinhos: completa com a metragem mais próxima e o título muda", () => {
    const self = LISTA[6]; // br-a, 22 m²: só br-b no bairro
    const r = selectRelatedProjects(self, LISTA);
    expect(r.criterio).toBe("misto");
    expect(slugs(r.items)).toEqual(["br-b", "vm-a", "vm-b", "vm-c"]);
    expect(RELATED_PROJECTS_TITLE.misto).toBe("Projetos no mesmo bairro e de metragem parecida");
  });

  it("nenhum vizinho no bairro: só metragem parecida", () => {
    const self = LISTA[8]; // mo-a, 27 m²
    const r = selectRelatedProjects(self, LISTA);
    expect(r.criterio).toBe("metragem");
    // 26,5 e 28,21 (distância 0,5 e 1,21), depois 25 e 29 (empate em 2: anel de slug a partir de mo-a).
    expect(slugs(r.items)).toEqual(["vm-c", "vm-d", "sem-bairro", "vm-b"]);
    expect(RELATED_PROJECTS_TITLE.metragem).toBe("Projetos de metragem parecida");
    expect(selectRelatedProjects(LISTA[9], LISTA).criterio).toBe("metragem");
  });

  it("sem metragem e sem vizinhos: outros projetos, sem prometer metragem parecida", () => {
    const lista = [...LISTA, p("so-nome", null, null)];
    const r = selectRelatedProjects(lista[10], lista);
    expect(r.criterio).toBe("outros");
    expect(r.items).toHaveLength(RELATED_PROJECTS_MAX);
    expect(RELATED_PROJECTS_TITLE.outros).toBe("Outros projetos da Bewild");
  });

  it("nunca lista o próprio projeto nem repete um projeto (mesmo id ou slug duplicado)", () => {
    const lista = [...LISTA, { ...LISTA[2] }, { ...LISTA[1], id: "outro-id" }];
    for (const self of LISTA) {
      const r = selectRelatedProjects(self, lista);
      expect(slugs(r.items)).not.toContain(self.slug);
      expect(new Set(slugs(r.items)).size).toBe(r.items.length);
    }
  });

  it("toda página ganha 4 links para outros projetos e cada projeto do bairro recebe links dos vizinhos", () => {
    const entrada = new Map<string, number>();
    for (const self of LISTA) {
      const r = selectRelatedProjects(self, LISTA);
      expect(r.items).toHaveLength(4);
      for (const it of r.items) entrada.set(it.slug, (entrada.get(it.slug) ?? 0) + 1);
    }
    // Anel: com 6 projetos no bairro, cada um é linkado pelos 4 anteriores.
    for (const s of ["vm-a", "vm-b", "vm-c", "vm-d", "vm-e", "vm-f"]) {
      expect(entrada.get(s), s).toBeGreaterThanOrEqual(4);
    }
  });

  it("lista pequena: devolve só o que existe", () => {
    const lista = [p("a", "Moema", 20), p("b", "Moema", 21)];
    expect(slugs(selectRelatedProjects(lista[0], lista).items)).toEqual(["b"]);
    expect(selectRelatedProjects(lista[0], [lista[0]]).items).toEqual([]);
  });
});

// --- loader do servidor ------------------------------------------------------

const db = vi.hoisted(() => ({
  project: null as Record<string, unknown> | null,
  list: [] as Record<string, unknown>[],
  peers: [] as Record<string, unknown>[],
}));
const rpc = vi.hoisted(() => vi.fn());

vi.mock("@/integrations/supabase/client", () => {
  const from = () => {
    let cols = "";
    const chain: Record<string, unknown> = {};
    chain.select = (c: string) => {
      cols = c;
      return chain;
    };
    for (const k of ["eq", "neq", "order", "limit"]) chain[k] = () => chain;
    chain.maybeSingle = async () => ({ data: db.project, error: null });
    // Lista do portfólio (tem slug e capa) × lista de pares do título (tem status).
    chain.then = (res: (v: unknown) => unknown) =>
      res(
        !cols.includes("cover_url")
          ? { data: db.peers, error: null }
          : db.list
            ? { data: db.list, error: null }
            : { data: null, error: { message: "fora do ar" } }
      );
    return chain;
  };
  return { supabase: { from } };
});
vi.mock("@/integrations/supabase/publicRest", () => ({ publicRpc: rpc }));
vi.mock("@/lib/notFoundLog", () => ({ lookupActiveRedirect: async () => null }));

const capa = (slug: string) =>
  `https://cdn.test/storage/v1/object/public/project-images/${slug}.png`;

function row(
  slug: string,
  neighborhood: string | null,
  area_m2: number | null,
  title = slug.toUpperCase()
) {
  return {
    id: `id-${slug}`,
    slug,
    title,
    cover_url: capa(slug),
    project_type: "short_stay",
    neighborhood,
    location: "São Paulo",
    area_m2,
    duration: null,
    sort_order: 0,
    created_at: "2026-10-01T00:00:00Z",
    ready_gallery_urls: [],
    budget_range: null,
  };
}

const FULL = {
  ...row("vm-b", "Vila Mariana", 25, "AB - STUDIO VILA MARIANA"),
  status: null,
  summary: null,
  intro: null,
  challenge: null,
  solution: null,
  result_text: null,
  scope: [],
  testimonial: null,
  testimonial_author: null,
  cover_alt: null,
  before_image_url: null,
  after_image_url: null,
  gallery_urls: [],
  og_image_url: null,
  seo_title: null,
  seo_description: null,
};

const LISTA_BANCO = [
  row("vm-a", "Vila Mariana", 24, "CD - STUDIO DOMINGOS"),
  row("vm-b", "Vila Mariana", 25, "AB - STUDIO VILA MARIANA"),
  row("vm-c", "Vila Mariana", 26.5),
  row("vm-d", "Vila Mariana", 28.21, "EF - LOFT RODRIGUES"),
  row("vm-e", "Vila Mariana", 30),
  row("br-a", "Brooklin", 22),
  row("mo-a", "Moema", 27),
];

beforeEach(() => {
  db.project = FULL;
  db.list = LISTA_BANCO;
  db.peers = LISTA_BANCO.map(
    ({ id, title, neighborhood, location, area_m2, project_type, created_at }) => ({
      id,
      title,
      neighborhood,
      location,
      area_m2,
      project_type,
      created_at,
      status: null,
      seo_title: null,
    })
  );
  rpc.mockReset();
  rpc.mockImplementation(async (_fn: string, { p_urls }: { p_urls: string[] }) => ({
    data: p_urls
      .filter((u) => u.endsWith("vm-d.png"))
      .map((url) => ({ url, alt: "Sala com marcenaria azul e sofá cinza" })),
    error: null,
  }));
});

describe("loadProjectContent traz os relacionados no servidor", () => {
  it("cards com nome sem código, bairro, metragem e capa; a descrição da capa vem junto", async () => {
    const { loadProjectContent } = await import("@/lib/contentLoaders");
    const data = await loadProjectContent("vm-b");
    expect(data.related?.criterio).toBe("bairro");
    expect(data.related?.bairro).toBe("Vila Mariana");
    expect(data.related?.items.map((i) => i.slug)).toEqual(["vm-c", "vm-d", "vm-e", "vm-a"]);
    const d = data.related!.items[1];
    expect(d).toEqual({
      slug: "vm-d",
      title: "Loft Rodrigues",
      neighborhood: "Vila Mariana",
      area_m2: 28.21,
      cover_url: capa("vm-d"),
    });
    // A mesma consulta de descrições cobre as capas dos cards.
    expect(data.alts?.[capa("vm-d")]).toBe("Sala com marcenaria azul e sofá cinza");
    const pedidas = rpc.mock.calls.flatMap((c) => (c[1] as { p_urls: string[] }).p_urls);
    expect(pedidas).toEqual(expect.arrayContaining(data.related!.items.map((i) => i.cover_url)));
  });

  it("lista de projetos fora do ar: a página sai sem o bloco, nunca com erro", async () => {
    db.list = null as unknown as Record<string, unknown>[];
    const { loadProjectContent } = await import("@/lib/contentLoaders");
    const data = await loadProjectContent("vm-b");
    expect(data.project?.slug).toBe("vm-b");
    expect(data.related ?? null).toBeNull();
  });
});

// --- HTML do servidor ---------------------------------------------------------

vi.mock("@/components/BwaNav", () => ({ default: () => null }));
vi.mock("@/components/BwaFooter", () => ({ default: () => null }));
vi.mock("@/components/MobileQuoteBar", () => ({ default: () => null }));
vi.mock("@/lib/useSeo", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/useSeo")>()),
  useSeo: () => {},
}));

async function htmlDoServidor(slug: string) {
  const { loadProjectContent } = await import("@/lib/contentLoaders");
  const { default: BewildProjectPage } = await import("@/pages/BewildProjectPage");
  const data = await loadProjectContent(slug);
  const html = renderToString(
    <BewildProjectPage
      slug={slug}
      initial={{ project: data.project ?? null, alts: data.alts }}
      initialPeers={data.peers ?? null}
      initialRelated={data.related ?? null}
    />
  ).replace(/<!-- -->/g, "");
  return { data, html };
}

const linksDeProjeto = (html: string) =>
  [...html.matchAll(/href="(\/portfolio\/[^"#?]+)"/g)].map((m) => m[1]);

describe("HTML do servidor da página de projeto", () => {
  it("sai com o bloco, 4 links para outros projetos, metragem formatada e alt da foto", async () => {
    const { html } = await htmlDoServidor("vm-b");
    expect(html).toContain(RELATED_PROJECTS_TITLE.bairro);
    expect(html).toContain("Outras reformas da Bewild na Vila Mariana");
    const links = linksDeProjeto(html);
    expect(links).toEqual([
      "/portfolio/vm-c",
      "/portfolio/vm-d",
      "/portfolio/vm-e",
      "/portfolio/vm-a",
    ]);
    expect(links).not.toContain("/portfolio/vm-b");
    expect(html).toContain(formatAreaM2(28.21)!);
    expect(html).toContain("28,21 m²");
    expect(html).toContain('alt="Sala com marcenaria azul e sofá cinza"');
    // Sem descrição cadastrada: o mesmo texto de reserva da capa da página.
    expect(html).toContain('alt="Studio Domingos — foto principal"');
    expect(html).toContain("Loft Rodrigues");
    expect(html).not.toContain("EF - LOFT");
  });

  it("toda página de projeto tem ao menos 4 links para outras páginas de projeto ou bairro", async () => {
    for (const s of LISTA_BANCO.map((r) => r.slug)) {
      db.project = { ...FULL, ...LISTA_BANCO.find((r) => r.slug === s)! };
      const { html } = await htmlDoServidor(s);
      const outros = new Set(
        [...html.matchAll(/href="(\/(?:portfolio|reforma)\/[^"#?]+)"/g)]
          .map((m) => m[1])
          .filter((h) => h !== `/portfolio/${s}`)
      );
      expect(outros.size, s).toBeGreaterThanOrEqual(4);
    }
  });

  it("sem vizinhos no bairro o título vira metragem parecida", async () => {
    db.project = { ...FULL, ...LISTA_BANCO.find((r) => r.slug === "mo-a")! };
    const { html } = await htmlDoServidor("mo-a");
    expect(html).toContain(RELATED_PROJECTS_TITLE.metragem);
    expect(html).not.toContain(RELATED_PROJECTS_TITLE.bairro);
    expect(linksDeProjeto(html)).toHaveLength(4);
  });
});
