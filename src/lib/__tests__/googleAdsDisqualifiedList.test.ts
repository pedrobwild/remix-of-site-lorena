import { describe, expect, it } from "vitest";
import { buildDisqualifiedMembers } from "@/lib/googleAdsDisqualifiedList.server";

const rec = (id: string, at: string, advertising = true) => ({ id, visitor_key: "v1", advertising, notice_version: "1", created_at: at });
const lead = (o: Record<string, unknown> = {}) => ({ id: "l1", created_at: "2026-10-20T12:00:00Z", status: "descartado", email: "A@x.com", whatsapp: "11999998888", consent_marketing: true, consent_record_id: "r1", consent_visitor_key: "v1", ...o });
const now = Date.parse("2026-10-25T12:00:00Z");

describe("lista de desqualificados do Google Ads", () => {
  it("não qualificado com aceite entra com e-mail e telefone em hash", async () => {
    const m = await buildDisqualifiedMembers([lead()], [rec("r1", "2026-10-20T11:00:00Z")], now);
    expect(m).toHaveLength(1);
    expect(m[0].emailHash).toMatch(/^[0-9a-f]{64}$/);
    expect(m[0].phoneHash).toMatch(/^[0-9a-f]{64}$/);
  });
  it("qualificado não entra", async () => {
    expect(await buildDisqualifiedMembers([lead({ status: "qualificado" })], [rec("r1", "2026-10-20T11:00:00Z")], now)).toEqual([]);
  });
  it("sem aceite registrado ou com recusa posterior não entra", async () => {
    expect(await buildDisqualifiedMembers([lead()], [], now)).toEqual([]);
    expect(await buildDisqualifiedMembers([lead()], [rec("r1", "2026-10-20T11:00:00Z"), rec("r2", "2026-10-22T11:00:00Z", false)], now)).toEqual([]);
  });
});
