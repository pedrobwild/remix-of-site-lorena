import { describe, expect, it, vi } from "vitest";
vi.mock("@tanstack/react-start", () => ({ createServerFn: () => {
  const builder = { middleware: () => builder, inputValidator: () => builder, handler: (fn: unknown) => fn };
  return builder;
} }));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@/lib/crmAuth", () => ({ attachCrmAuth: {} }));
import { getSearchConsoleSnapshot, refreshSearchConsoleSnapshot } from "@/lib/searchConsoleSnapshot.functions";
describe("Permissão Search Console", () => {
  for (const [name, fn] of [["leitura", getSearchConsoleSnapshot], ["atualização", refreshSearchConsoleSnapshot]] as const) {
    it(`bloqueia ${name} por não administrador antes de ler relatórios`, async () => {
      const from = vi.fn();
      const handler = fn as unknown as (args: unknown) => Promise<unknown>;
      await expect(handler({ data: {}, context: { supabase: { rpc: async () => ({ data: false, error: null }), from } } })).rejects.toThrow("Acesso restrito a administradores.");
      expect(from).not.toHaveBeenCalled();
    });
  }
});