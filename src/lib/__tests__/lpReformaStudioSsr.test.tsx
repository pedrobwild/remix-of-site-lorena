/**
 * /lp/reforma-de-studio-sao-paulo (LP dos anúncios do Google, 02/11/2026),
 * montada como o servidor monta: a busca crua passa pelo parser do roteador,
 * o loader escolhe a variante do topo e o HTML do servidor sai com o H1 e o
 * lead dela. O head() é `noindex` e não muda com o anúncio; a página
 * orgânica /reforma-de-studio-sao-paulo continua intacta.
 */
import { renderToString } from "react-dom/server";
import { defaultParseSearch } from "@tanstack/react-router";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc: () => new Promise(() => {}), from: () => ({ select: () => new Promise(() => {}) }) },
}));
vi.mock("@/components/BwaNav", () => ({ default: () => null }));
vi.mock("@/components/BwaFooter", () => ({ default: () => null }));
vi.mock("@/components/MobileQuoteBar", () => ({ default: () => null }));
vi.mock("@/lib/useSeo", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/useSeo")>()),
  useSeo: () => {},
}));
vi.mock("@/lib/trackCta", () => ({ useCtaClickTracking: () => {} }));
vi.mock("@/lib/ga4", () => ({ trackEvent: () => {} }));
vi.mock("@/lib/useLeadSubmit", () => ({
  useLeadSubmit: () => ({ sending: false, outcome: null, submit: vi.fn(), isMounted: () => true }),
  focusField: () => {},
  collectLeadAttribution: () => ({}),
  browserUserAgent: () => null,
}));

import { Route } from "@/routes/lp.reforma-de-studio-sao-paulo";
import LpReformaStudioPage from "@/pages/LpReformaStudioPage";
import { LP_HERO, LP_TITLE, type LpVariante } from "@/content/pages/lp-reforma-de-studio-sao-paulo";
import { CUSTO_M2_MEDIANO } from "@/content/baseCusto";
import { CLIENTES_FORA_DA_CAPITAL_PCT, REFORMAS_ENTREGUES } from "@/content/provas";

type Dados = { variante: LpVariante };
const loader = Route.options.loader as unknown as (ctx: { location: { search: unknown } }) => Dados | Promise<Dados>;
const head = Route.options.head as unknown as () => { meta?: Array<Record<string, string>> };

async function servidor(busca: string) {
  const dados = await loader({ location: { search: defaultParseSearch(busca) } });
  const html = renderToString(<LpReformaStudioPage variante={dados.variante} />).replace(/<!-- -->/g, "");
  return { dados, html };
}

const CASOS: Array<[string, LpVariante]> = [
  ["", "investidor"],
  ["?utm_source=google&utm_medium=cpc&utm_term=reforma%20de%20studio&gclid=TESTE", "investidor"],
  ["?utm_term=reforma%20studio%20airbnb", "investidor"],
  ["?utm_term=studio%20na%20planta", "planta"],
  ["?utm_term=quanto%20custa%20reforma%20de%20studio", "custo"],
  // Variantes do /orcamento sem topo próprio na LP caem no investidor.
  ["?utm_content=arquitetura-reforma", "investidor"],
];

describe("/lp/reforma-de-studio-sao-paulo: topo do anúncio no HTML do servidor", () => {
  it.each(CASOS)("%s → %s", async (busca, variante) => {
    const { dados, html } = await servidor(busca);
    expect(dados.variante).toBe(variante);
    expect(html).toContain(`${LP_HERO[variante].h1} <em>${LP_HERO[variante].destaque}</em>`);
    expect(html).toContain(LP_HERO[variante].lead);
    expect(html.match(/<h1\b/g)).toHaveLength(1);
  });

  it("o formulário está na própria página, com o id da âncora e os campos do handoff", async () => {
    const { html } = await servidor("");
    expect(html).toContain('id="orcamento"');
    expect(html).toContain('id="lp-nome"');
    expect(html).toContain('type="tel"');
    expect(html).toContain('type="email"');
    expect(html).toContain("Airbnb / short stay");
    expect(html).toContain("Não, comprei na planta");
    expect(html).toContain("Receber orçamento");
    // Nada de link para /orcamento: a conversão é o formulário da página.
    expect(html).not.toMatch(/href="\/orcamento/);
  });

  it("as provas vêm de provas.ts/baseCusto.ts e a LP não tem FAQ, tabela de preço nem bairros", async () => {
    const { html } = await servidor("");
    expect(html).toContain(`+${REFORMAS_ENTREGUES}`);
    expect(html).toContain(`${CUSTO_M2_MEDIANO}<small>/m²</small>`);
    expect(html).toContain(`${CLIENTES_FORA_DA_CAPITAL_PCT}%`);
    expect(html).not.toContain("<details");
    expect(html).not.toContain("bwa-servico-price-table");
    expect(html).not.toContain("bwa-servico-bairros");
  });

  it("o head é noindex e tem o título da página orgânica", () => {
    const meta = head().meta ?? [];
    const robots = meta.find((m) => m.name === "robots");
    expect(robots?.content).toBe("noindex, follow");
    expect(meta.find((m) => "title" in m)?.title).toBe(LP_TITLE);
  });
});
