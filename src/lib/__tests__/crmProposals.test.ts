import { describe, expect, it, vi } from "vitest";
import { readCrmProposals } from "@/lib/crmProposals.server";
import { fetchEngineStages } from "@/lib/crmStageSync.server";
const id = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
const proposal = { public_id: "proposta-1", url: "https://bwildengine.com/o/proposta-1", total: 63500.25, generated_at: "2026-10-17T13:00:00Z", prazo_dias_uteis: 45, version_number: 2 };
const response = (leads: unknown) => new Response(JSON.stringify({ leads }));
describe("consulta de propostas publicadas do CRM", () => {
  it("envia os IDs por POST no endpoint correto e preserva total da origem", async () => {
    const fetcher = vi.fn().mockResolvedValue(response([{ lead_id: id, budgets: [proposal] }]));
    expect(await readCrmProposals("credencial-ficticia", [id], fetcher)).toEqual({ [id]: [proposal] });
    expect(fetcher.mock.calls[0]?.[0]).toMatch(/\/site-lead-budgets$/);
    const options = fetcher.mock.calls[0]?.[1];
    expect(options.method).toBe("POST");
    expect(options.headers["x-integration-key"]).toBe("credencial-ficticia");
    expect(JSON.parse(options.body)).toEqual({ lead_ids: [id] });
  });
  it("não enumera clientes quando nenhum ID é fornecido", async () => {
    const fetcher = vi.fn();
    expect(await readCrmProposals("credencial-ficticia", [], fetcher)).toEqual({});
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("aceita pedidos sem proposta e não inventa valores", async () => {
    expect(await readCrmProposals("credencial-ficticia", [id], vi.fn().mockResolvedValue(response([])))).toEqual({});
    expect(await readCrmProposals("credencial-ficticia", [id], vi.fn().mockResolvedValue(response([{ lead_id: id, budgets: [{ ...proposal, total: null }] }])))).toEqual({ [id]: [{ ...proposal, total: null }] });
  });
  it("recusa resposta vinculada a outro lead", async () => {
    await expect(readCrmProposals("credencial-ficticia", [id], vi.fn().mockResolvedValue(response([{ lead_id: other, budgets: [proposal] }])))).rejects.toThrow("engine_budgets_invalid_lead");
  });
  it("remove metadados internos da resposta", async () => {
    expect(await readCrmProposals("credencial-ficticia", [id], vi.fn().mockResolvedValue(response([{ lead_id: id, budgets: [{ ...proposal, unit_cost: 100, bdi: 20 }] }])))).toEqual({ [id]: [proposal] });
  });
  it.each(["javascript:alert(1)", "http://bwildengine.com/o/1", "https://user:password@bwildengine.com/o/1"])("recusa link inseguro %s", async (url) => {
    await expect(readCrmProposals("credencial-ficticia", [id], vi.fn().mockResolvedValue(response([{ lead_id: id, budgets: [{ ...proposal, url }] }])))).rejects.toThrow();
  });
  it("não transforma erro da origem em lista vazia", async () => {
    await expect(readCrmProposals("credencial-ficticia", [id], vi.fn().mockResolvedValue(new Response(null, { status: 401 })))).rejects.toThrow("engine_budgets_http_401");
  });
  it("recusa mais de 500 IDs antes de consultar a origem", async () => {
    const fetcher = vi.fn();
    await expect(readCrmProposals("credencial-ficticia", Array(501).fill(id), fetcher)).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("consulta etapas com os mesmos IDs e cabeçalho privado", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ leads: [], stages: [] })));
    await fetchEngineStages("credencial-ficticia", { lead_ids: [id] }, fetcher);
    expect(fetcher.mock.calls[0]?.[0]).toMatch(/\/site-lead-stages$/);
    expect(JSON.parse(fetcher.mock.calls[0]?.[1].body)).toEqual({ lead_ids: [id] });
    expect(fetcher.mock.calls[0]?.[1].headers["x-integration-key"]).toBe("credencial-ficticia");
  });
});