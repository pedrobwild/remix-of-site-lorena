import { describe, expect, it } from "vitest";
import { interestNeighborhood, summarizeNeighborhoodVisits, type NeighborhoodEvent } from "@/lib/neighborhoodVisits";
const event = (path: string, session: string, visitor: string, bairro?: string, event_type = "pageview"): NeighborhoodEvent => ({
  path, session_id: session, visitor_id: visitor, event_type, value: bairro ? { bairro_interesse: bairro } : null,
});
describe("Visitas por bairro de interesse", () => {
  it("mantém visitas antigas sem bairro, sem deduzir a localização", () => {
    const [report] = summarizeNeighborhoodVisits([event("/coletas-por-bairro", "s1", "v1")]);
    expect(report).toMatchObject({ visitors: 1, unknown: 1, bairros: [] });
  });
  it("conta um visitante uma vez por bairro, mesmo em várias visitas", () => {
    const [report] = summarizeNeighborhoodVisits([
      event("/coletas-por-bairro", "s1", "v1", "Pinheiros"), event("/coletas-por-bairro", "s1", "v1", "pinheiros"),
      event("/coletas-por-bairro", "s1", "v1", "Mooca"),
    ]);
    expect(report.visitors).toBe(1);
    expect(report.bairros.map((b) => b.visitors)).toEqual([1, 1]);
  });
  it("associa o bairro informado apenas à mesma sessão e página do orçamento", () => {
    const reports = summarizeNeighborhoodVisits([
      event("/orcamento", "s1", "v1"), event("/orcamento", "s1", "v1", "Mooca", "click_cta"),
      event("/orcamento", "s2", "v2"), event("/coletas-por-bairro", "s1", "v1"),
    ]);
    expect(reports[1]).toMatchObject({ visitors: 2, unknown: 1, bairros: [{ bairro: "Mooca", visitors: 1 }] });
    expect(reports[0].bairros).toEqual([]);
  });
  it("não cria visitantes para eventos sem identificador", () => {
    const [report] = summarizeNeighborhoodVisits([{ ...event("/coletas-por-bairro", "s", "v", "Mooca"), visitor_id: null }]);
    expect(report.visitors).toBe(0);
  });
  it("mostra seleção das coletas mesmo sem uma nova pageview na troca de bairro", () => {
    const [report] = summarizeNeighborhoodVisits([
      event("/coletas-por-bairro", "s1", "v1"),
      event("/coletas-por-bairro", "s1", "v1", "Pinheiros", "click_cta"),
      event("/coletas-por-bairro", "s1", "v1", "pinheiros", "click_cta"),
    ]);
    expect(report).toMatchObject({ visitors: 1, pageviews: 1, unknown: 0, bairros: [{ bairro: "pinheiros", visitors: 1 }] });
  });
  it("rejeita dados livres que não são nomes de bairros", () => {
    expect(interestNeighborhood("nome@example.com")).toBeNull();
    expect(interestNeighborhood("11999999999")).toBeNull();
    expect(interestNeighborhood("Brooklin Paulista")).toBe("Brooklin");
  });
});