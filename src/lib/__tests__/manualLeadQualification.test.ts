import { describe, expect, it, vi } from "vitest";
vi.mock("@tanstack/react-start", () => ({ createServerFn: () => {
  const builder = { middleware: () => builder, inputValidator: () => builder, handler: (fn: unknown) => fn };
  return builder;
} }));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@/lib/crmAuth", () => ({ attachCrmAuth: {} }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: {} }));
const drain = vi.fn();
vi.mock("@/lib/engineQualityOutbox.server", () => ({ drainEngineQualityOutbox: (...a: unknown[]) => drain(...a) }));
import { setManualLeadQualification } from "@/lib/manualLeadQualification.functions";
const handler = setManualLeadQualification as unknown as (input: unknown) => Promise<unknown>;
const leadId = "11111111-1111-4111-8111-111111111111";
describe("qualificação manual autorizada", () => {
  it.each(["qualificado", "descartado"])("salva %s pela operação atômica", async status => {
    const rpc = vi.fn().mockResolvedValue({ data: status, error: null });
    drain.mockResolvedValueOnce({ lidos: 1, enviados: 1, ignorados: 0, reenvio: 0, falhas: 0 });
    await expect(handler({ data: { leadId, status }, context: { supabase: { rpc } } })).resolves.toEqual({ status, engine: "enviado" });
    expect(drain).toHaveBeenLastCalledWith({}, expect.any(Function), { leadId });
    expect(rpc).toHaveBeenCalledWith("set_manual_lead_qualification", { p_lead_id: leadId, p_status: status });
  });
  it("Engine fora do ar: a marcação vale no site e fica na fila", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: "descartado", error: null });
    drain.mockRejectedValueOnce(new Error("engine_unreachable"));
    await expect(handler({ data: { leadId, status: "descartado" }, context: { supabase: { rpc } } })).resolves.toEqual({ status: "descartado", engine: "pendente" });
  });
  it("não confirma sucesso quando a autorização do banco recusa", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: "Acesso restrito a administradores." } });
    await expect(handler({ data: { leadId, status: "qualificado" }, context: { supabase: { rpc } } })).rejects.toThrow("Acesso restrito a administradores.");
  });
  it("não confirma gravação sem status retornado", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    await expect(handler({ data: { leadId, status: "descartado" }, context: { supabase: { rpc } } })).rejects.toThrow("A qualificação não foi confirmada.");
  });
});