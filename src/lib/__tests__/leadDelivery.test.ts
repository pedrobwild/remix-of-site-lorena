import { describe, it, expect } from "vitest";
import { isLeadDelivered } from "../leadDelivery";

describe("isLeadDelivered — só conta entrega confirmada por um destino real", () => {
  it("true quando o insert no banco foi 'sent'", () => {
    expect(
      isLeadDelivered({ data: { ok: true, lead_insert: { status: "sent", id: "x" }, slack: "skipped", crm: "skipped" } }),
    ).toBe(true);
  });

  it("true quando só o Slack ou só o CRM confirmou", () => {
    expect(isLeadDelivered({ data: { ok: true, lead_insert: { status: "error" }, slack: "sent", crm: "error" } })).toBe(true);
    expect(isLeadDelivered({ data: { ok: true, lead_insert: { status: "error" }, slack: "error", crm: "sent" } })).toBe(true);
  });

  it("false quando a função respondeu ok:true mas nenhum destino recebeu", () => {
    expect(
      isLeadDelivered({ data: { ok: true, lead_insert: { status: "error", error: "x" }, slack: "skipped", crm: "skipped" } }),
    ).toBe(false);
  });

  it("false em erro de rede/invoke, resposta vazia ou timeout (null)", () => {
    expect(isLeadDelivered({ data: null, error: new Error("FunctionsFetchError") })).toBe(false);
    expect(isLeadDelivered({ data: null })).toBe(false);
    expect(isLeadDelivered(null)).toBe(false);
    expect(isLeadDelivered(undefined)).toBe(false);
  });
});
