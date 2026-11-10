/**
 * Páginas de bairro com intenção de orçamento (auditoria de SEO, rodada 4,
 * 09/11/2026, ação 6). As consultas "orçamento de reforma completa de
 * apartamento em <bairro>" mostravam o artigo "por bairro" no lugar da página
 * do bairro. Cada /reforma/<bairro> agora:
 *  - abre, no HTML do servidor e antes da lista de projetos, com a faixa de
 *    custo por m² da CIDADE (BASE_CUSTO: base de contratos, edição e
 *    exclusões; nunca mediana do bairro) e o botão "Solicitar orçamento" para
 *    /orcamento, sem utm;
 *  - tem 6 perguntas no FAQ, as mesmas no HTML e no FAQPage do head();
 *  - Bela Vista ganha texto próprio (passa de 350 palavras);
 *  - Brooklin cita a sede (Rua Pitu 72, sala 115).
 * E /orcamento ganha um H2 com "reforma turnkey" e links para as 16 páginas.
 *
 * A lista de bairros vem do retrato do sitemap e do llms.txt publicados
 * (src/content/snapshots), para o teste acompanhar as páginas que existem.
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
vi.mock("@/lib/useSeo", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/useSeo")>()),
  useSeo: () => {},
}));
vi.mock("@/lib/trackCta", () => ({ useCtaClickTracking: () => {} }));
vi.mock("@/lib/ga4", () => ({ trackEvent: () => {} }));
vi.mock("@/lib/analytics", () => ({ trackNeighborhoodInterest: () => {} }));
vi.mock("@/lib/useLeadSubmit", () => ({
  useLeadSubmit: () => ({ sending: false, submit: vi.fn(), isMounted: () => true }),
  focusField: () => {},
  browserUserAgent: () => "",
  collectLeadAttribution: () => ({}),
}));
// O loader da rota lê a lista de projetos do banco; aqui ela vem da fixture.
vi.mock("@/lib/contentLoaders", async () => {
  const { bairroSeoFrom } = await import("@/lib/seoLoaders");
  return {
    loadBairroContent: async (slug: string) => ({
      seo: bairroSeoFrom(slug, PROJETOS),
      projects: PROJETOS,
    }),
  };
});

import BairroPage from "@/pages/BairroPage";
import OrcamentoPage from "@/pages/OrcamentoPage";
import { Route as BairroRoute } from "@/routes/reforma.$slug";
import { BAIRROS_CONTENT, bairroContent } from "@/content/bairros";
import { BASE_CUSTO, CUSTO_M2_MEDIANO, brl } from "@/content/baseCusto";
import { INDICE_EDICAO } from "@/content/indiceCusto";
import { CLIENTES_FORA_DA_CAPITAL_PCT } from "@/content/provas";
import { BAIRROS_ORCAMENTO } from "@/content/pages/orcamento";
import { noBairro } from "@/lib/bairroSeo";
import type { BewildProject } from "@/lib/useBewildProjects";

const root = path.resolve(__dirname, "../../..");
const ler = (p: string) => readFileSync(path.join(root, p), "utf8");

/** As 16 páginas /reforma/<bairro> publicadas (retrato do sitemap) e o rótulo de cada uma (llms.txt). */
const SLUGS = [
  ...new Set(
    [...ler("src/content/snapshots/sitemap.xml").matchAll(/\/reforma\/([a-z0-9-]+)</g)].map(
      (m) => m[1]
    )
  ),
].sort();
const ROTULOS: Record<string, string> = Object.fromEntries(
  [
    ...ler("src/content/snapshots/llms.txt").matchAll(
      /^- \[Reforma de apartamento (?:no|na|nos|em) ([^\]]+)\]\(\/reforma\/([a-z0-9-]+)\)/gm
    ),
  ].map((m) => [m[2], m[1]])
);

const PROJETOS: BewildProject[] = SLUGS.flatMap((slug) =>
  [0, 1, 2].map(
    (i) =>
      ({
        id: `${slug}-${i}`,
        slug: `${slug}-${i}`,
        title: `Studio ${ROTULOS[slug]} ${i + 1}`,
        cover_url: "/images/hero-slides/rodrigo-1-lg.jpg",
        project_type: "short_stay",
        neighborhood: ROTULOS[slug],
        location: null,
        area_m2: 24 + i,
        duration: null,
        sort_order: i,
        created_at: "2026-09-01T12:00:00Z",
        ready_gallery_urls: [],
        budget_range: null,
      }) as unknown as BewildProject
  )
);

/** Texto como o React escreve no HTML, sem os marcadores entre texto e expressão. */
const html = (slug: string) =>
  renderToString(<BairroPage slug={slug} initialProjects={PROJETOS} />).replace(/<!-- -->/g, "");
const decode = (s: string) =>
  s
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
const faqVisivel = (h: string) =>
  [...h.matchAll(/<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/g)].map((m) => ({
    q: decode(m[1]),
    a: decode(m[2]),
  }));
const palavras = (h: string) => {
  const main = h.slice(h.indexOf("<main"), h.indexOf("</main>"));
  return decode(main.replace(/<(form|script|style)[\s\S]*?<\/\1>/g, " ").replace(/<[^>]+>/g, " "))
    .split(/\s+/)
    .filter((w) => /[\p{L}\d]/u.test(w)).length;
};

type Head = { scripts?: Array<{ type?: string; children?: string }> };
const loader = BairroRoute.options.loader as unknown as (ctx: {
  params: { slug: string };
}) => Promise<unknown>;
const head = BairroRoute.options.head as unknown as (ctx: {
  loaderData: unknown;
  params: { slug: string };
  matches: unknown[];
}) => Head;

describe("lista de páginas de bairro lida dos retratos publicados", () => {
  it("16 páginas, todas com rótulo", () => {
    expect(SLUGS).toHaveLength(16);
    for (const slug of SLUGS) expect(ROTULOS[slug], slug).toBeTruthy();
  });
});

describe("FAQ das páginas de bairro: 6 perguntas de orçamento e decisão", () => {
  it.each(Object.keys(BAIRROS_CONTENT))("%s tem 6 perguntas, sem repetir", (slug) => {
    const faq = BAIRROS_CONTENT[slug].faq;
    expect(faq).toHaveLength(6);
    expect(new Set(faq.map((f) => f.q)).size).toBe(6);
  });

  it.each(SLUGS)("%s tem texto próprio", (slug) => {
    expect(bairroContent(slug), slug).not.toBeNull();
  });

  it.each(SLUGS)(
    "%s responde custo, prazo, pedido de orçamento, atendimento, imóvel antigo e dono que mora fora",
    (slug) => {
      const faq = BAIRROS_CONTENT[slug].faq;
      const achar = (re: RegExp) => faq.find((f) => re.test(f.q));
      const custo = achar(/^Quanto custa/);
      expect(custo?.a, slug).toContain(`${BASE_CUSTO.contratos} contratos`);
      expect(custo?.a, slug).toContain("não uma mediana específica do bairro");
      const prazo = achar(/^Quanto tempo/);
      expect(prazo?.a, slug).toMatch(/contrato/);
      expect(prazo?.a, slug).toContain(
        "5 dias úteis depois do projeto aprovado e da autorização do condomínio"
      );
      expect(achar(/orçamento/i)?.a, slug).toMatch(/formulário de orçamento/);
      const atende = faq.find((f) => /15 anos/.test(f.a));
      expect(atende?.a, slug).toMatch(/cidade de São Paulo/);
      expect(atende?.a, slug).toMatch(/mais de 15 anos/);
      const fora = faq.find((f) => f.a.includes(`${CLIENTES_FORA_DA_CAPITAL_PCT}% dos clientes`));
      expect(fora?.a, slug).toMatch(/Bwild Workflow/);
    }
  );

  it("nenhum texto de bairro diz que a Bewild reforma prédio antigo nem cita ART (o responsável técnico emite RRT)", () => {
    for (const [slug, c] of Object.entries(BAIRROS_CONTENT)) {
      const texto = [...c.intro, ...c.faq.flatMap((f) => [f.q, f.a])].join(" ");
      expect(texto, slug).not.toMatch(/\bART\b/);
      expect(texto, slug).not.toMatch(
        /nos antigos|em prédios? antigos?,|Prédio antigo .*: dá para/i
      );
    }
  });
});

describe("HTML do servidor de /reforma/<bairro>", () => {
  it.each(SLUGS)(
    "%s abre com a faixa de custo da cidade e o botão para /orcamento, antes dos projetos",
    (slug) => {
      const h = html(slug);
      const faixa = `${brl(BASE_CUSTO.m2P25)} a ${brl(BASE_CUSTO.m2P75)} por m²`;
      const iFaixa = h.indexOf(faixa);
      const iBotao = h.search(/<a[^>]*href="\/orcamento"[^>]*>Solicitar orçamento/);
      const iProjetos = h.indexOf('class="bwh-projects"');
      expect(iFaixa, slug).toBeGreaterThan(-1);
      expect(iBotao, slug).toBeGreaterThan(-1);
      expect(iProjetos, slug).toBeGreaterThan(-1);
      expect(iFaixa, slug).toBeLessThan(iProjetos);
      expect(iBotao, slug).toBeLessThan(iProjetos);
      // Referência de São Paulo: base, edição, o que entra e o que não entra; nunca mediana do bairro.
      const topo = decode(h.slice(h.indexOf("bwh-bairro-custo"), iProjetos));
      expect(topo).toContain("Referência de São Paulo");
      expect(topo).toContain(`${BASE_CUSTO.contratos} contratos`);
      expect(topo).toContain(`edição de ${INDICE_EDICAO}`);
      expect(topo).toContain(CUSTO_M2_MEDIANO);
      expect(topo).toContain("sem aditivos");
      expect(topo).toContain("não uma mediana do bairro");
      expect(h).not.toMatch(/href="\/orcamento\?[^"]*utm_/);
    }
  );

  it.each(SLUGS)("%s: FAQ visível igual ao FAQPage do head()", async (slug) => {
    const h = html(slug);
    const visivel = faqVisivel(h);
    expect(visivel, slug).toHaveLength(6);
    const loaderData = await loader({ params: { slug } });
    const scripts = (head({ loaderData, params: { slug }, matches: [] }).scripts ?? []).filter(
      (s) => s.type === "application/ld+json"
    );
    const faqPage = scripts
      .map((s) => JSON.parse(s.children ?? "{}"))
      .find((n) => n["@type"] === "FAQPage") as {
      mainEntity: Array<{ name: string; acceptedAnswer: { text: string } }>;
    };
    expect(faqPage, slug).toBeTruthy();
    expect(faqPage.mainEntity.map((q) => ({ q: q.name, a: q.acceptedAnswer.text }))).toEqual(
      visivel
    );
  });

  it("Bela Vista tem texto próprio com mais de 350 palavras na página", () => {
    const c = bairroContent("bela-vista")!;
    const doConteudo = [...c.intro, ...c.faq.flatMap((f) => [f.q, f.a])]
      .join(" ")
      .split(/\s+/).length;
    expect(doConteudo).toBeGreaterThan(350);
    expect(palavras(html("bela-vista"))).toBeGreaterThan(350);
  });

  it("Brooklin cita a sede da Bewild no bairro", () => {
    expect(decode(html("brooklin"))).toContain("Rua Pitu 72, sala 115");
  });
});

describe("/orcamento linka as páginas de bairro", () => {
  const h = renderToString(<OrcamentoPage topoVariante="padrao" />).replace(/<!-- -->/g, "");

  it("H2 com reforma turnkey", () => {
    expect(h).toMatch(/<h2[^>]*>[^<]*reforma turnkey[^<]*<\/h2>/i);
  });

  it("a lista é a das 16 páginas publicadas", () => {
    expect(BAIRROS_ORCAMENTO.map((b) => b.slug).sort()).toEqual(SLUGS);
  });

  it.each(SLUGS)("link para /reforma/%s com o nome do bairro na âncora", (slug) => {
    const rotulo = ROTULOS[slug];
    expect(h).toContain(`<a href="/reforma/${slug}">Reforma ${noBairro(rotulo)}</a>`);
  });
});
