import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  addLocalDays,
  addLocalGrain,
  alignedPreviousWindow,
  browserTimeZone,
  buildDayTable,
  effectiveWindow,
  fillLocalSeries,
  formatLocalAxisLabel,
  formatLocalBucketLabel,
  formatWindowLabel,
  fullPreviousWindow,
  invertDir,
  localBucketGrid,
  rangeLengthMs,
  sumCounts,
  todaySoFarWindow,
  trend,
  truncLocal,
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
/** Início de bucket local como a RPC v2 devolve (timestamptz, aqui em ISO UTC). */
function bucketIso(y: number, m: number, d: number, h = 0) {
  return new Date(y, m - 1, d, h).toISOString();
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

  it("browserTimeZone devolve o fuso IANA do ambiente", () => {
    expect(browserTimeZone()).toBe("America/Sao_Paulo");
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

describe("rótulos", () => {
  it("janela: dia inteiro, dia parcial e intervalos", () => {
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

  it("bucket local por granularidade", () => {
    const t = new Date(2026, 8, 24, 15, 0).getTime();
    expect(formatLocalBucketLabel(t, "hour")).toBe("15:00");
    expect(formatLocalBucketLabel(t, "hour", true)).toBe("24/09 15:00");
    expect(formatLocalBucketLabel(t, "day")).toMatch(/^qui\.?,? 24\/09$/);
    expect(formatLocalBucketLabel(new Date(2026, 8, 21).getTime(), "week")).toBe("sem. 21/09");
    expect(formatLocalBucketLabel(new Date(2026, 8, 1).getTime(), "month")).toMatch(
      /^set\.? de 26$/
    );
  });

  it("eixo X: rótulos curtos (até 7 caracteres) para não cortar nas bordas", () => {
    const t = new Date(2026, 8, 24, 15, 0).getTime();
    expect(formatLocalAxisLabel(t, "hour")).toBe("15:00");
    expect(formatLocalAxisLabel(t, "day")).toBe("24/09");
    expect(formatLocalAxisLabel(new Date(2026, 8, 21).getTime(), "week")).toBe("21/09");
    const month = formatLocalAxisLabel(new Date(2026, 8, 1).getTime(), "month");
    expect(month).toMatch(/^set\.? de 26$/);
    for (const g of ["hour", "day", "week"] as const) {
      expect(formatLocalAxisLabel(t, g).length).toBeLessThanOrEqual(7);
    }
  });
});

describe("grade de buckets em horário local", () => {
  it("truncLocal: hora, dia, semana ISO (segunda) e mês", () => {
    const d = new Date(2026, 8, 24, 15, 42, 10); // quinta
    expect(truncLocal(d, "hour")).toEqual(new Date(2026, 8, 24, 15, 0, 0, 0));
    expect(truncLocal(d, "day")).toEqual(new Date(2026, 8, 24, 0, 0, 0, 0));
    expect(truncLocal(d, "week")).toEqual(new Date(2026, 8, 21, 0, 0, 0, 0)); // seg 21/09
    expect(truncLocal(new Date(2026, 8, 21, 3), "week")).toEqual(new Date(2026, 8, 21)); // segunda fica
    expect(truncLocal(new Date(2026, 8, 20, 23), "week")).toEqual(new Date(2026, 8, 14)); // domingo → segunda anterior
    expect(truncLocal(d, "month")).toEqual(new Date(2026, 8, 1, 0, 0, 0, 0));
  });

  it("addLocalGrain anda em calendário local", () => {
    const d = new Date(2026, 8, 24);
    expect(addLocalGrain(d, "hour", 2)).toEqual(new Date(2026, 8, 24, 2));
    expect(addLocalGrain(d, "day", -1)).toEqual(new Date(2026, 8, 23));
    expect(addLocalGrain(d, "week", 1)).toEqual(new Date(2026, 9, 1));
    expect(addLocalGrain(new Date(2026, 0, 31), "month", 1)).toEqual(new Date(2026, 2, 3)); // JS: 31/02 → 03/03
    expect(addLocalGrain(new Date(2026, 8, 1), "month", 1)).toEqual(new Date(2026, 9, 1));
  });

  it("localBucketGrid cobre [since, until) e começa no bucket que contém since", () => {
    const since = new Date(2026, 8, 24, 0, 0);
    const until = new Date(2026, 8, 24, 3, 30); // 03:30 → buckets 00,01,02,03
    expect(localBucketGrid(since, until, "hour").map((t) => new Date(t).getHours())).toEqual([
      0, 1, 2, 3,
    ]);
    expect(
      localBucketGrid(new Date(2026, 8, 20), new Date(2026, 8, 24), "day").map((t) =>
        new Date(t).getDate()
      )
    ).toEqual([20, 21, 22, 23]);
    // 18/09 (sex) → semana começa em 14/09; até 25/09 pega 14/09 e 21/09
    expect(
      localBucketGrid(new Date(2026, 8, 18), new Date(2026, 8, 25), "week").map((t) =>
        new Date(t).getDate()
      )
    ).toEqual([14, 21]);
    expect(localBucketGrid(new Date(2026, 8, 24), new Date(2026, 8, 24), "day")).toEqual([]);
  });
});

describe("série da RPC v2 em horário local", () => {
  it("casa os buckets pelo instante de início e zera os dias sem sessão", () => {
    const since = new Date(2026, 8, 20);
    const until = new Date(2026, 8, 24); // 4 dias inteiros
    const rows = [
      {
        bucket: bucketIso(2026, 9, 21),
        sessions: "4",
        visitors: "3",
        pageviews: "6",
        conversions: "1",
      },
      {
        bucket: bucketIso(2026, 9, 23),
        sessions: 62,
        visitors: 30,
        pageviews: 176,
        conversions: 1,
      },
    ];
    const s = fillLocalSeries(rows, since, until, "day");
    expect(
      s.map((p) => [new Date(p.t).getDate(), p.sessions, p.visitors, p.pageviews, p.conversions])
    ).toEqual([
      [20, 0, 0, 0, 0],
      [21, 4, 3, 6, 1],
      [22, 0, 0, 0, 0],
      [23, 62, 30, 176, 1],
    ]);
  });

  it("o bucket de 22h locais fica no dia local (a RPC já devolve o início do dia local)", () => {
    // 23/09 22:00 SP = 24/09 01:00 UTC. A v2 agrupa no fuso pedido, então o
    // bucket chega como 23/09 00:00 SP (= 2026-09-23T03:00:00Z).
    const rows = [
      {
        bucket: "2026-09-23T03:00:00+00:00",
        sessions: 5,
        visitors: 2,
        pageviews: 9,
        conversions: 0,
      },
    ];
    const s = fillLocalSeries(rows, new Date(2026, 8, 23), new Date(2026, 8, 25), "day");
    expect(s.map((p) => [new Date(p.t).getDate(), p.sessions])).toEqual([
      [23, 5],
      [24, 0],
    ]);
  });

  it("bucket fora da grade é mantido e bucket inválido é ignorado", () => {
    const s = fillLocalSeries(
      [
        { bucket: bucketIso(2026, 9, 19), sessions: 1, visitors: 1, pageviews: 1, conversions: 0 },
        { bucket: "não-é-data", sessions: 9, visitors: 9, pageviews: 9, conversions: 9 },
      ],
      new Date(2026, 8, 23),
      new Date(2026, 8, 24),
      "day"
    );
    expect(s.map((p) => [new Date(p.t).getDate(), p.sessions])).toEqual([
      [19, 1],
      [23, 0],
    ]);
  });

  it("sumCounts soma as contagens", () => {
    expect(
      sumCounts([
        { sessions: 1, visitors: 1, pageviews: 2, conversions: 0 },
        { sessions: 2, visitors: 1, pageviews: 3, conversions: 1 },
      ])
    ).toEqual({ sessions: 3, visitors: 2, pageviews: 5, conversions: 1 });
  });
});

describe("tabela por dia", () => {
  const now = new Date(2026, 8, 24, 15, 42, 10);
  const from = new Date(2026, 8, 22, 0, 0, 0, 0); // período 22/09 – hoje
  const point = (d: number, sessions: number) => ({
    t: new Date(2026, 8, d).getTime(),
    sessions,
    visitors: Math.ceil(sessions / 2),
    pageviews: sessions * 2,
    conversions: 0,
  });

  it("1º dia usa o lead-in como base; hoje é parcial e usa ontem até o mesmo horário", () => {
    const points = [point(21, 19), point(22, 68), point(23, 62), point(24, 16)];
    const rows = buildDayTable(points, {
      from,
      now,
      todayBase: { sessions: 12, visitors: 10, pageviews: 30, conversions: 0 },
    });
    expect(rows.map((r) => r.day)).toEqual(["2026-09-22", "2026-09-23", "2026-09-24"]);
    expect(rows[0].base?.sessions).toBe(19); // lead-in, que não aparece como linha
    expect(rows[0].partial).toBe(false);
    expect(rows[1].base).toEqual({ sessions: 68, visitors: 34, pageviews: 136, conversions: 0 });
    expect(rows[2].partial).toBe(true);
    expect(rows[2].base).toEqual({ sessions: 12, visitors: 10, pageviews: 30, conversions: 0 });
  });

  it("sem lead-in o 1º dia fica sem base; sem todayBase o dia em curso também", () => {
    const points = [point(22, 68), point(23, 62), point(24, 16)];
    const rows = buildDayTable(points, { from, now });
    expect(rows[0].base).toBeNull();
    expect(rows[1].base?.sessions).toBe(68);
    expect(rows[2].base).toBeNull();
  });

  it("período encerrado ('Ontem') não marca nada como parcial", () => {
    const yFrom = new Date(2026, 8, 23, 0, 0, 0, 0);
    const points = [point(22, 68), point(23, 62)];
    const rows = buildDayTable(points, { from: yFrom, now });
    expect(rows).toHaveLength(1);
    expect(rows[0].day).toBe("2026-09-23");
    expect(rows[0].partial).toBe(false);
    expect(rows[0].base?.sessions).toBe(68);
  });
});
