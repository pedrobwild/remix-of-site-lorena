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

import { fitLeadPayload, isServerAcceptedEmail, LEAD_FIELD_LIMITS, type LeadPayload } from "../leadDelivery";

const base: LeadPayload = {
  name: "Ana",
  whatsapp: "11912345678",
  email: "ana@exemplo.com",
  location: "Pinheiros",
  area_m2: 32,
  objetivo: "Short stay",
  chaves: null,
  planta: null,
  message: "Oi",
  utm_source: null,
  utm_medium: null,
  utm_campaign: null,
  referrer: null,
  landing_path: "/",
  user_agent: "UA",
  form_path: "/diagnostico",
};

describe("fitLeadPayload — nunca deixa o schema do servidor recusar o lead", () => {
  it("corta textos longos no limite do servidor", () => {
    const out = fitLeadPayload({ ...base, message: "x".repeat(5000), name: "n".repeat(300) });
    expect(out.message).toHaveLength(LEAD_FIELD_LIMITS.message);
    expect(out.name).toHaveLength(LEAD_FIELD_LIMITS.name);
  });

  it("e-mail que o zod recusaria vai para a mensagem em vez de derrubar o envio", () => {
    const out = fitLeadPayload({ ...base, email: "joão@exemplo.com" });
    expect(out.email).toBeNull();
    expect(out.message).toContain("E-mail informado: joão@exemplo.com");
  });

  it("arredonda metragem decimal (coluna INTEGER) e descarta valores inválidos", () => {
    expect(fitLeadPayload({ ...base, area_m2: 32.5 }).area_m2).toBe(33);
    expect(fitLeadPayload({ ...base, area_m2: Number.NaN }).area_m2).toBeNull();
    expect(fitLeadPayload({ ...base, area_m2: -1 }).area_m2).toBeNull();
  });

  it("strings vazias viram null", () => {
    const out = fitLeadPayload({ ...base, location: "   ", email: "" });
    expect(out.location).toBeNull();
    expect(out.email).toBeNull();
  });

  it("isServerAcceptedEmail segue a regra do zod", () => {
    expect(isServerAcceptedEmail("a.b+c@dominio.com.br")).toBe(true);
    expect(isServerAcceptedEmail("a..b@dominio.com")).toBe(false);
    expect(isServerAcceptedEmail("sem-arroba")).toBe(false);
  });
});
