/**
 * SeoPanelTab — monta o painel com um pacote fake do Search Console e confere
 * o pedido feito à edge function, os KPIs, as oportunidades e o aviso de
 * função desatualizada.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

// recharts (ResponsiveContainer) precisa de ResizeObserver, ausente no jsdom.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

const invokes: { name: string; body: Record<string, unknown> }[] = [];
let panelResponse: unknown = null;

vi.mock("@/integrations/supabase/client", () => {
  const query = (data: unknown) => {
    const q: Record<string, unknown> = {};
    for (const m of ["select", "eq", "order", "limit"]) q[m] = () => q;
    q.then = (resolve: (v: unknown) => unknown) => Promise.resolve({ data, error: null }).then(resolve);
    return q;
  };
  return {
    supabase: {
      functions: {
        invoke: (name: string, opts: { body: Record<string, unknown> }) => {
          invokes.push({ name, body: opts.body });
          return Promise.resolve({ data: panelResponse, error: null });
        },
      },
      from: () =>
        query([
          { slug: "quanto-custa", title: "Quanto custa reformar", published_at: "2026-09-01", content_updated_at: "2026-10-06" },
          { slug: "sem-trafego", title: "Artigo sem tráfego", published_at: "2026-09-10", content_updated_at: "2026-09-10" },
        ]),
      rpc: (_name: string, args: { p_dim: string }) =>
        Promise.resolve({
          data:
            args.p_dim === "referrer_host"
              ? [
                  { dim: "chatgpt.com", sessions: 4, conversions: 1 },
                  { dim: "www.google.com", sessions: 30, conversions: 2 },
                ]
              : [],
          error: null,
        }),
    },
  };
});

import SeoPanelTab from "../SeoPanelTab";

const m = (key: string, impressions: number, clicks: number, position: number) => ({
  key,
  impressions,
  clicks,
  position,
  ctr: impressions ? clicks / impressions : 0,
});

function fixture() {
  return {
    version: 2,
    start_date: "2026-09-08",
    end_date: "2026-10-05",
    prev_start_date: "2026-08-11",
    prev_end_date: "2026-09-07",
    totals: m("", 400, 12, 11.2),
    prev_totals: m("", 200, 6, 14),
    series: [m("2026-09-08", 10, 1, 12), m("2026-09-09", 14, 0, 11)],
    prev_series: [m("2026-08-11", 5, 0, 15)],
    queries: [m("quanto custa reformar studio", 120, 1, 8), m("bewild", 30, 9, 1.2)],
    prev_queries: [m("quanto custa reformar studio", 60, 0, 12), m("busca perdida", 9, 0, 30)],
    pages: [m("https://bewild.com.br/conteudos/quanto-custa", 200, 1, 4), m("https://bewild.com.br/", 50, 9, 2)],
    prev_pages: [m("https://bewild.com.br/conteudos/quanto-custa", 100, 0, 9)],
    query_pages: [
      { query: "quanto custa reformar studio", page: "https://bewild.com.br/conteudos/quanto-custa", impressions: 70, clicks: 1, ctr: 0, position: 8 },
      { query: "quanto custa reformar studio", page: "https://bewild.com.br/conteudos/outro", impressions: 50, clicks: 0, ctr: 0, position: 11 },
    ],
    devices: [m("MOBILE", 300, 8, 11)],
    countries: [m("bra", 390, 12, 11)],
    sitemaps: [{ path: "https://bewild.com.br/sitemap.xml", lastSubmitted: "2026-10-06T21:19:35Z", isPending: true, errors: "0", warnings: "0", contents: [{ submitted: "245" }] }],
  };
}

afterEach(() => {
  cleanup();
  invokes.length = 0;
});

describe("SeoPanelTab", () => {
  const range = { from: new Date(2026, 8, 8), to: new Date(2026, 9, 5, 23, 59, 59, 999) };

  it("pede o modo panel com o período e o anterior de mesmo tamanho", async () => {
    panelResponse = fixture();
    render(<SeoPanelTab range={range} />);
    await screen.findByText("cliques na busca");
    expect(invokes[0]).toEqual({
      name: "search-console-stats",
      body: {
        mode: "panel",
        start_date: "2026-09-08",
        end_date: "2026-10-05",
        prev_start_date: "2026-08-11",
        prev_end_date: "2026-09-07",
      },
    });
  });

  it("mostra KPIs, artigos sem impressão, IA e oportunidades", async () => {
    panelResponse = fixture();
    render(<SeoPanelTab range={range} />);
    await screen.findByText("cliques na busca");
    expect(screen.getByText("1/2")).toBeTruthy(); // artigos com impressão
    expect(screen.getByText("ChatGPT")).toBeTruthy();
    expect(screen.getByText("Google")).toBeTruthy();
    // quase no topo: a busca fora da marca na posição 8
    expect(screen.getAllByText("quanto custa reformar studio").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("tab", { name: /canibalização/ }));
    expect(screen.getAllByText("/conteudos/outro").length).toBe(1);
    fireEvent.click(screen.getByRole("tab", { name: /sem impressão/ }));
    expect(screen.getByText("Artigo sem tráfego")).toBeTruthy();
    expect(screen.getByText("aguardando leitura")).toBeTruthy();
  });

  it("avisa quando a edge function ainda é a versão antiga", async () => {
    panelResponse = { rows: [], totals: {} };
    render(<SeoPanelTab range={range} />);
    await waitFor(() => expect(screen.getByText(/ainda está na versão anterior/)).toBeTruthy());
  });
});
