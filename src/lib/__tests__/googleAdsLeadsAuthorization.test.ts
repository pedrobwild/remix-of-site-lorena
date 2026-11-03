import { describe, expect, it, vi } from "vitest";
vi.mock("@tanstack/react-start", () => ({ createServerFn: () => {
  const builder = { middleware: () => builder, inputValidator: () => builder, handler: (fn: unknown) => fn };
  return builder;
} }));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@/lib/crmAuth", () => ({ attachCrmAuth: {} }));
import { getGoogleAdsLeadsReport } from "@/lib/googleAdsLeadsReport.functions";

describe("Permissão do relatório Google Ads", () => {
  it("bloqueia não administradores antes de acessar a conta de anúncios", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    try {
      const handler = getGoogleAdsLeadsReport as unknown as (input: unknown) => Promise<unknown>;
      await expect(handler({ data: { from: "2026-11-01", to: "2026-11-02" }, context: { supabase: { rpc: async () => ({ data: false, error: null }) } } })).rejects.toThrow("Acesso restrito a administradores.");
      expect(fetch).not.toHaveBeenCalled();
    } finally { vi.unstubAllGlobals(); }
  });
});