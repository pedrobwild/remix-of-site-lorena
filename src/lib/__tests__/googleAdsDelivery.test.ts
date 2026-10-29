import { describe, expect, it } from "vitest";
import { buildDeliveryEvent, deliveryRetryAt, type DeliveryEvent } from "@/lib/googleAdsDelivery";
const now = Date.parse("2026-10-29T12:00:00Z");
const event: DeliveryEvent = { id: "1", lead_id: "1", kind: "request", event_at: "2026-10-28T12:00:00Z", transaction_id: "same-as-browser", attempts: 1 };
const lead = { id: "1", created_at: event.event_at, status: "qualificado", objetivo: "Short stay", form_path: "/orcamento", gclid: "click", consent_marketing: true, consent_record_id: "r", consent_visitor_key: "v" };
const records = [{ id: "r", visitor_key: "v", advertising: true, notice_version: "v2", created_at: "2026-10-28T11:00:00Z" }];
describe("envio direto Google Ads", () => {
  it("pedido e qualificação usam ações diferentes e mantêm valor e id originais", () => {
    const request = buildDeliveryEvent(event, lead, records, now);
    const quality = buildDeliveryEvent({ ...event, kind: "qualified", transaction_id: "quality" }, lead, records, now);
    expect(request).toMatchObject({ destination: "7805140492", event: { transactionId: "same-as-browser", conversionValue: 5000 } });
    expect(quality).toMatchObject({ destination: "7851121159", event: { conversionValue: 10000, eventTimestamp: "2026-10-28T12:00:00.000Z" } });
  });
  it("recusa posterior, falta de registro e flag falso bloqueiam", () => {
    expect(buildDeliveryEvent(event, lead, [...records, { ...records[0], id: "r2", advertising: false, created_at: "2026-10-29T11:00:00Z" }], now)).toEqual({ blocked: "sem_autorizacao_atual" });
    expect(buildDeliveryEvent(event, lead, [], now)).toEqual({ blocked: "sem_autorizacao_atual" });
    expect(buildDeliveryEvent(event, { ...lead, consent_marketing: false }, records, now)).toEqual({ blocked: "sem_autorizacao_atual" });
  });
  it("não investidor e ausência de clique não enviam", () => {
    expect(buildDeliveryEvent(event, { ...lead, objetivo: "Moradia" }, records, now)).toEqual({ blocked: "objetivo_nao_investidor" });
    expect(buildDeliveryEvent(event, { ...lead, gclid: null }, records, now)).toEqual({ blocked: "sem_clique_google" });
  });
  it("reenvio conserva evento e respeita Retry-After", () => {
    expect(buildDeliveryEvent({ ...event, attempts: 3 }, lead, records, now)).toEqual(buildDeliveryEvent(event, lead, records, now));
    expect(deliveryRetryAt(now, 1, "600")).toBe("2026-10-29T12:10:00.000Z");
  });
});