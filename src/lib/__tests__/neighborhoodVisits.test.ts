import { describe, expect, it } from "vitest";
import { interestNeighborhood, summarizeNeighborhoodVisits, neighborhoodVisitorArrivals, neighborhoodVisitTime, type NeighborhoodEvent } from "@/lib/neighborhoodVisits";
const event = (path: string, session: string, visitor: string, bairro?: string, event_type = "pageview"): NeighborhoodEvent => ({
  path, session_id: session, visitor_id: visitor, event_type, value: bairro ? { bairro_interesse: bairro } : null,
});
describe("Visitas por bairro de interesse", () => {
  it("mostra bairro informado, origem e horário da primeira chegada da mesma sessão", () => {
    const rows = neighborhoodVisitorArrivals([
      { ...event("/orcamento", "s1", "v1"), created_at: "2026-10-17T04:30:00Z", utm_source: "google", utm_medium: "cpc" },
      { ...event("/orcamento", "s1", "v1", "Pinheiros", "click_cta"), created_at: "2026-10-17T04:35:00Z" },
      { ...event("/orcamento", "s1", "v1"), created_at: "2026-10-17T04:40:00Z", utm_source: "instagram" },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ bairros: ["Pinheiros"], canal: "google_ads", source: "google", createdAt: "2026-10-17T04:30:00Z" });
  });
  it("não cruza bairros entre sessões, páginas ou visitantes", () => {
    const rows = neighborhoodVisitorArrivals([
      event("/orcamento", "s1", "v1"), event("/orcamento", "s2", "v1", "Mooca", "click_cta"),
      event("/coletas-por-bairro", "s1", "v1", "Pinheiros", "click_cta"), event("/orcamento", "s1", "v2", "Brooklin", "click_cta"),
    ]);
    expect(rows[0].bairros).toEqual([]);
  });
  it("mantém origem ausente não informada e expõe só o domínio da referência", () => {
    const rows = neighborhoodVisitorArrivals([
      event("/orcamento", "s1", "v1"),
      { ...event("/orcamento", "s2", "v2"), referrer: "https://www.google.com/search?q=privado" },
    ]);
    expect(rows[0].reference).toBe("www.google.com");
    expect(rows[0].canal).toBe("organico");
    expect(rows[1].canal).toBeNull();
    expect(rows[1].visitor).toBe("Visitante 1");
  });
  it("converte o horário real para São Paulo sem inventar datas ausentes", () => {
    expect(neighborhoodVisitTime("2026-10-17T04:30:00Z")).toBe("17/10/2026, 01:30:00");
    expect(neighborhoodVisitTime(null)).toBe("Data não informada");
    expect(neighborhoodVisitTime("inválido")).toBe("Data não informada");
  });
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