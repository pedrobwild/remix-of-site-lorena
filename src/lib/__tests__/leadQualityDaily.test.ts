import { describe, expect, it } from "vitest";
import { qualityDaily } from "../leadQualityDaily";
describe("qualificações diárias", () => {
  it("conta qualificados e não qualificados no dia de São Paulo sem duplicar", () => {
    const rows = qualityDaily([
      { lead_id: "a", to_status: "qualificado", created_at: "2026-10-25T01:00:00Z" },
      { lead_id: "a", to_status: "qualificado", created_at: "2026-10-25T02:00:00Z" },
      { lead_id: "b", to_status: "descartado", created_at: "2026-10-25T12:00:00Z" },
      { lead_id: "c", to_status: "novo", created_at: "2026-10-25T12:00:00Z" },
    ], new Date("2026-10-25T19:00:00Z"));
    expect(rows).toHaveLength(30);
    expect(rows.find(row => row.day === "2026-10-24")).toEqual({ day: "2026-10-24", qualified: 1, disqualified: 0 });
    expect(rows.at(-1)).toEqual({ day: "2026-10-25", qualified: 0, disqualified: 1 });
  });
});