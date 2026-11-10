/**
 * /reforma-de-apartamento-sao-paulo (auditoria de SEO, rodada 4, 09/11/2026,
 * ação 9): "reforma de apartamento pequeno" tem 110 buscas por mês e
 * "empresa de reforma de apartamento" aparece na posição 5 a 7. A página
 * ganha, no HTML do servidor:
 *  - a seção "Reforma de apartamento pequeno em São Paulo", com links para
 *    projetos de até 50 m² do portfólio (lidos no loader da rota) e para a
 *    página de studio, que segue dona das buscas de studio e kitnet;
 *  - o trecho "O que esperar de uma empresa de reforma de apartamento":
 *    preço fechado, prazo em contrato, responsável técnico com RRT e 5 anos
 *    de garantia.
 * Nada sobre reforma de apartamento antigo: a Bewild não atende imóvel com
 * mais de 15 anos.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// Sem .env no CI: nada aqui pode instanciar o cliente do Supabase.
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: () => new Promise(() => {}),
    from: () => ({ select: () => new Promise(() => {}) }),
  },
}));
vi.mock("@/components/BwaNav", () => ({ default: () => null }));
vi.mock("@/components/BwaFooter", () => ({ default: () => null }));
vi.mock("@/components/BwaImprensa", () => ({ default: () => null }));
vi.mock("@/lib/useSeo", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/useSeo")>()),
  useSeo: () => {},
}));
vi.mock("@/lib/trackCta", () => ({ useCtaClickTracking: () => {} }));

const PROJETOS = [
  {
    slug: "studio-pinheiros-21",
    title: "Studio Pinheiros",
    area_m2: 21.43,
    neighborhood: "Pinheiros",
    cover_url: "/a.jpg",
  },
  {
    slug: "apto-vila-mariana-41",
    title: "Apartamento Vila Mariana",
    area_m2: 41.34,
    neighborhood: "Vila Mariana",
    cover_url: "/b.jpg",
  },
  {
    slug: "apto-moema-50",
    title: "Apartamento Moema",
    area_m2: 50,
    neighborhood: "Moema",
    cover_url: "/c.jpg",
  },
  {
    slug: "apto-grande-62",
    title: "Apartamento Grande",
    area_m2: 62.5,
    neighborhood: "Moema",
    cover_url: "/d.jpg",
  },
  {
    slug: "sem-area",
    title: "Projeto sem área",
    area_m2: null,
    neighborhood: "Moema",
    cover_url: "/e.jpg",
  },
  { slug: "sem-capa-30", title: "Sem capa", area_m2: 30, neighborhood: "Moema", cover_url: null },
];
let lista: unknown[] | null = PROJETOS;
vi.mock("@/lib/contentLoaders", () => ({
  loadBairroLinks: async () => ({
    bairroPages: lista ? [{ slug: "moema", label: "Moema" }] : null,
  }),
  loadProjectList: async () => ({ projects: lista }),
}));

import { Route } from "@/routes/reforma-de-apartamento-sao-paulo";
import ReformaApartamentoSpPage from "@/pages/ReformaApartamentoSpPage";
import { SEO_DESCRIPTION, SEO_TITLE } from "@/content/pages/reforma-de-apartamento-sao-paulo.seo";

type Dados = {
  bairroPages: Array<{ slug: string; label: string }> | null;
  projetosPequenos: Array<{
    slug: string;
    nome: string;
    area: string;
    bairro: string | null;
  }> | null;
  seo: { title: string; description: string };
};
const loader = Route.options.loader as unknown as () => Promise<Dados>;
const head = Route.options.head as unknown as (ctx: { loaderData?: Dados; matches: unknown[] }) => {
  meta?: Array<Record<string, string>>;
};

/** O que o servidor faz: loader → HTML da página. */
async function servidor() {
  const dados = await loader();
  const html = renderToString(
    <ReformaApartamentoSpPage
      bairroPages={dados.bairroPages}
      projetosPequenos={dados.projetosPequenos}
    />
  ).replace(/<!-- -->/g, "");
  return { dados, html };
}
const secao = (html: string, id: string) => {
  const ini = html.indexOf(`id="${id}"`);
  return ini < 0 ? "" : html.slice(ini, html.indexOf("</section>", ini));
};

describe("/reforma-de-apartamento-sao-paulo: seção de apartamento pequeno no HTML do servidor", () => {
  it("H2 próprio, texto e links só para projetos de até 50 m² com capa", async () => {
    lista = PROJETOS;
    const { html } = await servidor();
    expect(html).toMatch(
      /<h2 class="bwa-servico-h2" id="apartamento-pequeno">Reforma de apartamento pequeno em São Paulo<\/h2>/
    );
    const s = secao(html, "apartamento-pequeno");
    expect(s).toContain('href="/portfolio/apto-moema-50"');
    expect(s).toContain('href="/portfolio/apto-vila-mariana-41"');
    expect(s).toContain('href="/portfolio/studio-pinheiros-21"');
    expect(s).not.toContain("/portfolio/apto-grande-62");
    expect(s).not.toContain("/portfolio/sem-area");
    expect(s).not.toContain("/portfolio/sem-capa-30");
    // Metragem pelo formatAreaM2 (vírgula decimal, sem arredondar).
    expect(s).toContain("41,34 m²");
    // Studio e kitnet continuam com a página de studio.
    expect(s).toContain('href="/reforma-de-studio-sao-paulo"');
    expect(s).toContain('href="/portfolio"');
  });

  it("maiores primeiro, no máximo 6", async () => {
    lista = Array.from({ length: 10 }, (_, i) => ({
      slug: `p-${i}`,
      title: `Projeto ${i}`,
      area_m2: 20 + i * 3,
      neighborhood: "Moema",
      cover_url: `/${i}.jpg`,
    }));
    const { dados } = await servidor();
    expect(dados.projetosPequenos?.map((p) => p.slug)).toEqual([
      "p-9",
      "p-8",
      "p-7",
      "p-6",
      "p-5",
      "p-4",
    ]);
  });

  it("sem a lista de projetos (banco fora), a seção sai com o link para o portfólio", async () => {
    lista = null;
    const { dados, html } = await servidor();
    expect(dados.projetosPequenos).toBeNull();
    const s = secao(html, "apartamento-pequeno");
    expect(s).toContain("Reforma de apartamento pequeno em São Paulo");
    expect(s).toContain('href="/portfolio"');
    expect(s).not.toContain('href="/portfolio/');
  });
});

describe("/reforma-de-apartamento-sao-paulo: o que esperar de uma empresa de reforma", () => {
  it("preço fechado, prazo em contrato, RRT do responsável técnico e 5 anos de garantia", async () => {
    lista = PROJETOS;
    const { html } = await servidor();
    const s = secao(html, "empresa-de-reforma");
    expect(html).toMatch(
      /<h2 class="bwa-servico-h2" id="empresa-de-reforma">O que esperar de uma empresa de reforma de apartamento<\/h2>/
    );
    expect(s).toContain("Preço fechado");
    expect(s).toContain("Prazo em contrato");
    expect(s).toContain("5 dias úteis depois do projeto aprovado e da autorização do condomínio");
    expect(s).toContain("RRT");
    expect(s).toContain("CAU A162437-7");
    expect(s).toContain("5 anos de garantia");
  });

  it("a página não fala de apartamento antigo nem de ART (o responsável técnico emite RRT)", async () => {
    lista = PROJETOS;
    const { html } = await servidor();
    const main = html.slice(html.indexOf("<main"), html.indexOf("</main>"));
    expect(main).not.toMatch(/apartamentos? antigos?/i);
    expect(main).not.toMatch(/\bART\b/);
  });
});

describe("/reforma-de-apartamento-sao-paulo: título e descrição", () => {
  const titulo = (h: ReturnType<typeof head>) => h.meta?.find((m) => "title" in m)?.title;
  const descricao = (h: ReturnType<typeof head>) =>
    h.meta?.find((m) => m.name === "description")?.content;

  it("o head() usa o mesmo título e a mesma descrição com e sem os dados do loader", async () => {
    lista = PROJETOS;
    const dados = await loader();
    expect(titulo(head({ loaderData: dados, matches: [] }))).toBe(SEO_TITLE);
    expect(titulo(head({ matches: [] }))).toBe(SEO_TITLE);
    expect(descricao(head({ loaderData: dados, matches: [] }))).toBe(SEO_DESCRIPTION);
    expect(descricao(head({ matches: [] }))).toBe(SEO_DESCRIPTION);
  });

  it("a página passa os projetos do loader para a seção", () => {
    const rota = readFileSync(
      path.resolve(__dirname, "../../routes/reforma-de-apartamento-sao-paulo.tsx"),
      "utf8"
    );
    expect(rota).toContain("projetosPequenos={data?.projetosPequenos ?? null}");
  });
});
