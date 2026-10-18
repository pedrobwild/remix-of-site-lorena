import { describe, expect, it, vi } from "vitest";
vi.mock("@tanstack/react-start", () => ({ createServerFn: () => {
  const builder = { middleware: () => builder, handler: (fn: unknown) => fn };
  return builder;
} }));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@/lib/crmAuth", () => ({ attachCrmAuth: {} }));
import { getFormLeads } from "../formLeads.functions";
describe("Permissão da lista de leads do formulário", () => {
  it("nega leitura a usuário sem papel de administrador antes de consultar leads", async () => {
    const from = vi.fn();
    const handler = getFormLeads as unknown as (input: unknown) => Promise<unknown>;
    await expect(handler({ context: { supabase: { rpc: async () => ({ data: false, error: null }), from } } })).rejects.toThrow("Acesso restrito a administradores.");
    expect(from).not.toHaveBeenCalled();
  });
});