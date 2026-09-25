/**
 * OverviewTab — comparação justa, série no fuso local e tabela por dia.
 *
 * O client do Supabase é substituído por um fake que registra as chamadas de
 * RPC e responde conforme a janela pedida; assim o teste confere QUAIS janelas
 * e parâmetros o painel pede (hoje até agora × ontem até o mesmo horário;
 * `analytics_timeseries_v2` com o fuso do navegador e os segmentos; tabela
 * por dia começando um dia antes) e o que aparece na tela.
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
function kpiRow(
  sessions: number,
  pageviews = sessions * 2,
  conversions = 0,
  visitors = Math.ceil(sessions / 2)
) {
  return [
    {
      sessions,
      unique_visitors: visitors,
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
/** Linha da v2: bucket = início do bucket LOCAL (timestamptz). */
function v2Row(
  bucket: string,
  sessions: number,
  visitors: number,
  pageviews: number,
  conversions = 0
) {
  return { bucket, sessions, visitors, pageviews, conversions };
}
function findCall(name: string, pred: (args: Record<string, unknown>) => boolean) {
  return rpcCalls.find((c) => c.name === name && pred(c.args));
}
function seriesCalls() {
  return rpcCalls.filter((c) => c.name === "analytics_timeseries_v2");
}

describe("OverviewTab — 'Hoje' com comparação", () => {
  const range = { from: startOfDay(NOW), to: endOfDay(NOW) };

  beforeEach(() => {
    respond = ({ name, args }) => {
      const since = String(args.p_since);
      const until = String(args.p_until);
      if (name === "analytics_overview_kpis") {
        if (since === localIso(2026, 9, 24) && until === NOW.toISOString())
          return kpiRow(16, 49, 1, 13);
        if (since === localIso(2026, 9, 23) && until === localIso(2026, 9, 23, 15, 42, 10))
          return kpiRow(12, 30, 0, 10);
        return kpiRow(0);
      }
      if (name === "analytics_timeseries_v2") {
        const rows =
          args.p_grain === "day"
            ? [
                v2Row(localIso(2026, 9, 23), 62, 30, 176, 1), // ontem inteiro
                v2Row(localIso(2026, 9, 24), 16, 13, 49, 1), // hoje até agora
              ]
            : [
                v2Row(localIso(2026, 9, 23, 10), 12, 10, 30, 0),
                v2Row(localIso(2026, 9, 23, 22), 50, 20, 146, 1),
                v2Row(localIso(2026, 9, 24, 10), 16, 13, 49, 1),
              ];
        return rows.filter((r) => {
          const t = new Date(r.bucket).getTime();
          return t >= new Date(since).getTime() && t < new Date(until).getTime();
        });
      }
      return [];
    };
  });

  it("pede hoje até agora, ontem até o mesmo horário e a série v2 no fuso do navegador", async () => {
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

    // Toda série vai pela v2 com o fuso do navegador e os segmentos
    expect(rpcCalls.some((c) => c.name === "analytics_timeseries")).toBe(false);
    for (const c of seriesCalls()) {
      expect(c.args.p_tz).toBe("America/Sao_Paulo");
      expect(c.args).toHaveProperty("p_utm_source", null);
    }
    // Gráfico por hora: hoje 00:00 → agora
    expect(
      findCall(
        "analytics_timeseries_v2",
        (a) =>
          a.p_grain === "hour" &&
          a.p_since === localIso(2026, 9, 24) &&
          a.p_until === NOW.toISOString()
      )
    ).toBeTruthy();
    // Tabela por dia: começa ontem 00:00 (base do 1º dia) até agora
    expect(
      findCall(
        "analytics_timeseries_v2",
        (a) =>
          a.p_grain === "day" &&
          a.p_since === localIso(2026, 9, 23) &&
          a.p_until === NOW.toISOString()
      )
    ).toBeTruthy();
    // Série do período anterior INTEIRO (linha tracejada): ontem 00:00 → hoje 00:00, por hora
    expect(
      findCall(
        "analytics_timeseries_v2",
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
    // Em "Hoje", ontem até o mesmo horário É o período anterior: uma consulta só
    // (base da tabela reaproveita os KPIs anteriores).
    expect(rpcCalls.filter((c) => c.name === "analytics_overview_kpis")).toHaveLength(2);
    // Gráfico por hora + tabela por dia + período anterior por hora
    expect(seriesCalls()).toHaveLength(3);
  });

  it("mostra a variação vs. ontem até o mesmo horário e a linha 'hoje' parcial com visitantes", async () => {
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

    // Tabela: só "hoje", parcial, com base = ontem até o mesmo horário
    // (sessões 16 vs 12 → +33.3%; visitantes 13 vs 10 → +30.0%)
    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent(/hoje · qui\.?,? 24\/09/);
    expect(rows[0]).toHaveTextContent("até 15:42");
    const cells = within(rows[0]).getAllByRole("cell");
    expect(cells[1]).toHaveTextContent("16");
    expect(cells[2]).toHaveTextContent("+33.3%");
    expect(cells[3]).toHaveTextContent("13");
    expect(cells[4]).toHaveTextContent("+30.0%");
    // métrica "visitantes" disponível no gráfico
    expect(screen.getByRole("button", { name: "visitantes" })).toBeInTheDocument();
  });
});

describe("OverviewTab — 'Últimos 7 dias' em curso com segmento", () => {
  const range = { from: startOfDay(new Date(2026, 8, 18)), to: endOfDay(NOW) };

  beforeEach(() => {
    respond = ({ name, args }) => {
      if (name === "analytics_overview_kpis") return kpiRow(100, 250, 3);
      if (name === "analytics_timeseries_v2") {
        // um bucket por dia local, 10 sessões cada, exceto 23/09 com 26
        const since = new Date(String(args.p_since));
        const until = new Date(String(args.p_until));
        const rows = [];
        for (
          let d = startOfDay(since);
          d.getTime() < until.getTime();
          d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
        ) {
          const is23 = d.getDate() === 23 && d.getMonth() === 8;
          rows.push(v2Row(d.toISOString(), is23 ? 26 : 10, is23 ? 12 : 5, 20, 0));
        }
        return args.p_grain === "day" ? rows : [];
      }
      return [];
    };
  });

  it("alinha o período anterior pelo mesmo horário, passa o segmento a todas as RPCs e monta a tabela", async () => {
    render(
      <OverviewTab range={range} segments={[{ dim: "device", value: "mobile" }]} comparePrev />
    );
    const table = await screen.findByTestId("daily-table");

    // Segmento em TODAS as chamadas: KPIs atuais e anteriores, base de hoje,
    // série da tabela (que também alimenta o gráfico) e série anterior.
    expect(rpcCalls).toHaveLength(5);
    for (const c of rpcCalls) expect(c.args).toHaveProperty("p_device", "mobile");

    // KPIs anteriores: 11/09 00:00 → 17/09 15:42:10
    expect(
      findCall(
        "analytics_overview_kpis",
        (a) =>
          a.p_since === localIso(2026, 9, 11) && a.p_until === localIso(2026, 9, 17, 15, 42, 10)
      )
    ).toBeTruthy();
    // Base do dia em curso: ontem 00:00 → ontem 15:42:10
    expect(
      findCall(
        "analytics_overview_kpis",
        (a) =>
          a.p_since === localIso(2026, 9, 23) && a.p_until === localIso(2026, 9, 23, 15, 42, 10)
      )
    ).toBeTruthy();
    // Gráfico e tabela por dia: UMA consulta, começando um dia antes (17/09)
    // para dar base ao 1º dia — o gráfico descarta esse dia de lead-in.
    expect(
      findCall("analytics_timeseries_v2", (a) => a.p_since === localIso(2026, 9, 18))
    ).toBeUndefined();
    expect(
      findCall(
        "analytics_timeseries_v2",
        (a) =>
          a.p_grain === "day" &&
          a.p_since === localIso(2026, 9, 17) &&
          a.p_until === NOW.toISOString()
      )
    ).toBeTruthy();
    // Série anterior inteira: 11/09 00:00 → 18/09 00:00
    expect(
      findCall(
        "analytics_timeseries_v2",
        (a) =>
          a.p_grain === "day" &&
          a.p_since === localIso(2026, 9, 11) &&
          a.p_until === localIso(2026, 9, 18)
      )
    ).toBeTruthy();

    expect(screen.getByText("11/09 – 17/09 15:42")).toBeInTheDocument();
    expect(screen.getByText(/\(até o mesmo horário\)/)).toBeInTheDocument();
    expect(
      screen.getByText(/segmentos aplicados aos indicadores, ao gráfico e à tabela/)
    ).toBeInTheDocument();

    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(7);
    expect(rows[0]).toHaveTextContent(/^hoje/);
    expect(rows[1]).toHaveTextContent(/^ontem/);
    // ontem: 26 sessões, 12 visitantes; Δ vs 22/09 (10 / 5) = +160% / +140%
    const yCells = within(rows[1]).getAllByRole("cell");
    expect(yCells[1]).toHaveTextContent("26");
    expect(yCells[2]).toHaveTextContent("+160.0%");
    expect(yCells[3]).toHaveTextContent("12");
    expect(yCells[4]).toHaveTextContent("+140.0%");
    // 18/09 (1º dia) tem base (17/09 veio como lead-in): 10 vs 10 → 0.0%
    expect(rows[6]).toHaveTextContent("18/09");
    expect(within(rows[6]).getAllByRole("cell")[2]).toHaveTextContent("0.0%");
    // 17/09 (lead-in) não aparece como linha
    expect(within(table).queryByText(/17\/09/)).toBeNull();
  });

  it("sem comparação não pede o período anterior nem mostra a nota de Δ", async () => {
    render(<OverviewTab range={range} segments={[]} comparePrev={false} />);
    await screen.findByTestId("daily-table");
    expect(rpcCalls.filter((c) => c.name === "analytics_overview_kpis")).toHaveLength(2); // período + ontem mesmo horário
    expect(seriesCalls()).toHaveLength(1); // tabela por dia, que também alimenta o gráfico
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
    respond = ({ name, args }) => {
      if (name === "analytics_overview_kpis") return kpiRow(62, 176, 1);
      if (name === "analytics_timeseries_v2" && args.p_grain === "day") {
        return [
          v2Row(localIso(2026, 9, 22), 68, 9, 685, 2),
          v2Row(localIso(2026, 9, 23), 62, 30, 176, 1),
        ];
      }
      return [];
    };
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
    // Δ vs anteontem (lead-in): 62 vs 68 → -8.8%
    expect(within(rows[0]).getAllByRole("cell")[2]).toHaveTextContent("-8.8%");
  });
});

describe("OverviewTab — período longo (por semana)", () => {
  const range = { from: startOfDay(new Date(2026, 5, 1)), to: endOfDay(NOW) }; // ~116 dias → semana

  beforeEach(() => {
    respond = ({ name, args }) => {
      if (name === "analytics_overview_kpis") return kpiRow(500, 1200, 10);
      if (name === "analytics_timeseries_v2" && args.p_grain === "week") {
        return [
          v2Row(localIso(2026, 9, 14), 300, 120, 700, 5), // semana 14/09
          v2Row(localIso(2026, 9, 21), 200, 90, 450, 3), // semana 21/09 (em curso)
        ];
      }
      return [];
    };
  });

  it("gráfico e tabela por semana, semana em curso marcada como parcial", async () => {
    render(<OverviewTab range={range} segments={[]} comparePrev={false} />);
    const table = await screen.findByTestId("daily-table");
    for (const c of seriesCalls()) expect(c.args.p_grain).toBe("week");
    // sem "ontem até o mesmo horário" (só faz sentido na tabela por dia)
    expect(rpcCalls.filter((c) => c.name === "analytics_overview_kpis")).toHaveLength(1);
    expect(screen.getByText("por semana")).toBeInTheDocument();
    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows[0]).toHaveTextContent("sem. 21/09");
    expect(rows[0]).toHaveTextContent("até 15:42");
    expect(rows[1]).toHaveTextContent("sem. 14/09");
    expect(rows[1]).not.toHaveTextContent("até ");
    // Δ da semana em curso vs anterior: 200 vs 300 → -33.3%
    expect(within(rows[0]).getAllByRole("cell")[2]).toHaveTextContent("-33.3%");
  });
});
