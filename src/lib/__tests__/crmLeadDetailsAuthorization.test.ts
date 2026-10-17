import { describe, expect, it, vi } from "vitest";
vi.mock("@tanstack/react-start", () => ({ createServerFn: () => {
  const builder = { middleware: () => builder, inputValidator: () => builder, handler: (fn: unknown) => fn };
  return builder;
} }));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@/lib/crmAuth", () => ({ attachCrmAuth: {} }));
import { getCrmLeadDetails } from "@/lib/crmLeadDetails.functions";
describe("autorização das propostas por lead", () => {
  it("nega acesso antes de ler dados para não administradores", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: false, error: null });
    const from = vi.fn();
    const handler = getCrmLeadDetails as unknown as (input: unknown) => Promise<unknown>;
    await expect(handler({ context: { supabase: { rpc, from } }, data: { leadId: "11111111-1111-4111-8111-111111111111" } })).rejects.toThrow("Acesso restrito a administradores.");
    expect(from).not.toHaveBeenCalled();
  });
  it("nega consulta de pedido inexistente mesmo para administrador", async () => {
    const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: null, error: null }) };
    const handler = getCrmLeadDetails as unknown as (input: unknown) => Promise<unknown>;
    await expect(handler({ context: { supabase: { rpc: async () => ({ data: true, error: null }), from: () => query } }, data: { leadId: "11111111-1111-4111-8111-111111111111" } })).rejects.toThrow("Pedido não encontrado ou sem permissão.");
  });
});