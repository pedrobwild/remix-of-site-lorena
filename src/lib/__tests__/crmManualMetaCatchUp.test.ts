import { describe, expect, it, vi } from "vitest";
const sendMeta = vi.fn();
vi.mock("../../../supabase/functions/_shared/lead-quality.ts", () => ({ sendSiteLeadQuality: (...a: unknown[]) => sendMeta(...a) }));
import { MANUAL_META_WINDOW_MS, sendPendingManualQualified } from "@/lib/crmStageSync.server";

function adminWith(result: { data: unknown; error: unknown }) {
  const calls: Array<[string, ...unknown[]]> = [];
  const q: Record<string, unknown> = {};
  for (const m of ["select", "eq", "is", "gte"]) q[m] = (...a: unknown[]) => { calls.push([m, ...a]); return q; };
  q.limit = (...a: unknown[]) => { calls.push(["limit", ...a]); return Promise.resolve(result); };
  return { admin: { from: (t: string) => { calls.push(["from", t]); return q; } }, calls };
}
const env = () => undefined;
const now = new Date("2026-10-27T07:00:00Z");

describe("reposição dos qualificados do painel na Meta", () => {
  it("busca só qualificado manual, sem envio, dos últimos 7 dias, e envia cada um", async () => {
    const { admin, calls } = adminWith({ data: [{ id: "a" }, { id: "b" }], error: null });
    sendMeta.mockResolvedValueOnce({ ok: true, meta: "sent" }).mockResolvedValueOnce({ ok: true, meta: "skipped" });
    await expect(sendPendingManualQualified(admin, env, now)).resolves.toBe(1);
    expect(calls).toContainEqual(["eq", "status", "qualificado"]);
    expect(calls).toContainEqual(["eq", "manual_qualification", "qualificado"]);
    expect(calls).toContainEqual(["is", "meta_qualified_sent_at", null]);
    expect(calls).toContainEqual(["gte", "manual_qualification_at", new Date(now.getTime() - MANUAL_META_WINDOW_MS).toISOString()]);
    expect(sendMeta).toHaveBeenCalledWith(admin, env, "a", "qualificado", { eventSource: "Painel Bewild" });
  });
  it("erro na leitura não derruba a sincronização", async () => {
    const { admin } = adminWith({ data: null, error: { code: "x" } });
    await expect(sendPendingManualQualified(admin, env, now)).resolves.toBe(0);
    await expect(sendPendingManualQualified({ from: () => { throw new Error("boom"); } }, env, now)).resolves.toBe(0);
  });
  it("falha num lead não interrompe os outros", async () => {
    const { admin } = adminWith({ data: [{ id: "a" }, { id: "b" }], error: null });
    sendMeta.mockRejectedValueOnce(new Error("meta")).mockResolvedValueOnce({ ok: true, meta: "sent" });
    await expect(sendPendingManualQualified(admin, env, now)).resolves.toBe(1);
  });
});
