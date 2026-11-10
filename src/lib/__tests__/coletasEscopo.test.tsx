/**
 * Auditoria de SEO, rodada 4 (09/11/2026), ação 15.
 *
 * D5 (Pedro): /coletas-por-bairro (67 palavras, nenhum link interno) sai do
 * índice — `noindex, follow` no HTML do servidor e no cliente — e dos dois
 * geradores de sitemap (conferido em sitemapParidade.test.ts, NAO_INDEXAVEIS).
 *
 * D4 (Pedro): /escopo fica no ar com conteúdo próprio no HTML do servidor: o
 * que entra e o que não entra na reforma completa, faixas por metragem só do
 * Índice (188 contratos), FAQ com FAQPage igual ao texto visível e links para
 * /orcamento e /indice-de-custo-de-reforma.
 *
 * Carona: /autores, /atribuicao e /licenca-cc-by-sa-4-0 ganham um segundo
 * link no rodapé global, que não linka /coletas-por-bairro.
 */
import { render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const seoCalls = vi.hoisted(() => [] as Array<Record<string, unknown>>);

vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-router")>()),
  useNavigate: () => vi.fn(),
}));
vi.mock("@/lib/useSeo", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/useSeo")>()),
  useSeo: (input: Record<string, unknown>) => {
    seoCalls.push(input);
  },
}));
vi.mock("@/components/BwaNav", () => ({ default: () => null }));
vi.mock("@/hooks/useNeighborhoodInterest", () => ({ useNeighborhoodInterest: () => undefined }));
vi.mock("@/lib/assistant/radarColetas.functions", () => ({ getRadarColetas: vi.fn() }));
vi.mock("@/lib/assistant/radarRealtime", () => ({ subscribeRadarCollections: () => () => {} }));

import { Route as ColetasRoute } from "@/routes/coletas-por-bairro";
import { Route as EscopoRoute } from "@/routes/escopo";
import ColetasRadarPage from "@/pages/ColetasRadarPage";
import EscopoPage from "@/pages/EscopoPage";
import BwaFooter from "@/components/BwaFooter";
import { ESCOPO_DESCRIPTION, ESCOPO_PATH, ESCOPO_TITLE } from "@/content/pages/escopo.seo";
import {
  ESCOPO_ENTRA,
  ESCOPO_FAQ,
  ESCOPO_NAO_ENTRA,
  ESCOPO_CONTRATO,
} from "@/content/pages/escopo";
import { BASE_CUSTO, brl } from "@/content/baseCusto";
import { FAIXAS_METRAGEM } from "@/content/indiceCusto";

type Head = {
  meta: Array<Record<string, string>>;
  links: Array<Record<string, string>>;
  scripts: Array<{ type: string; children: string }>;
};
const headOf = (route: { options: { head?: unknown } }, ctx: Record<string, unknown> = {}) =>
  (route.options.head as (c: Record<string, unknown>) => Head)({ matches: [], params: {}, ...ctx });
const robots = (h: Head) => h.meta.find((m) => m.name === "robots")?.content;

/** Texto visível de um HTML de servidor, com as entidades que o React escreve desfeitas. */
const texto = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

describe("/coletas-por-bairro sai do índice (D5)", () => {
  it("HTML do servidor: noindex, follow e sem canonical", () => {
    const head = headOf(ColetasRoute);
    expect(robots(head)).toBe("noindex, follow");
    expect(head.links.find((l) => l.rel === "canonical")).toBeUndefined();
  });

  it("cliente: o useSeo da página também pede noindex (sem trocar o robots depois da hidratação)", () => {
    seoCalls.length = 0;
    render(<ColetasRadarPage data={{ bairros: ["Pinheiros"], bairro: null, coletas: null }} />);
    expect(seoCalls.at(-1)).toMatchObject({ noindex: true, canonicalPath: "/coletas-por-bairro" });
  });
});

describe("rodapé global", () => {
  const html = renderToString(<BwaFooter />);

  it("linka /autores, /atribuicao e /licenca-cc-by-sa-4-0", () => {
    expect(html).toContain('href="/autores"');
    expect(html).toContain('href="/atribuicao"');
    expect(html).toContain('href="/licenca-cc-by-sa-4-0"');
    expect(texto(html)).toContain("Como citar a Bewild");
  });

  it("não linka /coletas-por-bairro", () => {
    expect(html).not.toContain("/coletas-por-bairro");
  });
});

describe("/escopo com conteúdo próprio no HTML do servidor (D4)", () => {
  const loader = EscopoRoute.options.loader as unknown as () => Promise<{
    jsonLd: Array<Record<string, unknown>>;
  }>;
  const html = renderToString(<EscopoPage />);
  const visivel = texto(html);

  it("título e descrição do servidor = os do cliente; FAQPage no head() vindo do loader", async () => {
    const data = await loader();
    const head = headOf(EscopoRoute, { loaderData: data });
    expect(head.meta.find((m) => "title" in m)?.title).toBe(ESCOPO_TITLE);
    expect(head.meta.find((m) => m.name === "description")?.content).toBe(ESCOPO_DESCRIPTION);
    expect(robots(head)).toMatch(/^index, follow/);
    expect(head.links.find((l) => l.rel === "canonical")?.href).toBe(
      `https://bewild.com.br${ESCOPO_PATH}`
    );
    const faqNode = head.scripts
      .map((s) => JSON.parse(s.children))
      .find((n) => n["@type"] === "FAQPage");
    expect(faqNode).toBeDefined();

    seoCalls.length = 0;
    render(<EscopoPage />);
    expect(seoCalls.at(-1)).toMatchObject({
      title: ESCOPO_TITLE,
      description: ESCOPO_DESCRIPTION,
      canonicalPath: ESCOPO_PATH,
    });
    expect(ESCOPO_TITLE.length).toBeLessThanOrEqual(60);
    expect(ESCOPO_DESCRIPTION.length).toBeGreaterThanOrEqual(120);
    expect(ESCOPO_DESCRIPTION.length).toBeLessThanOrEqual(160);
  });

  it("FAQ de 4 a 6 perguntas, e o FAQPage é igual ao texto visível", async () => {
    expect(ESCOPO_FAQ.length).toBeGreaterThanOrEqual(4);
    expect(ESCOPO_FAQ.length).toBeLessThanOrEqual(6);
    const { jsonLd } = await loader();
    const faqNode = jsonLd.find((n) => n["@type"] === "FAQPage") as {
      mainEntity: Array<{ name: string; acceptedAnswer: { text: string } }>;
    };
    expect(faqNode.mainEntity.map((q) => [q.name, q.acceptedAnswer.text])).toEqual(
      ESCOPO_FAQ.map((f) => [f.q, f.a])
    );
    for (const { q, a } of ESCOPO_FAQ) {
      expect(visivel).toContain(q);
      expect(visivel).toContain(a);
    }
  });

  it("o que entra, o que fica no contrato e o que não entra estão na página", () => {
    for (const lista of [ESCOPO_ENTRA, ESCOPO_CONTRATO, ESCOPO_NAO_ENTRA]) {
      expect(lista.length).toBeGreaterThan(0);
      for (const { item, detalhe } of lista) {
        expect(visivel).toContain(item);
        expect(visivel).toContain(detalhe);
      }
    }
    // Fatos publicados: escopo e garantia.
    for (const termo of [
      "Marcenaria",
      "Enxoval e utensílios",
      "Mobiliário",
      "5 anos",
      "15 anos",
      "RRT",
    ]) {
      expect(visivel).toContain(termo);
    }
    // O responsável técnico emite RRT, não ART.
    expect(visivel).not.toMatch(/\bART\b/);
  });

  it("faixas por metragem só do Índice (base de 188 contratos)", () => {
    expect(FAIXAS_METRAGEM.reduce((s, f) => s + f.contratos, 0)).toBe(BASE_CUSTO.contratos);
    expect(visivel).toContain(`${BASE_CUSTO.contratos} contratos`);
    for (const f of FAIXAS_METRAGEM) {
      expect(visivel).toContain(f.faixa);
      expect(visivel).toContain(brl(f.orcamentoMediano));
      expect(visivel).toContain(
        `${brl(f.metadeDoMeioMil[0] * 1000)} a ${brl(f.metadeDoMeioMil[1] * 1000)}`
      );
    }
  });

  it("deixa claro o papel da página e linka o orçamento e o Índice", () => {
    expect(html).toContain('href="/orcamento"');
    expect(html).toContain('href="/indice-de-custo-de-reforma"');
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    // Link interno para /orcamento sem utm_*.
    expect(html).not.toMatch(/href="\/orcamento[^"]*utm_/);
  });

  it("texto próprio: bem mais que as 403 palavras de antes", () => {
    const main = html.slice(html.indexOf("<main"), html.indexOf("</main>"));
    const palavras = texto(main)
      .split(" ")
      .filter((w) => /\p{L}/u.test(w));
    expect(palavras.length).toBeGreaterThanOrEqual(900);
  });
});
