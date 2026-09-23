/**
 * CORE-24 — data do post é o dia civil em São Paulo, igual para qualquer
 * visitante. Antes `formatBewildDate` usava o fuso do navegador e
 * `postDates` comparava dias UTC: `published_at = 2026-09-22` (meia-noite
 * UTC) aparecia "21 set" no Brasil.
 *
 * Também: área dos cards da home em pt-BR ("27,5 m²", não "27.5 m²").
 */
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: vi.fn(), rpc: vi.fn() } }));

import { bewildCalendarDay, postDates } from "../postSeo";
import { formatBewildDate } from "../useBewildPosts";
import { formatAreaM2 } from "../hydrateHomeProjects";

const originalTz = process.env.TZ;
afterEach(() => {
  process.env.TZ = originalTz;
});

describe("bewildCalendarDay", () => {
  it.each([
    ["2026-09-22", "2026-09-22"],
    ["2026-09-22T00:00:00+00:00", "2026-09-22"], // data gravada sem hora (timestamptz)
    ["2026-09-22T00:00:00Z", "2026-09-22"],
    ["2026-09-22T00:00:00.000Z", "2026-09-22"],
    ["2026-09-22T02:30:00Z", "2026-09-21"], // 23:30 do dia 21 em São Paulo
    ["2026-09-22T15:00:00Z", "2026-09-22"],
    ["2026-09-22T23:59:00-03:00", "2026-09-22"],
  ])("%s → %s", (iso, day) => {
    expect(bewildCalendarDay(iso)).toBe(day);
  });

  it("valor ausente ou inválido → null", () => {
    expect(bewildCalendarDay(null)).toBeNull();
    expect(bewildCalendarDay("")).toBeNull();
    expect(bewildCalendarDay("ontem")).toBeNull();
  });
});

describe("formatBewildDate — mesmo dia em qualquer fuso do visitante", () => {
  it.each(["America/Sao_Paulo", "America/Los_Angeles", "Asia/Tokyo", "UTC"])("TZ=%s", (tz) => {
    process.env.TZ = tz;
    expect(formatBewildDate("2026-09-22T00:00:00+00:00")).toMatch(/^22 de set/);
    expect(formatBewildDate("2026-09-22")).toMatch(/^22 de set/);
    expect(formatBewildDate("2026-09-22T02:30:00Z")).toMatch(/^21 de set/);
  });

  it("vazio/inválido → string vazia", () => {
    expect(formatBewildDate(null)).toBe("");
    expect(formatBewildDate("xx")).toBe("");
  });
});

describe("postDates — 'Atualizado em' por dia de São Paulo", () => {
  it("edição à noite em SP (já dia seguinte em UTC) no mesmo dia da publicação não mostra 'Atualizado'", () => {
    const d = postDates({ published_at: "2026-09-22T12:00:00Z", updated_at: "2026-09-23T01:00:00Z" });
    expect(d.showUpdated).toBe(false);
  });

  it("edição em outro dia de SP mostra 'Atualizado'", () => {
    const d = postDates({ published_at: "2026-09-22T00:00:00+00:00", updated_at: "2026-09-23T15:00:00Z" });
    expect(d.showUpdated).toBe(true);
  });
});

describe("formatAreaM2", () => {
  it("formata em pt-BR", () => {
    expect(formatAreaM2(27.5)).toBe("27,5 m²");
    expect(formatAreaM2(42)).toBe("42 m²");
    expect(formatAreaM2(33.333)).toBe("33,3 m²");
  });

  it("ausente/inválido → null", () => {
    expect(formatAreaM2(null)).toBeNull();
    expect(formatAreaM2(0)).toBeNull();
    expect(formatAreaM2(Number.NaN)).toBeNull();
  });
});
