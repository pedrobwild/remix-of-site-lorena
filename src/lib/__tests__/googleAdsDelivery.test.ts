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
  // Pedro, 29/10/2026 19h30 (offline) e 25/11/2026 (envio direto): vale o aceite do formulário.
  it("aceite do formulário autoriza mesmo sem resposta ao aviso de cookies", () => {
    const semAviso = { ...lead, consent_record_id: null, consent_visitor_key: null };
    expect(buildDeliveryEvent(event, semAviso, [], now)).toMatchObject({ destination: "7805140492", event: { transactionId: "same-as-browser", adIdentifiers: { gclid: "click" }, conversionValue: 5000 } });
    expect(buildDeliveryEvent(event, lead, [], now)).toMatchObject({ destination: "7805140492" });
  });
  it("formulário sem aceite de marketing bloqueia, com ou sem aceite no aviso", () => {
    expect(buildDeliveryEvent(event, { ...lead, consent_marketing: false }, records, now)).toEqual({ blocked: "sem_aceite_no_formulario" });
    expect(buildDeliveryEvent(event, { ...lead, consent_marketing: null }, records, now)).toEqual({ blocked: "sem_aceite_no_formulario" });
  });
  it("retirada posterior no aviso de cookies do mesmo aparelho bloqueia", () => {
    const recusa = { ...records[0], id: "r2", advertising: false, created_at: "2026-10-29T11:00:00Z" };
    expect(buildDeliveryEvent(event, lead, [...records, recusa], now)).toEqual({ blocked: "aceite_retirado_no_aviso" });
    expect(buildDeliveryEvent(event, lead, [recusa, records[0]], now)).toEqual({ blocked: "aceite_retirado_no_aviso" });
    // Recusa de outro aparelho não vale para este pedido.
    expect(buildDeliveryEvent(event, lead, [...records, { ...recusa, visitor_key: "outro" }], now)).toMatchObject({ destination: "7805140492" });
    // Recusa seguida de novo aceite: vale a escolha mais recente.
    expect(buildDeliveryEvent(event, lead, [...records, recusa, { ...records[0], id: "r3", created_at: "2026-10-29T11:30:00Z" }], now)).toMatchObject({ destination: "7805140492" });
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