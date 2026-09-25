/**
 * OverviewTab — comparação justa e tabela por dia.
 *
 * O client do Supabase é substituído por um fake que registra as chamadas de
 * RPC e responde conforme a janela pedida; assim o teste confere QUAIS janelas
 * o painel pede (hoje até agora × ontem até o mesmo horário; série por hora
 * começando um dia antes) e o que aparece na tela.
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";

type RpcCall = { name: string; args: Record<string, unknown> };
const rpcCalls: RpcCall[] = [];
let respond: (call: RpcCall) => unknown = () => [];

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: (name: string, args: Record<string, unknown>) => {
      const call = { name, args };
      rpcCalls.push(call);
      return Promise.resolve({ data: respond(call), error: null });
    },
  },
}));

import OverviewTab from "../OverviewTab";

const ORIGINAL_TZ = process.env.TZ;
beforeAll(() => {
  process.env.TZ = "America/Sao_Paulo";
  // recharts (ResponsiveContainer) exige ResizeObserver; o jsdom não tem.
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
});
afterAll(() => {
  if (ORIGINAL_TZ === undefined) delete process.env.TZ;
  else process.env.TZ = ORIGINAL_TZ;
  vi.unstubAllGlobals();
});

const NOW = new Date(2026, 8, 24, 15, 42, 10); // qui 24/09/2026 15:42:10 (SP)
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  rpcCalls.length = 0;
});
afterEach(() => {
  vi.useRealTimers();
});

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function localIso(y: number, m: number, d: number, h = 0, mi = 0, s = 0) {
  return new Date(y, m - 1, d, h, mi, s).toISOString();
}
function kpiRow(sessions: number, pageviews = sessions * 2, conversions = 0) {
  return [
    {
      sessions,
      unique_visitors: Math.ceil(sessions / 2),
      pageviews,
      pages_per_session: sessions ? +(pageviews / sessions).toFixed(2) : 0,
      avg_engagement_ms: 30_000,
      bounce_rate: 40,
      conversions,
      conversion_rate: sessions ? +((conversions * 100) / sessions).toFixed(1) : 0,
      spark: [],
    },
  ];
}
function findCall(name: string, pred: (args: Record<string, unknown>) => boolean) {
  return rpcCalls.find((c) => c.name === name && pred(c.args));
}

describe("OverviewTab — 'Hoje' com comparação", () => {
  const range = { from: startOfDay(NOW), to: endOfDay(NOW) };

  beforeEach(() => {
    respond = ({ name, args }) => {
      const since = String(args.p_since);
      const until = String(args.p_until);
      if (name === "analytics_overview_kpis") {
        if (since === localIso(2026, 9, 24) && until === NOW.toISOString())
          return kpiRow(16, 49, 1);
        if (since === localIso(2026, 9, 23) && until === localIso(2026, 9, 23, 15, 42, 10))
          return kpiRow(12, 30, 0);
        return kpiRow(0);
      }
      if (name === "analytics_timeseries") {
        // ontem inteiro (série do período anterior) + hoje até agora
        return [
          { bucket: "2026-09-23T13:00:00+00:00", sessions: 12, pageviews: 30, conversions: 0 }, // 23/09 10:00 SP
          { bucket: "2026-09-24T01:00:00+00:00", sessions: 50, pageviews: 146, conversions: 1 }, // 23/09 22:00 SP
          { bucket: "2026-09-24T13:00:00+00:00", sessions: 16, pageviews: 49, conversions: 1 }, // 24/09 10:00 SP
        ].filter((r) => {
          const t = new Date(r.bucket).getTime();
          return t >= new Date(since).getTime() && t < new Date(until).getTime();
        });
      }
      return [];
    };
  });

  it("pede hoje até agora, ontem até o mesmo horário, e a série por hora desde ontem", async () => {
    render(<OverviewTab range={range} segments={[]} comparePrev />);
    await screen.findByTestId("daily-table");

    // KPIs do período: 00:00 de hoje → agora (não 23:59:59)
    expect(
      findCall(
        "analytics_overview_kpis",
        (a) => a.p_since === localIso(2026, 9, 24) && a.p_until === NOW.toISOString()
      )
    ).toBeTruthy();
    // KPIs do período anterior: ontem 00:00 → ontem 15:42:10 (mesmo horário), com os filtros de segmento
    const prev = findCall(
      "analytics_overview_kpis",
      (a) => a.p_since === localIso(2026, 9, 23) && a.p_until === localIso(2026, 9, 23, 15, 42, 10)
    );
    expect(prev).toBeTruthy();
    expect(prev?.args).toHaveProperty("p_device", null);
    // Série por hora desde ontem 00:00 (base do 1º dia) até agora
    expect(
      findCall(
        "analytics_timeseries",
        (a) =>
          a.p_grain === "hour" &&
          a.p_since === localIso(2026, 9, 23) &&
          a.p_until === NOW.toISOString()
      )
    ).toBeTruthy();
    // Série do período anterior INTEIRO (linha tracejada): ontem 00:00 → hoje 00:00
    expect(
      findCall(
        "analytics_timeseries",
        (a) =>
          a.p_grain === "hour" &&
          a.p_since === localIso(2026, 9, 23) &&
          a.p_until === localIso(2026, 9, 24)
      )
    ).toBeTruthy();
    // Nenhuma chamada usa o fim do dia (23:59:59.999) como "até"
    expect(rpcCalls.some((c) => String(c.args.p_until) === endOfDay(NOW).toISOString())).toBe(
      false
    );
  });

  it("mostra a variação vs. ontem até o mesmo horário e a linha 'hoje' parcial", async () => {
    const { container } = render(<OverviewTab range={range} segments={[]} comparePrev />);
    const table = await screen.findByTestId("daily-table");

    // KPI sessões (1º card): 16 vs 12 → +33.3%
    const kpiSessions = container.querySelector(".aa-kpi") as HTMLElement;
    expect(within(kpiSessions).getByText("sessões")).toBeInTheDocument();
    expect(within(kpiSessions).getByText("16")).toBeInTheDocument();
    expect(within(kpiSessions).getByText(/\+33\.3%/)).toBeInTheDocument();

    // Nota da comparação
    expect(screen.getByText(/período em curso/)).toBeInTheDocument();
    expect(screen.getByText("23/09 até 15:42")).toBeInTheDocument();
    expect(
      screen.getByText(/período anterior inteiro: 62 sessões · 176 pageviews/)
    ).toBeInTheDocument();

    // Tabela: só "hoje", parcial, com base = ontem até o mesmo horário (12 → +33.3%)
    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent(/hoje · qui\.?,? 24\/09/);
    expect(rows[0]).toHaveTextContent("até 15:42");
    expect(rows[0]).toHaveTextContent("+33.3%");
  });
});

describe("OverviewTab — 'Últimos 7 dias' em curso", () => {
  const range = { from: startOfDay(new Date(2026, 8, 18)), to: endOfDay(NOW) };

  beforeEach(() => {
    respond = ({ name, args }) => {
      const since = new Date(String(args.p_since)).getTime();
      const until = new Date(String(args.p_until)).getTime();
      if (name === "analytics_overview_kpis") return kpiRow(100, 250, 3);
      if (name === "analytics_timeseries") {
        const rows: { bucket: string; sessions: number; pageviews: number; conversions: number }[] =
          [];
        // 1 sessão por hora, todos os dias — com 3 sessões na hora 22h SP de 23/09 (01:00Z de 24/09)
        for (let t = since; t < until; t += 3_600_000) {
          const iso = new Date(t).toISOString().replace(".000Z", "+00:00");
          const isLateYesterday = iso.startsWith("2026-09-24T01:00");
          rows.push({
            bucket: iso,
            sessions: isLateYesterday ? 3 : 1,
            pageviews: 2,
            conversions: 0,
          });
        }
        return rows;
      }
      return [];
    };
  });

  it("alinha o período anterior pelo mesmo horário e soma os dias no fuso local", async () => {
    render(<OverviewTab range={range} segments={[]} comparePrev />);
    const table = await screen.findByTestId("daily-table");

    // KPIs anteriores: 11/09 00:00 → 17/09 15:42:10
    expect(
      findCall(
        "analytics_overview_kpis",
        (a) =>
          a.p_since === localIso(2026, 9, 11) && a.p_until === localIso(2026, 9, 17, 15, 42, 10)
      )
    ).toBeTruthy();
    // Série anterior inteira: 11/09 00:00 → 18/09 00:00
    expect(
      findCall(
        "analytics_timeseries",
        (a) => a.p_since === localIso(2026, 9, 11) && a.p_until === localIso(2026, 9, 18)
      )
    ).toBeTruthy();
    // Série atual começa um dia antes do período (17/09) para dar base ao 1º dia
    expect(
      findCall(
        "analytics_timeseries",
        (a) => a.p_since === localIso(2026, 9, 17) && a.p_until === NOW.toISOString()
      )
    ).toBeTruthy();

    expect(screen.getByText("11/09 – 17/09 15:42")).toBeInTheDocument();
    expect(screen.getByText(/\(até o mesmo horário\)/)).toBeInTheDocument();

    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(7);
    expect(rows[0]).toHaveTextContent(/^hoje/);
    expect(rows[1]).toHaveTextContent(/^ontem/);
    // ontem: 24 horas × 1 + 2 extras às 22h locais (que em UTC já é 24/09) = 26 sessões
    expect(within(rows[1]).getAllByRole("cell")[1]).toHaveTextContent("26");
    // hoje: 00:00 → 15:42 = 16 buckets de hora (15:00 inclusive) = 16 sessões
    expect(within(rows[0]).getAllByRole("cell")[1]).toHaveTextContent("16");
    // 18/09 (1º dia) tem base (17/09 veio como lead-in): 24 vs 24 → 0.0%
    expect(rows[6]).toHaveTextContent("18/09");
    expect(within(rows[6]).getAllByRole("cell")[2]).toHaveTextContent("0.0%");
    // 17/09 (lead-in) não aparece como linha
    expect(within(table).queryByText(/17\/09/)).toBeNull();
  });

  it("sem comparação não pede o período anterior nem mostra a nota de Δ", async () => {
    render(<OverviewTab range={range} segments={[]} comparePrev={false} />);
    await screen.findByTestId("daily-table");
    expect(rpcCalls.filter((c) => c.name === "analytics_overview_kpis")).toHaveLength(2); // período + ontem mesmo horário
    expect(rpcCalls.filter((c) => c.name === "analytics_timeseries")).toHaveLength(1);
    const note = screen.getByText(/período em curso/).closest('[role="note"]') as HTMLElement;
    expect(note).not.toHaveTextContent("Δ vs.");
    expect(note).not.toHaveTextContent("período anterior inteiro");
    // sem base de comparação, os KPIs não mostram delta
    expect(document.querySelector(".aa-kpi .aa-kpi__delta")).toBeNull();
  });
});

describe("OverviewTab — 'Ontem' (período encerrado)", () => {
  const y = new Date(2026, 8, 23);
  const range = { from: startOfDay(y), to: endOfDay(y) };

  beforeEach(() => {
    respond = ({ name }) => (name === "analytics_overview_kpis" ? kpiRow(62, 176, 1) : []);
  });

  it("compara com anteontem inteiro e não marca nada como parcial", async () => {
    render(<OverviewTab range={range} segments={[]} comparePrev />);
    const table = await screen.findByTestId("daily-table");
    expect(
      findCall(
        "analytics_overview_kpis",
        (a) => a.p_since === localIso(2026, 9, 22) && a.p_until === localIso(2026, 9, 23)
      )
    ).toBeTruthy();
    // sem chamada de "ontem até o mesmo horário"
    expect(rpcCalls.filter((c) => c.name === "analytics_overview_kpis")).toHaveLength(2);
    expect(screen.getByText(/período encerrado/)).toBeInTheDocument();
    expect(screen.getByText("22/09")).toBeInTheDocument();
    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent(/^ontem/);
    expect(rows[0]).not.toHaveTextContent("até ");
  });
});
