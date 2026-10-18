import { describe, expect, it, vi } from "vitest";
vi.mock("@tanstack/react-start", () => ({ createServerFn: () => {
  const builder = { middleware: () => builder, inputValidator: () => builder, handler: (fn: unknown) => fn };
  return builder;
} }));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@/lib/crmAuth", () => ({ attachCrmAuth: {} }));
import { getQuoteCrmReport } from "../quoteCrmReport.functions";
describe("Permissão do relatório orçamento até CRM", () => {
  it("nega leitura a usuário sem papel de administrador", async () => {
    const from = vi.fn();
    const handler = getQuoteCrmReport as unknown as (input: unknown) => Promise<unknown>;
    await expect(handler({ data: {}, context: { supabase: { rpc: async () => ({ data: false, error: null }), from } } })).rejects.toThrow("Acesso restrito a administradores.");
    expect(from).not.toHaveBeenCalled();
  });
});