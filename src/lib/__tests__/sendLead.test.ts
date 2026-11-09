/**
 * `sendLead`/`sendLeadBody`: o corpo enviado ao notify-lead leva o
 * `submission_id` (deduplicação no servidor quando a caixa de saída reenvia).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const invokeMock = vi.fn();
vi.mock("@/integrations/supabase/lazyClient", () => ({
  getSupabase: async () => ({ functions: { invoke: (...a: unknown[]) => invokeMock(...a) } }),
}));

import { sendLead, sendLeadBody } from "../sendLead";
import type { LeadPayload } from "../leadDelivery";

const payload: LeadPayload = {
  name: "Ana",
  whatsapp: "11912345678",
  email: null,
  location: null,
  area_m2: null,
  objetivo: null,
  chaves: null,
  planta: null,
  message: null,
  utm_source: null,
  utm_medium: null,
  utm_campaign: "120252065401790152",
  referrer: null,
  landing_path: "/",
  user_agent: null,
  form_path: "/orcamento",
};
const SID = "00000000-0000-4000-8000-000000000001";

beforeEach(() => invokeMock.mockReset());

describe("sendLead", () => {
  it("manda submission_id e tracking no corpo", async () => {
    invokeMock.mockResolvedValue({ data: { ok: true, lead_insert: { status: "sent", id: "x" } }, error: null });
    const r = await sendLead(payload, {
      submissionId: SID,
      tracking: { event_id: "evt-12345678", consent_marketing: false, fbp: null, fbc: null },
    });
    expect(r).toEqual({ delivered: true, timedOut: false });
    const [fn, { body }] = invokeMock.mock.calls[0];
    expect(fn).toBe("notify-lead");
    expect(body).toMatchObject({ submission_id: SID, event_id: "evt-12345678", utm_campaign: "120252065401790152" });
  });

  it("resposta de duplicado (já gravado antes) conta como entregue", async () => {
    invokeMock.mockResolvedValue({ data: { ok: true, duplicate: true, lead_insert: { status: "sent", id: "x" } }, error: null });
    await expect(sendLeadBody({ ...payload, submission_id: SID })).resolves.toEqual({ delivered: true, timedOut: false });
  });

  it("reenvio legado sem form_path mantém o submission_id", async () => {
    invokeMock
      .mockResolvedValueOnce({ data: null, error: { context: { status: 400 } } })
      .mockResolvedValueOnce({ data: { ok: true, lead_insert: { status: "sent" } }, error: null });
    await sendLeadBody({ ...payload, submission_id: SID });
    const legacy = invokeMock.mock.calls[1][1].body;
    expect(legacy.form_path).toBeUndefined();
    expect(legacy.submission_id).toBe(SID);
  });
});
