import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  addLocalDays,
  aggregateHourlyByLocalDay,
  alignedPreviousWindow,
  buildDayTable,
  effectiveWindow,
  formatWindowLabel,
  fullPreviousWindow,
  invertDir,
  localDayGrid,
  rangeLengthMs,
  todaySoFarWindow,
  trend,
  yesterdayFullWindow,
  yesterdaySameTimeWindow,
} from "@/lib/analyticsCompare";

// Fuso negativo (São Paulo, UTC−3): é onde o "dia" do servidor (UTC) diverge
// do dia local e onde a comparação "hoje × ontem" mais aparece.
const ORIGINAL_TZ = process.env.TZ;
beforeAll(() => {
  process.env.TZ = "America/Sao_Paulo";
});
afterAll(() => {
  if (ORIGINAL_TZ === undefined) delete process.env.TZ;
  else process.env.TZ = ORIGINAL_TZ;
});

const DAY = 86_400_000;

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
/** Preset "Hoje" como o DateRangePicker monta, para um `now` fixo. */
function todayRange(now: Date) {
  return { from: startOfDay(now), to: endOfDay(now) };
}
function lastNDays(now: Date, n: number) {
  return { from: startOfDay(new Date(now.getTime() - (n - 1) * DAY)), to: endOfDay(now) };
}

describe("janela efetiva e período anterior alinhado", () => {
  const now = new Date(2026, 8, 24, 15, 42, 10); // qui 24/09/2026 15:42:10 local

  it("'Hoje' termina em agora e compara com ontem até o mesmo horário", () => {
    const range = todayRange(now);
    expect(rangeLengthMs(range)).toBe(DAY);

    const cur = effectiveWindow(range, now);
    expect(cur.partial).toBe(true);
    expect(cur.from.getTime()).toBe(startOfDay(now).getTime());
    expect(cur.until.getTime()).toBe(now.getTime());

    const prev = alignedPreviousWindow(range, now);
    expect(prev.partial).toBe(true);
    expect(prev.from).toEqual(new Date(2026, 8, 23, 0, 0, 0, 0));
    expect(prev.until).toEqual(new Date(2026, 8, 23, 15, 42, 10));
  });

  it("'Ontem' está encerrado: compara com anteontem inteiro", () => {
    const y = new Date(now.getTime() - DAY);
    const range = { from: startOfDay(y), to: endOfDay(y) };
    const cur = effectiveWindow(range, now);
    expect(cur.partial).toBe(false);
    expect(cur.until).toEqual(startOfDay(now)); // meia-noite de hoje (exclusivo)

    const prev = alignedPreviousWindow(range, now);
    expect(prev.partial).toBe(false);
    expect(prev.from).toEqual(new Date(2026, 8, 22, 0, 0, 0, 0));
    expect(prev.until).toEqual(new Date(2026, 8, 23, 0, 0, 0, 0));
  });

  it("'Últimos 7 dias' em curso compara com os 7 anteriores até o mesmo horário", () => {
    const range = lastNDays(now, 7); // 18/09 00:00 – 24/09 23:59
    const prev = alignedPreviousWindow(range, now);
    expect(prev.from).toEqual(new Date(2026, 8, 11, 0, 0, 0, 0));
    expect(prev.until).toEqual(new Date(2026, 8, 17, 15, 42, 10));

    // O período anterior inteiro (gráfico) vai até a véspera do período atual.
    const full = fullPreviousWindow(range);
    expect(full.from).toEqual(new Date(2026, 8, 11, 0, 0, 0, 0));
    expect(full.until).toEqual(new Date(2026, 8, 18, 0, 0, 0, 0));
  });

  it("período inteiramente no futuro não devolve janela invertida", () => {
    const tomorrow = new Date(now.getTime() + DAY);
    const cur = effectiveWindow({ from: startOfDay(tomorrow), to: endOfDay(tomorrow) }, now);
    expect(cur.until.getTime()).toBe(cur.from.getTime());
    expect(cur.partial).toBe(true);
  });

  it("atalhos de hoje/ontem seguem o horário local", () => {
    const soFar = todaySoFarWindow(now);
    expect(soFar.from).toEqual(new Date(2026, 8, 24, 0, 0, 0, 0));
    expect(soFar.until).toEqual(now);

    const same = yesterdaySameTimeWindow(now);
    expect(same.from).toEqual(new Date(2026, 8, 23, 0, 0, 0, 0));
    expect(same.until).toEqual(new Date(2026, 8, 23, 15, 42, 10));

    const full = yesterdayFullWindow(now);
    expect(full.from).toEqual(new Date(2026, 8, 23, 0, 0, 0, 0));
    expect(full.until).toEqual(new Date(2026, 8, 24, 0, 0, 0, 0));
  });

  it("addLocalDays anda em dias de calendário, não em blocos de 24h", () => {
    const d = new Date(2026, 8, 24, 15, 42, 10);
    expect(addLocalDays(d, -1)).toEqual(new Date(2026, 8, 23, 15, 42, 10));
    expect(addLocalDays(d, 7)).toEqual(new Date(2026, 9, 1, 15, 42, 10));
  });
});

describe("tendência", () => {
  it("calcula a variação percentual com sinal e direção", () => {
    expect(trend(16, 12)).toEqual({ pct: (4 / 12) * 100, dir: "up", label: "+33.3%" });
    expect(trend(9, 12)).toEqual({ pct: -25, dir: "down", label: "-25.0%" });
    expect(trend(100, 100)).toEqual({ pct: 0, dir: "flat", label: "0.0%" });
  });

  it("±0,5% é estável", () => {
    expect(trend(1004, 1000).dir).toBe("flat");
    expect(trend(1006, 1000).dir).toBe("up");
    expect(trend(994, 1000).dir).toBe("down");
  });

  it("sem base: 'novo' se apareceu algo, '—' se continua zerado", () => {
    expect(trend(5, 0)).toEqual({ pct: null, dir: "up", label: "novo" });
    expect(trend(0, 0)).toEqual({ pct: null, dir: "flat", label: "—" });
  });

  it("invertDir troca a cor de métricas em que cair é bom", () => {
    expect(invertDir("up")).toBe("down");
    expect(invertDir("down")).toBe("up");
    expect(invertDir("flat")).toBe("flat");
  });
});

describe("rótulo da janela", () => {
  it("dia inteiro, dia parcial e intervalos", () => {
    const d23 = new Date(2026, 8, 23, 0, 0, 0, 0);
    const d24 = new Date(2026, 8, 24, 0, 0, 0, 0);
    expect(formatWindowLabel({ from: d23, until: d24 })).toBe("23/09");
    expect(formatWindowLabel({ from: d23, until: new Date(2026, 8, 23, 15, 42) })).toBe(
      "23/09 até 15:42"
    );
    expect(formatWindowLabel({ from: new Date(2026, 8, 11), until: new Date(2026, 8, 18) })).toBe(
      "11/09 – 17/09"
    );
    expect(
      formatWindowLabel({ from: new Date(2026, 8, 11), until: new Date(2026, 8, 17, 15, 42) })
    ).toBe("11/09 – 17/09 15:42");
  });

  it("janela que cruza o ano leva o ano nas datas", () => {
    expect(
      formatWindowLabel({ from: new Date(2025, 8, 30), until: new Date(2026, 2, 28, 15, 42) })
    ).toBe("30/09/25 – 28/03/26 15:42");
    // termina à meia-noite de 01/01: o último instante ainda é 31/12 — mesmo ano, sem ano no rótulo
    expect(formatWindowLabel({ from: new Date(2025, 11, 25), until: new Date(2026, 0, 1) })).toBe(
      "25/12 – 31/12"
    );
  });
});

describe("agregação por dia local a partir de buckets horários (UTC)", () => {
  it("sessões das 21h–23h locais ficam no MESMO dia local, não no dia UTC seguinte", () => {
    // 23/09 22:00 em São Paulo = 24/09 01:00 UTC. Pelo date_trunc('day') do
    // servidor isso cairia em 24/09; por dia local é 23/09.
    const rows = [
      { bucket: "2026-09-24T01:00:00+00:00", sessions: 3, pageviews: 7, conversions: 1 }, // 23/09 22:00 SP
      { bucket: "2026-09-23T12:00:00+00:00", sessions: 2, pageviews: 2, conversions: 0 }, // 23/09 09:00 SP
      { bucket: "2026-09-24T03:00:00+00:00", sessions: 1, pageviews: 1, conversions: 0 }, // 24/09 00:00 SP
    ];
    const since = new Date(2026, 8, 23, 0, 0, 0, 0);
    const until = new Date(2026, 8, 24, 15, 42);
    const days = aggregateHourlyByLocalDay(rows, since, until);
    expect(days.map((d) => [d.day, d.sessions, d.pageviews, d.conversions])).toEqual([
      ["2026-09-23", 5, 9, 1],
      ["2026-09-24", 1, 1, 0],
    ]);
    expect(days[0].t).toBe(since.getTime());
  });

  it("dias sem sessão entram com zero e a grade cobre o período todo", () => {
    const since = new Date(2026, 8, 20, 0, 0, 0, 0);
    const until = new Date(2026, 8, 24, 0, 0, 0, 0); // 4 dias inteiros
    expect(localDayGrid(since, until).map((d) => d.getDate())).toEqual([20, 21, 22, 23]);
    const days = aggregateHourlyByLocalDay(
      [{ bucket: "2026-09-21T15:00:00+00:00", sessions: "4", pageviews: "6" }],
      since,
      until
    );
    expect(days.map((d) => [d.day, d.sessions, d.pageviews, d.conversions])).toEqual([
      ["2026-09-20", 0, 0, 0],
      ["2026-09-21", 4, 6, 0],
      ["2026-09-22", 0, 0, 0],
      ["2026-09-23", 0, 0, 0],
    ]);
  });

  it("bucket fora da grade é mantido e bucket inválido é ignorado", () => {
    const since = new Date(2026, 8, 23, 0, 0, 0, 0);
    const until = new Date(2026, 8, 24, 0, 0, 0, 0);
    const days = aggregateHourlyByLocalDay(
      [
        { bucket: "2026-09-19T15:00:00+00:00", sessions: 1, pageviews: 1 },
        { bucket: "não-é-data", sessions: 9, pageviews: 9 },
      ],
      since,
      until
    );
    expect(days.map((d) => [d.day, d.sessions])).toEqual([
      ["2026-09-19", 1],
      ["2026-09-23", 0],
    ]);
  });
});

describe("tabela por dia", () => {
  const now = new Date(2026, 8, 24, 15, 42, 10);
  const from = new Date(2026, 8, 22, 0, 0, 0, 0); // período 22/09 – hoje
  const point = (day: string, sessions: number) => ({
    day,
    t: new Date(`${day}T00:00:00`).getTime(),
    sessions,
    pageviews: sessions * 2,
    conversions: 0,
  });

  it("1º dia usa o lead-in como base; hoje é parcial e usa ontem até o mesmo horário", () => {
    const days = [
      point("2026-09-21", 19),
      point("2026-09-22", 68),
      point("2026-09-23", 62),
      point("2026-09-24", 16),
    ];
    const rows = buildDayTable(days, {
      from,
      now,
      todayBase: { sessions: 12, pageviews: 30, conversions: 0 },
    });
    expect(rows.map((r) => r.day)).toEqual(["2026-09-22", "2026-09-23", "2026-09-24"]);
    expect(rows[0].base?.sessions).toBe(19); // lead-in, que não aparece como linha
    expect(rows[0].partial).toBe(false);
    expect(rows[1].base?.sessions).toBe(68);
    expect(rows[2].partial).toBe(true);
    expect(rows[2].base).toEqual({ sessions: 12, pageviews: 30, conversions: 0 });
  });

  it("sem lead-in o 1º dia fica sem base; sem todayBase o dia em curso também", () => {
    const days = [point("2026-09-22", 68), point("2026-09-23", 62), point("2026-09-24", 16)];
    const rows = buildDayTable(days, { from, now });
    expect(rows[0].base).toBeNull();
    expect(rows[1].base?.sessions).toBe(68);
    expect(rows[2].base).toBeNull();
  });

  it("período encerrado ('Ontem') não marca nada como parcial", () => {
    const yFrom = new Date(2026, 8, 23, 0, 0, 0, 0);
    const days = [point("2026-09-22", 68), point("2026-09-23", 62)];
    const rows = buildDayTable(days, { from: yFrom, now });
    expect(rows).toHaveLength(1);
    expect(rows[0].day).toBe("2026-09-23");
    expect(rows[0].partial).toBe(false);
    expect(rows[0].base?.sessions).toBe(68);
  });
});
