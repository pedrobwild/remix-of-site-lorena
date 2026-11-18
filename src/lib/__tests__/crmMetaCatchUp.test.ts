import { describe, expect, it, vi } from "vitest";
const sendMeta = vi.fn();
vi.mock("../../../supabase/functions/_shared/lead-quality.ts", () => ({ sendSiteLeadQuality: (...a: unknown[]) => sendMeta(...a) }));
import { META_CATCH_UP_WINDOW_MS, sendPendingPipelineQualified } from "@/lib/crmStageSync.server";

function adminWith(result: { data: unknown; error: unknown }) {
  const calls: Array<[string, ...unknown[]]> = [];
  const q: Record<string, unknown> = {};
  for (const m of ["select", "is", "gte", "order"]) q[m] = (...a: unknown[]) => { calls.push([m, ...a]); return q; };
  q.limit = (...a: unknown[]) => { calls.push(["limit", ...a]); return Promise.resolve(result); };
  return { admin: { from: (t: string) => { calls.push(["from", t]); return q; } }, calls };
}
const env = () => undefined;
const now = new Date("2026-10-27T07:00:00Z");
const lead = (over: Record<string, unknown>) => ({ id: "a", created_at: "2026-10-20T12:00:00Z", crm_won: false, crm_lost: false, crm_max_stage_key: "lead", crm_last_change_at: "2026-10-26T12:00:00Z", ...over });

describe("reposição na Meta dos qualificados pelo pipeline que ficaram sem envio", () => {
  it("busca sem meta_qualified_sent_at e com mudança no CRM nos últimos 7 dias; envia só quem está qualificado pelo funil", async () => {
    const rows = [lead({ id: "a" }), lead({ id: "b", crm_max_stage_key: "mql" }), lead({ id: "c", crm_won: true, crm_max_stage_key: null })];
    const { admin, calls } = adminWith({ data: rows, error: null });
    sendMeta.mockResolvedValueOnce({ ok: true, meta: "sent" }).mockResolvedValueOnce({ ok: true, meta: "skipped" });
    await expect(sendPendingPipelineQualified(admin, env, now)).resolves.toBe(1);
    expect(calls).toContainEqual(["from", "leads"]);
    expect(calls).toContainEqual(["is", "meta_qualified_sent_at", null]);
    expect(calls).toContainEqual(["gte", "crm_last_change_at", new Date(now.getTime() - META_CATCH_UP_WINDOW_MS).toISOString()]);
    expect(sendMeta).toHaveBeenCalledTimes(2);
    expect(sendMeta).toHaveBeenNthCalledWith(1, admin, env, "a", "qualificado", { eventSource: "Bwild Engine" });
    expect(sendMeta).toHaveBeenNthCalledWith(2, admin, env, "c", "qualificado", { eventSource: "Bwild Engine" });
  });
  it("erro na leitura ou lista vazia → 0, sem lançar", async () => {
    sendMeta.mockClear();
    await expect(sendPendingPipelineQualified(adminWith({ data: null, error: { code: "x" } }).admin, env, now)).resolves.toBe(0);
    await expect(sendPendingPipelineQualified(adminWith({ data: [], error: null }).admin, env, now)).resolves.toBe(0);
    expect(sendMeta).not.toHaveBeenCalled();
  });
  it("um envio que lança não derruba os outros", async () => {
    sendMeta.mockClear();
    const { admin } = adminWith({ data: [lead({ id: "a" }), lead({ id: "b" })], error: null });
    sendMeta.mockRejectedValueOnce(new Error("meta_down")).mockResolvedValueOnce({ ok: true, meta: "sent" });
    await expect(sendPendingPipelineQualified(admin, env, now)).resolves.toBe(1);
  });
});
