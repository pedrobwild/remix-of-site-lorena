import { describe, expect, it, vi } from "vitest";
import { readCrmProfiles } from "@/lib/crmProfiles.server";

const id = "11111111-1111-4111-8111-111111111111";
const summary = { total_conversations: 2, profiles: [{ profile_key: "escalador", profile_name: "Escalador", count: 2, percentage: 100 }] };
const response = (leads: unknown[] = []) => new Response(JSON.stringify({ summary, leads }));
describe("perfis qualitativos do CRM", () => {
  it("consulta resumo sem enumerar leads e mantém unidade de conversas", async () => {
    const fetcher = vi.fn().mockResolvedValue(response());
    expect((await readCrmProfiles("test-key", [], fetcher)).summary).toEqual(summary);
    expect(fetcher.mock.calls[0][1].body).toBe("{}");
    expect(fetcher.mock.calls[0][1].headers["x-integration-key"]).toBe("test-key");
  });
  it("limita o perfil ao lead solicitado e remove mensagens e justificativas", async () => {
    const fetcher = vi.fn().mockResolvedValue(response([{ lead_id: id, profile_key: "sem", profile_name: "Não classificado", analyzed_at: null, messages: "privado", reason: "privado" }]));
    const result = await readCrmProfiles("test-key", [id], fetcher);
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({ lead_ids: [id] });
    expect(result.leads).toEqual([{ lead_id: id, profile_key: "sem", profile_name: "Não classificado", analyzed_at: null }]);
  });
  it("recusa perfil de outro lead", async () => {
    const fetcher = vi.fn().mockResolvedValue(response([{ lead_id: id, profile_key: "sem", profile_name: "Não classificado", analyzed_at: null }]));
    await expect(readCrmProfiles("test-key", [], fetcher)).rejects.toThrow("engine_profiles_invalid_lead");
  });
  it("não inventa dados quando a origem falha", async () => {
    await expect(readCrmProfiles("test-key", [], vi.fn().mockResolvedValue(new Response("", { status: 503 })))).rejects.toThrow("engine_profiles_http_503");
  });
});