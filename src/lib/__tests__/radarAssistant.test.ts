import { describe, expect, it, vi } from "vitest";
import { answerFromRadar, formatRadarCollections, isCollectionQuestion, isMarketQuestion, radarLabels, radarObservationSchema, resolveRadarBairros, type RadarRow } from "@/lib/assistant/radarData";
import { readRadar, readRadarCollections } from "@/lib/assistant/radarContexto.server";

// Fixtures de conferência fornecidas por Pedro, nunca usadas pela aplicação.
const row = (changes: Partial<RadarRow> = {}): RadarRow => ({
  bairro: "Pinheiros", cidade: "São Paulo", indicador: "adr_medio_brl", valor: 300,
  amostra_n: 2424, periodo_inicio: "2026-01-01", periodo_fim: "2026-09-30", fonte_nome: "GuestFavorites",
  fonte_tipo: "publica", url_origem: null, coletado_em: "2026-10-13", confianca: "alta", idade_dias: 4, ...changes,
});
describe("assistente Radar", () => {
  it("coletas usam somente a projeção pública, filtros exatos, ordem e limite solicitados", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response("[]"));
    expect(await readRadarCollections("Pinheiros", fetcher)).toEqual([]);
    const url = new URL(fetcher.mock.calls[0][0]);
    expect(url.pathname).toBe("/rest/v1/radar_observacoes");
    expect(Object.fromEntries(url.searchParams)).toEqual({ select: "coletado_em,periodo_inicio,periodo_fim,radar_fontes(nome),amostra_n,ativo", cidade: "eq.São Paulo", bairro: "eq.Pinheiros", indicador: "eq.adr_medio_brl", order: "coletado_em.desc", limit: "20" });
  });
  it("ativo true é ativa e false é substituída; metadados privados são descartados", () => {
    const observation = radarObservationSchema.parse({ ...row(), ativo: true, autor: "privado", registrado_em: "privado", utm_source: "privado" });
    expect(observation).not.toHaveProperty("autor");
    expect(observation).not.toHaveProperty("registrado_em");
    expect(observation).not.toHaveProperty("utm_source");
    const text = formatRadarCollections("Pinheiros", [observation, { ...observation, ativo: false }]);
    expect(text).toContain("13/10/2026");
    expect(text).toContain("n=2.424");
    expect(text).toContain("Status: ativa");
    expect(text).toContain("Status: substituída");
    expect(text).not.toContain("privado");
  });
  it("histórico limita a 20 observações mesmo com resposta maior", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify(Array.from({ length: 21 }, () => ({ ...row(), radar_fontes: { nome: "GuestFavorites" }, ativo: true })))));
    expect(await readRadarCollections("Mooca", fetcher)).toHaveLength(20);
  });
  it("falhas e dados inválidos deixam o histórico indisponível, vazio não é falha", async () => {
    expect(await readRadarCollections("Mooca", vi.fn().mockRejectedValue(new Error("falha")))).toBeNull();
    expect(await readRadarCollections("Mooca", vi.fn().mockResolvedValue(new Response("erro", { status: 403 })))).toBeNull();
    expect(await readRadarCollections("Mooca", vi.fn().mockResolvedValue(new Response('[{"ativo":true}]')))).toBeNull();
  });
  it("perguntas de coletas vão ao Radar e resolvem bairro explícito ou anterior", () => {
    expect(isCollectionQuestion("Quais as coletas de Pinheiros?")).toBe(true);
    expect(isMarketQuestion("Histórico de coletas da Mooca")).toBe(true);
    expect(resolveRadarBairros("Quais as coletas?", ["Mooca"], ["Mooca"], true)).toEqual(["Mooca"]);
    expect(resolveRadarBairros("Coletas em Pinheiros", ["Mooca", "Pinheiros"], ["Mooca"], true)).toEqual(["Pinheiros"]);
    expect(resolveRadarBairros("Coletas em bairro inexistente", ["Mooca"], ["Mooca"], true)).toEqual([]);
  });
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