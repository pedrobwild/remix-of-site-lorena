import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    const builder = { middleware: () => builder, inputValidator: () => builder, handler: (handler: unknown) => handler };
    return builder;
  },
}));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@/lib/crmAuth", () => ({ attachCrmAuth: {} }));

import { listExternalConnections, removeExternalConnection, saveExternalConnection, testEngineConnection } from "@/lib/externalApi.functions";

describe("permissões das chaves externas", () => {
  it.each([
    ["listar", listExternalConnections],
    ["salvar", saveExternalConnection],
    ["remover", removeExternalConnection],
    ["testar", testEngineConnection],
  ])("não permite %s para usuário que não é administrador", async (_name, fn) => {
    const rpc = vi.fn().mockResolvedValue({ data: false, error: null });
    const handler = fn as unknown as (input: { context: { supabase: { rpc: typeof rpc } }; data: unknown }) => Promise<unknown>;
    await expect(handler({ context: { supabase: { rpc } }, data: {} })).rejects.toThrow("Acesso restrito a administradores.");
    expect(rpc).toHaveBeenCalledWith("is_admin");
  });
});