import { describe, expect, it, vi } from "vitest";
vi.mock("@tanstack/react-start", () => ({ createServerFn: () => {
  const builder = { middleware: () => builder, handler: (fn: unknown) => fn };
  return builder;
} }));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@/lib/crmAuth", () => ({ attachCrmAuth: {} }));
vi.mock("@/lib/externalApi.server", () => ({ resolveEngineKey: vi.fn() }));
import { getCrmProfileSummary } from "@/lib/crmProfiles.functions";
import { resolveEngineKey } from "@/lib/externalApi.server";
describe("autorização do resumo qualitativo", () => {
  it("bloqueia não administradores antes de usar a chave externa", async () => {
    const handler = getCrmProfileSummary as unknown as (input: unknown) => Promise<unknown>;
    await expect(handler({ context: { supabase: { rpc: async () => ({ data: false, error: null }) } } })).rejects.toThrow("Acesso restrito a administradores.");
    expect(resolveEngineKey).not.toHaveBeenCalled();
  });
});