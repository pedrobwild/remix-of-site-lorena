import { describe, expect, it } from "vitest";
import { qualifiedObjectivesReport } from "@/lib/qualifiedObjectives";

describe("painel por objetivo", () => {
  it("agrupa só qualificados e exporta investidores consentidos deduplicados", async () => {
    const base = { created_at: "2026-10-20T12:00:00Z", updated_at: "2026-10-21T12:00:00Z", status: "qualificado", objetivo: "Short stay", consent_marketing: true, email: "teste@example.com" };
    const result = await qualifiedObjectivesReport([{ ...base, id: "1" }, { ...base, id: "2" }, { ...base, id: "3", objetivo: "Moradia" }, { ...base, id: "4", status: "novo" }, { ...base, id: "5", consent_marketing: false, email: "outro@example.com" }], new Map(), new Date("2026-10-29T12:00:00Z"));
    expect(result.total).toBe(4);
    expect(result.groups).toEqual([{ objective: "Short stay", count: 3 }, { objective: "Moradia", count: 1 }]);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]["Conversion Value"]).toBe(10000);
  });
});