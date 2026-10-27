import { describe, expect, it, vi } from "vitest";
import { latestRadarCollections } from "@/lib/assistant/radarData";
import { readRadarCollectionSummary } from "@/lib/assistant/radarContexto.server";

const row = { bairro: "Brooklin", coletado_em: "2026-10-20", periodo_inicio: null, periodo_fim: null, fonte_nome: "Radar", amostra_n: 123, ativo: true };
describe("resumo público de coletas", () => {
  it("mantém apenas a última coleta de cada bairro e o status real", () => {
    expect(latestRadarCollections([row, { ...row, coletado_em: "2026-10-27", ativo: false, amostra_n: null }, { ...row, bairro: "Pinheiros" }])).toEqual([
      { bairro: "Brooklin", coletado_em: "2026-10-27", ativo: false, amostra_n: null, fonte_nome: "Radar" },
      { bairro: "Pinheiros", coletado_em: "2026-10-20", ativo: true, amostra_n: 123, fonte_nome: "Radar" },
    ]);
  });
  it("pagina além de mil observações e não devolve campos privados", async () => {
    const wire = { ...row, radar_fontes: { nome: "Radar" }, autor: "privado", utm_source: "privado" };
    const fetcher = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(Array.from({ length: 1000 }, () => wire))))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ ...wire, bairro: "Pinheiros" }])));
    const result = await readRadarCollectionSummary(fetcher);
    expect(result).toHaveLength(2);
    expect(new URL(fetcher.mock.calls[1][0]).searchParams.get("offset")).toBe("1000");
    expect(JSON.stringify(result)).not.toContain("privado");
  });
  it("falha sem inventar dados", async () => {
    expect(await readRadarCollectionSummary(vi.fn().mockRejectedValue(new Error("offline")))).toBeNull();
  });
});