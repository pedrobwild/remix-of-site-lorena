import { describe, expect, it, vi } from "vitest";
import { readCrmDiscardReasons } from "../crmDiscardReasons.server";

const id = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
const response = (leads: unknown[]) => new Response(JSON.stringify({ leads, stages: [] }));

describe("consulta automática de motivos reais", () => {
  it("consulta a projeção existente com IDs e credencial somente no cabeçalho", async () => {
    const fetcher = vi.fn().mockResolvedValue(response([{ lead_id: id, reason_category: "Fora da área atendida", reason_detail: "Imóvel em outro estado" }]));
    expect(await readCrmDiscardReasons("credencial-ficticia", [id], fetcher)).toEqual({ [id]: "Fora da área atendida — Imóvel em outro estado" });
    expect(fetcher.mock.calls[0]?.[0]).toMatch(/\/site-lead-stages$/);
    expect(JSON.parse(fetcher.mock.calls[0]?.[1].body)).toEqual({ lead_ids: [id] });
    expect(fetcher.mock.calls[0]?.[1].headers["x-integration-key"]).toBe("credencial-ficticia");
  });
  it("sem motivo explícito não infere razão do perfil ou status", async () => {
    const fetcher = vi.fn().mockResolvedValue(response([{ lead_id: id, all_closed_lost: true, location: "Outro estado", reason_category: null, reason_detail: " " }]));
    expect(await readCrmDiscardReasons("teste", [id], fetcher)).toEqual({});
  });
  it("não retorna registro de outro lead nem campos privados", async () => {
    const fetcher = vi.fn().mockResolvedValue(response([{ lead_id: other, reason_detail: "Outro cliente" }, { lead_id: id, reason_detail: "Sem interesse", internal_note: "privado" }]));
    expect(await readCrmDiscardReasons("teste", [id], fetcher)).toEqual({ [id]: "Sem interesse" });
  });
  it("não enumera clientes sem IDs", async () => {
    const fetcher = vi.fn();
    expect(await readCrmDiscardReasons("teste", [], fetcher)).toEqual({});
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("falha de consulta não equivale a ausência de motivo", async () => {
    await expect(readCrmDiscardReasons("teste", [id], vi.fn().mockResolvedValue(new Response(null, { status: 403 })))).rejects.toThrow("engine_http_403");
  });
});