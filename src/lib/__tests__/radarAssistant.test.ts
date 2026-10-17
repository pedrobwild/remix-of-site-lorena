import { describe, expect, it, vi } from "vitest";
import { answerFromRadar, isMarketQuestion, radarLabels, type RadarRow } from "@/lib/assistant/radarData";
import { readRadar } from "@/lib/assistant/radarContexto.server";

// Fixtures de conferência fornecidas por Pedro, nunca usadas pela aplicação.
const row = (changes: Partial<RadarRow> = {}): RadarRow => ({
  bairro: "Pinheiros", cidade: "São Paulo", indicador: "adr_medio_brl", valor: 300,
  amostra_n: 2424, periodo_inicio: "2026-01-01", periodo_fim: "2026-09-30", fonte_nome: "GuestFavorites",
  fonte_tipo: "publica", url_origem: null, coletado_em: "2026-10-13", confianca: "alta", idade_dias: 4, ...changes,
});
describe("assistente Radar", () => {
  it("Pinheiros usa os valores da view e metadados fornecidos", () => {
    const answer = answerFromRadar("Diária e ocupação em Pinheiros?", [row(), row({ indicador: "ocupacao_media_pct", valor: 62 })]);
    expect(answer.text).toContain("R$ 300");
    expect(answer.text).toContain("62%");
    expect(answer.text).toContain("GuestFavorites · jan–set/2026 · coleta 13/10/2026 · n=2.424 · confiança alta");
  });
  it("Mooca pública com n=85 não é estimativa", () => {
    const labels = radarLabels(row({ bairro: "Mooca", valor: 241, amostra_n: 85, confianca: "baixa" }));
    expect(labels).toEqual(["amostra pequena · 85 anúncios"]);
  });
  it("Brooklin recebe estimativa somente pela fonte", () => {
    expect(radarLabels(row({ bairro: "Brooklin", valor: 360, fonte_tipo: "estimativa", amostra_n: null, confianca: "baixa" }))).toEqual(["estimativa"]);
  });
  it("desatualizado apenas acima de 240 dias", () => {
    expect(radarLabels(row({ idade_dias: 240 }))).toEqual([]);
    expect(radarLabels(row({ idade_dias: 241 }))).toEqual(["dado desatualizado · coleta 13/10/2026"]);
  });
  it("confiança permanece a da linha, sem recalcular por amostra", () => {
    expect(answerFromRadar("Pinheiros", [row({ amostra_n: 1 })]).text).toContain("confiança alta");
  });
  it("bairro inexistente não usa números de outro bairro", () => {
    const answer = answerFromRadar("Moema", [row()]);
    expect(answer.bairros).toEqual([]);
    expect(answer.text).not.toContain("300");
  });
  it("follow-up de bairro mantém o assunto mercado", () => {
    expect(isMarketQuestion("E na Mooca?", true)).toBe(true);
    expect(isMarketQuestion("Qual o prazo da reforma?", false)).toBe(false);
    expect(isMarketQuestion("E o prazo da reforma?", false)).toBe(false);
  });
  it("falha de rede não retorna valores em memória", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("URL inválida"));
    expect(await readRadar(fetcher)).toBeNull();
  });
  it("cada pergunta faz leitura nova; falha após sucesso não usa cache", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify([row()]))).mockResolvedValueOnce(new Response("indisponível", { status: 503 }));
    expect(await readRadar(fetcher)).toHaveLength(1);
    expect(await readRadar(fetcher)).toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});