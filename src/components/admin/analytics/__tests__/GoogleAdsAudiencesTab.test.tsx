import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke } } }));
import GoogleAdsAudiencesTab from "../GoogleAdsAudiencesTab";
const range = { from: new Date(2026, 8, 11), to: new Date(2026, 9, 10, 23, 59, 59, 999) };
const segments = [{ dim: "landing_path" as const, value: "/guia-do-investidor" }];
const request = {
  from: "2026-09-11",
  to: "2026-10-10",
  segments,
  previous: { from: "2026-08-12", to: "2026-09-10" },
};
const totals = { clicks: 12, impressions: 120, cost: 90, conversions: 3 };
function fixture(body = request) {
  return {
    connected: true,
    version: 2,
    request: body,
    range: { from: body.from, to: body.to },
    fetchedAt: "2026-10-10T08:00:00Z",
    totals,
    scope: {
      landingPath: body.segments[0]?.value ?? null,
      timeZone: "America/Sao_Paulo",
      currency: "BRL",
      today: "2026-10-10",
    },
    campaigns: [
      { id: "10", name: "Studio teste", status: "ENABLED", channel: "SEARCH", ...totals },
    ],
    conversions: [
      {
        id: "1",
        name: "Formulário",
        category: "LEAD",
        status: "ENABLED",
        primary: true,
        conversions: 3,
        allConversions: 3,
      },
    ],
    lists: [
      {
        id: "100",
        name: "Visitantes site",
        type: "RULE_BASED",
        sizeSearch: null,
        sizeDisplay: 500,
        lifeSpanDays: 30,
        eligibleSearch: false,
        eligibleDisplay: true,
      },
    ],
    previous: body.previous
      ? { range: body.previous, totals: { ...totals, cost: 60 }, campaigns: [], conversions: [] }
      : null,
  };
}
let client: QueryClient;
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  invoke.mockReset();
  invoke.mockImplementation(async (_name, { body }) => ({ data: fixture(body), error: null }));
});
afterEach(() => {
  cleanup();
  client.clear();
});
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);
const panel = (props = {}) => (
  <GoogleAdsAudiencesTab range={range} segments={segments} comparePrev {...props} />
);

describe("GoogleAdsAudiencesTab", () => {
  it("sends local inclusive dates, decoded page and previous dates, labels inventory scope", async () => {
    render(panel(), { wrapper });
    await screen.findByText("Studio teste");
    expect(invoke.mock.calls[0][1].body).toEqual(request);
    expect(screen.getByTestId("google-ads-scope")).toHaveTextContent("/guia-do-investidor");
    expect(screen.getByText(/Comparação:/)).toHaveTextContent("12/08/2026 a 10/09/2026");
    expect(screen.getByText(/Tamanho e elegibilidade/)).toHaveTextContent(
      "não filtráveis por período ou página"
    );
    expect(screen.getByText("não informado")).toBeInTheDocument();
    expect(screen.queryByText(/custo por lead/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/últimos 30 dias/i)).not.toBeInTheDocument();
  });
  it("requests changed dates and page, then can return to the original scope", async () => {
    const { rerender } = render(panel(), { wrapper });
    await screen.findByText("Studio teste");
    const changedRange = { from: new Date(2026, 9, 1), to: new Date(2026, 9, 1, 23, 59, 59, 999) };
    rerender(
      panel({
        range: changedRange,
        segments: [{ dim: "landing_path", value: "/orcamento" }],
        comparePrev: false,
      })
    );
    await waitFor(() =>
      expect(screen.getByTestId("google-ads-scope")).toHaveTextContent("/orcamento")
    );
    expect(invoke.mock.calls.at(-1)![1].body).toEqual({
      from: "2026-10-01",
      to: "2026-10-01",
      segments: [{ dim: "landing_path", value: "/orcamento" }],
      previous: null,
    });
    expect(screen.queryByText(/Comparação:/)).not.toBeInTheDocument();
    rerender(panel());
    await waitFor(() =>
      expect(screen.getByTestId("google-ads-scope")).toHaveTextContent("/guia-do-investidor")
    );
  });
  it("clears the page filter and explicitly shows all account destinations", async () => {
    render(panel({ segments: [] }), { wrapper });
    await screen.findByText("Todas as páginas de destino da conta.");
    expect(invoke.mock.calls[0][1].body.segments).toEqual([]);
  });
  it("does not send unsupported site filters or silently ignore them", () => {
    render(panel({ segments: [{ dim: "utm_source", value: "google" }] }), { wrapper });
    expect(screen.getByRole("alert")).toHaveTextContent("Remova os demais filtros");
    expect(invoke).not.toHaveBeenCalled();
  });
  it.each(["legacy", "wrong-range"])(
    "rejects %s responses instead of showing unrelated metrics",
    async (mode) => {
      invoke.mockResolvedValue({
        data:
          mode === "legacy"
            ? { ...fixture(), version: 1 }
            : { ...fixture(), request: { ...request, from: "2026-01-01" } },
        error: null,
      });
      render(panel(), { wrapper });
      expect(await screen.findByRole("alert")).toHaveTextContent("servidor ainda não confirmou");
      expect(screen.queryByText("Studio teste")).not.toBeInTheDocument();
    }
  );
  it("does not let a late old response replace the new filter", async () => {
    let release!: (result: unknown) => void;
    invoke.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = resolve;
        })
    );
    const { rerender } = render(panel(), { wrapper });
    await waitFor(() => expect(invoke).toHaveBeenCalledTimes(1));
    rerender(panel({ segments: [{ dim: "landing_path", value: "/nova" }] }));
    await waitFor(() => expect(screen.getByTestId("google-ads-scope")).toHaveTextContent("/nova"));
    release({ data: fixture(), error: null });
    await waitFor(() => expect(screen.getByTestId("google-ads-scope")).toHaveTextContent("/nova"));
  });
  it("shows an empty scoped result without inventing account totals", async () => {
    invoke.mockResolvedValue({
      data: {
        ...fixture(),
        campaigns: [],
        totals: { clicks: 0, impressions: 0, cost: 0, conversions: 0 },
      },
      error: null,
    });
    render(panel(), { wrapper });
    await screen.findByText(/Nenhum dado de campanhas para este período e página/);
    expect(screen.getByText("custo por conversão").nextElementSibling).toHaveTextContent(
      "não disponível"
    );
  });
  it("refreshes the same scope and supports retry after a provider failure", async () => {
    invoke.mockRejectedValueOnce(new Error("falha temporária"));
    render(panel(), { wrapper });
    await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: "tentar de novo" }));
    await screen.findByText("Studio teste");
    fireEvent.click(screen.getByRole("button", { name: "atualizar" }));
    await waitFor(() => expect(invoke).toHaveBeenCalledTimes(3));
    expect(invoke.mock.calls[2][1].body).toEqual(request);
  });
});
