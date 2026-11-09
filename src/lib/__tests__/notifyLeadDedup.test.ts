/**
 * notify-lead: reenvio com o mesmo `submission_id` (caixa de saída do site)
 * é reconhecido antes de gravar e avisar de novo. Os testes completos da
 * função ficam em supabase/functions/notify-lead/lead.test.ts (Deno); este
 * roda no CI do Vitest.
 */
import { describe, expect, it, vi } from "vitest";
import { findLeadBySubmission, isMissingColumnError, type LeadLookupClient } from "@/../supabase/functions/notify-lead/dedup";

function client(result: { data: unknown; error: { code?: string } | null }): LeadLookupClient & { eq: ReturnType<typeof vi.fn> } {
  const eq = vi.fn(() => ({ limit: () => ({ maybeSingle: () => Promise.resolve(result) }) }));
  return { eq, from: () => ({ select: () => ({ eq }) }) };
}

describe("findLeadBySubmission", () => {
  it("devolve o id do lead já gravado com o mesmo submission_id", async () => {
    const c = client({ data: { id: "db-id" }, error: null });
    await expect(findLeadBySubmission(c, "8f0c2b1e-1111-4222-8333-944455556666")).resolves.toBe("db-id");
    expect(c.eq).toHaveBeenCalledWith("submission_id", "8f0c2b1e-1111-4222-8333-944455556666");
  });

  it("antes da migration (coluna inexistente) segue sem deduplicar", async () => {
    expect(isMissingColumnError({ code: "42703" })).toBe(true);
    expect(isMissingColumnError({ code: "PGRST204" })).toBe(true);
    await expect(findLeadBySubmission(client({ data: null, error: { code: "42703" } }), "x")).resolves.toBeNull();
  });

  it("sem submission_id não consulta", async () => {
    const c = client({ data: { id: "db-id" }, error: null });
    await expect(findLeadBySubmission(c, null)).resolves.toBeNull();
    expect(c.eq).not.toHaveBeenCalled();
  });
});
