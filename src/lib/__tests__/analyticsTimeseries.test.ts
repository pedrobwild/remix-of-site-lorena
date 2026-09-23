import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  alignPrevious,
  bucketGrid,
  fillTimeseries,
  fmtLocalDay,
  formatBucketLabel,
  parseLocalDay,
  pickGrain,
  truncUtc,
} from "@/lib/analyticsTimeseries";

// O bug do ADM-13 só aparece em fuso negativo (São Paulo, UTC−3).
const ORIGINAL_TZ = process.env.TZ;
beforeAll(() => {
  process.env.TZ = "America/Sao_Paulo";
});
afterAll(() => {
  if (ORIGINAL_TZ === undefined) delete process.env.TZ;
  else process.env.TZ = ORIGINAL_TZ;
});

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

describe("datas da URL do Analytics (local, não UTC)", () => {
  it("fmtLocalDay usa a data local mesmo às 23:59 em UTC−3", () => {
    const fimDoDia = new Date(2026, 8, 30, 23, 59, 59, 999); // 30/09 23:59 local
    expect(fimDoDia.getTimezoneOffset()).toBe(180); // garante que o teste roda em SP
    expect(fmtLocalDay(fimDoDia)).toBe("2026-09-30");
    // O formato antigo (toISOString) empurrava para o dia seguinte:
    expect(fimDoDia.toISOString().slice(0, 10)).toBe("2026-10-01");
  });

  it("gravar e ler de novo não desloca o período (várias recargas)", () => {
    let to = endOfDay(new Date(2026, 8, 30));
    for (let i = 0; i < 5; i++) {
      const parsed = parseLocalDay(fmtLocalDay(to));
      expect(parsed).not.toBeNull();
      to = endOfDay(parsed as Date);
    }
    expect(fmtLocalDay(to)).toBe("2026-09-30");
  });

  it("parseLocalDay devolve meia-noite local e rejeita datas inválidas", () => {
    const d = parseLocalDay("2026-01-05") as Date;
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2026, 0, 5, 0]);
    expect(parseLocalDay("2026-02-31")).toBeNull();
    expect(parseLocalDay("2026-13-01")).toBeNull();
    expect(parseLocalDay("05/01/2026")).toBeNull();
    expect(parseLocalDay(null)).toBeNull();
    expect(parseLocalDay("")).toBeNull();
  });
});

describe("grade de buckets", () => {
  it("pickGrain segue a duração", () => {
    const from = new Date("2026-09-01T03:00:00Z");
    expect(pickGrain(from, new Date("2026-09-02T02:59:59Z"))).toBe("hour");
    expect(pickGrain(from, new Date("2026-10-01T02:59:59Z"))).toBe("day");
    expect(pickGrain(from, new Date("2027-01-01T02:59:59Z"))).toBe("week");
    expect(pickGrain(from, new Date("2028-01-01T02:59:59Z"))).toBe("month");
  });

  it("truncUtc imita date_trunc em UTC (semana começa na segunda)", () => {
    const d = new Date("2026-09-23T15:42:10Z"); // quarta-feira
    expect(truncUtc(d, "hour").toISOString()).toBe("2026-09-23T15:00:00.000Z");
    expect(truncUtc(d, "day").toISOString()).toBe("2026-09-23T00:00:00.000Z");
    expect(truncUtc(d, "week").toISOString()).toBe("2026-09-21T00:00:00.000Z");
    expect(truncUtc(d, "month").toISOString()).toBe("2026-09-01T00:00:00.000Z");
    // domingo pertence à semana que começou na segunda anterior
    expect(truncUtc(new Date("2026-09-27T10:00:00Z"), "week").toISOString()).toBe(
      "2026-09-21T00:00:00.000Z",
    );
  });

  it("bucketGrid cobre todos os dias tocados pelo intervalo", () => {
    const grid = bucketGrid(
      new Date("2026-09-01T03:00:00Z"),
      new Date("2026-09-04T02:59:59.999Z"),
      "day",
    );
    expect(grid.map((t) => new Date(t).toISOString().slice(0, 10))).toEqual([
      "2026-09-01",
      "2026-09-02",
      "2026-09-03",
      "2026-09-04",
    ]);
  });
});

describe("fillTimeseries + alignPrevious", () => {
  const since = new Date("2026-09-01T00:00:00Z");
  const until = new Date("2026-09-05T00:00:00Z");

  it("dias sem sessão viram 0 (a RPC não devolve o bucket)", () => {
    const series = fillTimeseries(
      [
        { bucket: "2026-09-01T00:00:00+00:00", sessions: 5, pageviews: 9 },
        { bucket: "2026-09-04T00:00:00+00:00", sessions: "2", pageviews: "3" },
      ],
      since,
      until,
      "day",
    );
    expect(series.map((p) => p.sessions)).toEqual([5, 0, 0, 2]);
    expect(series.map((p) => p.pageviews)).toEqual([9, 0, 0, 3]);
  });

  it("bucket fora da grade (fuso diferente) não é descartado", () => {
    const series = fillTimeseries(
      [{ bucket: "2026-09-02T03:00:00+00:00", sessions: 7, pageviews: 7 }],
      since,
      until,
      "day",
    );
    expect(series.reduce((acc, p) => acc + p.sessions, 0)).toBe(7);
  });

  it("período anterior é casado por deslocamento, não por posição no array bruto", () => {
    const cur = fillTimeseries(
      [
        { bucket: "2026-09-01T00:00:00Z", sessions: 10, pageviews: 10 },
        { bucket: "2026-09-03T00:00:00Z", sessions: 30, pageviews: 30 },
      ],
      since,
      until,
      "day",
    );
    // Anterior: 28/08..31/08, com o 2º dia (29/08) vazio.
    const prev = fillTimeseries(
      [
        { bucket: "2026-08-28T00:00:00Z", sessions: 1, pageviews: 1 },
        { bucket: "2026-08-30T00:00:00Z", sessions: 3, pageviews: 3 },
        { bucket: "2026-08-31T00:00:00Z", sessions: 4, pageviews: 4 },
      ],
      new Date("2026-08-28T00:00:00Z"),
      since,
      "day",
    );
    const aligned = alignPrevious(cur, prev);
    expect(aligned.map((p) => p.prevSessions)).toEqual([1, 0, 3, 4]);
    expect(aligned.map((p) => p.sessions)).toEqual([10, 0, 30, 0]);
  });

  it("rótulos de dia usam a data UTC do bucket (sem voltar um dia em SP)", () => {
    const t = Date.parse("2026-09-01T00:00:00Z");
    expect(formatBucketLabel(t, "day")).toBe("01/09");
    expect(formatBucketLabel(t, "week")).toBe("sem. 01/09");
  });
});
