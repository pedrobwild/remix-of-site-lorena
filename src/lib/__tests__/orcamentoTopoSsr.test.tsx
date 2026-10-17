/**
 * /orcamento por anúncio, montado como o servidor monta: a busca crua passa
 * pelo parser padrão do roteador (o mesmo do src/router.tsx), o loader da rota
 * escolhe a variante e o HTML do servidor (renderToString) sai com o H1 e o
 * subtítulo dela. O head() não muda com o anúncio: título, descrição e
 * canonical são os mesmos para todos (decisão de 17/10/2026).
 *
 * As URLs abaixo imitam as reais do Google Ads: o utm_content do anúncio vem
 * primeiro e o Google acrescenta um segundo, com o ID do grupo.
 */
import { renderToString } from "react-dom/server";
import { defaultParseSearch } from "@tanstack/react-router";
import { describe, expect, it, vi } from "vitest";

// Sem .env no CI: nada aqui pode instanciar o cliente do Supabase.
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: () => new Promise(() => {}),
    from: () => ({ select: () => new Promise(() => {}) }),
  },
}));
// O loader busca o SEO editável por server function; aqui vale o padrão.
vi.mock("@/lib/pageSeo.functions", async () => {
  const { resolvePageSeo } = await import("@/lib/pageSeo");
  return { loadPageSeo: async () => resolvePageSeo("/orcamento") };
});
vi.mock("@/lib/analytics", () => ({ trackNeighborhoodInterest: () => {} }));
vi.mock("@/components/BwaNav", () => ({ default: () => null }));
vi.mock("@/components/BwaFooter", () => ({ default: () => null }));
vi.mock("@/lib/useSeo", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/useSeo")>()),
  useSeo: () => {},
}));
vi.mock("@/lib/trackCta", () => ({ useCtaClickTracking: () => {} }));
vi.mock("@/lib/ga4", () => ({ trackEvent: () => {} }));
vi.mock("@/lib/useLeadSubmit", () => ({
  useLeadSubmit: () => ({ sending: false, submit: vi.fn(), isMounted: () => true }),
  focusField: () => {},
}));

import { Route } from "@/routes/orcamento";
import OrcamentoPage from "@/pages/OrcamentoPage";
import { TOPO_VARIANTES, type TopoVariante } from "@/content/pages/orcamento";
import { CUSTO_M2_MEDIANO } from "@/content/baseCusto";
import { CLIENTES_INDICACAO_PCT } from "@/content/provas";

type DadosDoLoader = { seo: { title: string; description: string }; topoVariante: TopoVariante };
const loader = Route.options.loader as unknown as (ctx: { location: { search: unknown } }) => Promise<DadosDoLoader>;
const head = Route.options.head as unknown as (ctx: { loaderData?: DadosDoLoader; matches: unknown[] }) => unknown;

/** O que o servidor faz com a URL: parse do roteador → loader → HTML. */
async function servidor(busca: string) {
  const dados = await loader({ location: { search: defaultParseSearch(busca) } });
  // O React separa texto e expressões com <!-- -->; para comparar frases, some com eles.
  const html = renderToString(<OrcamentoPage topoVariante={dados.topoVariante} />).replace(/<!-- -->/g, "");
  return { dados, html };
}

const ID_DO_GRUPO = "203089447080_826318773343";

const CASOS: Array<[string, TopoVariante]> = [
  ["", "padrao"],
  [`?utm_content=custo-orcamento&utm_content=${ID_DO_GRUPO}&gclid=TESTE`, "custo"],
  [`?utm_content=${ID_DO_GRUPO}&utm_content=custo-orcamento`, "padrao"],
  ["?utm_content=studio-ape-pequeno&utm_source=google&utm_medium=cpc", "studio"],
  ["?utm_content=studio_investidor", "investidor"],
  ["?utm_content=airbnb_b", "investidor"],
  ["?utm_content=aluguel_b", "investidor"],
  ["?utm_campaign=sea_investidor", "investidor"],
  ["?utm_content=arquitetura-reforma", "arquitetura"],
  ["?utm_content=198423601897_826487884274", "padrao"],
  ["?utm_content=123456&utm_campaign=123456", "padrao"],
  ["?utm_content=reforma-completa-ape-novo", "padrao"],
];

describe("/orcamento: H1 do anúncio no HTML do servidor", () => {
  it.each(CASOS)("%s → %s", async (busca, variante) => {
    const { dados, html } = await servidor(busca);
    expect(dados.topoVariante).toBe(variante);
    expect(html).toContain(`<h1 class="bwa-orc-h1">${TOPO_VARIANTES[variante].h1}</h1>`);
    expect(html).toContain(TOPO_VARIANTES[variante].subtitulo);
    // Um H1 só por página, qualquer que seja o anúncio.
    expect(html.match(/<h1\b/g)).toHaveLength(1);
  });

  it("o bloco fixo traz o custo mediano da base de contratos e a % de indicação", async () => {
    const { html } = await servidor("");
    expect(html).toContain("O que entra no orçamento da Bewild");
    expect(html).toContain(`é ${CUSTO_M2_MEDIANO} por m², com projeto, obra, marcenaria, mobília e eletros.`);
    // A prova dos anúncios "40% dos clientes: indicação" também está na página.
    expect(html).toContain(`${CLIENTES_INDICACAO_PCT}% dos clientes chegam por indicação.`);
  });
});

describe("/orcamento: o head não depende do anúncio", () => {
  it("o loader separa o SEO da variante", async () => {
    const { dados } = await servidor(`?utm_content=custo-orcamento&utm_content=${ID_DO_GRUPO}`);
    expect(Object.keys(dados).sort()).toEqual(["seo", "topoVariante"]);
    expect(dados.seo.title).toBeTruthy();
  });

  it("título, descrição, canonical e JSON-LD saem iguais para todo anúncio", async () => {
    const padrao = head({ loaderData: (await servidor("")).dados, matches: [] });
    expect(JSON.stringify(padrao)).toContain("https://bewild.com.br/orcamento");
    expect(JSON.stringify(padrao)).not.toContain("topoVariante");
    for (const [busca] of CASOS) {
      const { dados } = await servidor(busca);
      expect(head({ loaderData: dados, matches: [] })).toEqual(padrao);
    }
    // Sem dados do loader (falha na busca do SEO), o head cai no padrão da página.
    expect(head({ matches: [] })).toEqual(padrao);
  });
});
