/**
 * TodayVsYesterdayCard — "Hoje × ontem" da Visão geral.
 *
 * Confere as três janelas pedidas (hoje até agora; ontem até o mesmo horário;
 * ontem inteiro), a tendência e os totais de referência na tela, e que uma
 * falha na RPC vira "—" + aviso, nunca número inventado.
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";

type RpcCall = { name: string; args: Record<string, unknown> };
const rpcCalls: RpcCall[] = [];
const leadsCalls: { since?: string; until?: string }[] = [];
let respondRpc: (call: RpcCall) => { data: unknown; error: { message: string } | null } = () => ({
  data: [],
  error: null,
});
let respondLeads: (win: { since?: string; until?: string }) => {
  count: number | null;
  error: { message: string } | null;
} = () => ({ count: 0, error: null });

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: (name: string, args: Record<string, unknown>) => {
      const call = { name, args };
      rpcCalls.push(call);
      return Promise.resolve(respondRpc(call));
    },
    from: (table: string) => {
      const win: { since?: string; until?: string } = {};
      leadsCalls.push(win);
      const builder = {
        select: () => builder,
        gte: (_c: string, v: string) => {
          win.since = v;
          return builder;
        },
        lt: (_c: string, v: string) => {
          win.until = v;
          return builder;
        },
        then: (onFulfilled: (v: unknown) => unknown) =>
          Promise.resolve({ data: null, ...respondLeads(win), table }).then(onFulfilled),
      };
      return builder;
    },
  },
}));

import TodayVsYesterdayCard from "../TodayVsYesterdayCard";

const ORIGINAL_TZ = process.env.TZ;
beforeAll(() => {
  process.env.TZ = "America/Sao_Paulo";
});
afterAll(() => {
  if (ORIGINAL_TZ === undefined) delete process.env.TZ;
  else process.env.TZ = ORIGINAL_TZ;
});

const NOW = new Date(2026, 8, 24, 15, 42, 10);
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  rpcCalls.length = 0;
  leadsCalls.length = 0;
});
afterEach(() => {
  vi.useRealTimers();
});

function localIso(y: number, m: number, d: number, h = 0, mi = 0, s = 0) {
  return new Date(y, m - 1, d, h, mi, s).toISOString();
}
const TODAY = { since: localIso(2026, 9, 24), until: NOW.toISOString() };
const Y_SAME = { since: localIso(2026, 9, 23), until: localIso(2026, 9, 23, 15, 42, 10) };
const Y_FULL = { since: localIso(2026, 9, 23), until: localIso(2026, 9, 24) };

function kpi(sessions: number, unique_visitors: number, pageviews: number) {
  return { data: [{ sessions, unique_visitors, pageviews }], error: null };
}

describe("TodayVsYesterdayCard", () => {
  it("compara hoje até agora com ontem até o mesmo horário e mostra ontem inteiro", async () => {
    respondRpc = ({ args }) => {
      if (args.p_since === TODAY.since && args.p_until === TODAY.until) return kpi(16, 13, 49);
      if (args.p_since === Y_SAME.since && args.p_until === Y_SAME.until) return kpi(12, 10, 30);
      if (args.p_since === Y_FULL.since && args.p_until === Y_FULL.until) return kpi(62, 30, 176);
      return { data: [], error: null };
    };
    respondLeads = (w) => {
      if (w.since === TODAY.since) return { count: 1, error: null };
      if (w.until === Y_SAME.until) return { count: 0, error: null };
      return { count: 1, error: null };
    };

    render(<TodayVsYesterdayCard />);
    await screen.findAllByText(/ontem inteiro:/);

    // três janelas, sem 23:59:59 em lugar nenhum
    const windows = rpcCalls.map((c) => `${c.args.p_since}→${c.args.p_until}`).sort();
    expect(windows).toEqual([TODAY, Y_SAME, Y_FULL].map((w) => `${w.since}→${w.until}`).sort());
    expect(leadsCalls.map((w) => `${w.since}→${w.until}`).sort()).toEqual(windows);

    expect(screen.getByRole("heading", { name: "Hoje até 15:42" })).toBeInTheDocument();
    expect(screen.getByText(/23\/09 até 15:42/)).toBeInTheDocument();

    const sessions = screen.getByTestId("today-sessions");
    expect(within(sessions).getByText("16")).toBeInTheDocument();
    expect(within(sessions).getByText(/\+33\.3%/)).toHaveAttribute("data-dir", "up");
    expect(sessions).toHaveTextContent("ontem até 15:42: 12 · ontem inteiro: 62");

    const visitors = screen.getByTestId("today-unique_visitors");
    expect(within(visitors).getByText(/\+30\.0%/)).toHaveAttribute("data-dir", "up");

    const leads = screen.getByTestId("today-leads");
    expect(leads.querySelector(".bw-admin__kpi-value")).toHaveTextContent("1");
    expect(within(leads).getByText(/novo/)).toHaveAttribute("data-dir", "up");
    expect(leads).toHaveTextContent("ontem até 15:42: 0 · ontem inteiro: 1");

    // link para a visão por dia de hoje no Analytics
    expect(screen.getByRole("link", { name: "ver por dia" })).toHaveAttribute(
      "href",
      "/admin/analytics?tab=overview&from=2026-09-24&to=2026-09-24&cmp=1"
    );
  });

  it("falha na RPC vira '—' e aviso, sem número inventado", async () => {
    respondRpc = () => ({ data: null, error: { message: "forbidden" } });
    respondLeads = () => ({ count: 3, error: null });

    render(<TodayVsYesterdayCard />);
    const alert = await screen.findByRole("status");
    expect(alert).toHaveTextContent("erro ao carregar");
    expect(alert).toHaveAttribute("title", "forbidden");

    // sessões zeradas (RPC sem dados) não viram tendência falsa: 0 vs 0 → "—"
    const sessions = screen.getByTestId("today-sessions");
    expect(sessions).toHaveTextContent("0");
    expect(within(sessions).getByTitle("vs. ontem até o mesmo horário")).toHaveAttribute(
      "data-dir",
      "flat"
    );
    expect(within(sessions).getByTitle("vs. ontem até o mesmo horário")).toHaveTextContent("—");
    // leads continuam vindo da tabela
    expect(screen.getByTestId("today-leads")).toHaveTextContent("3");
  });
});
