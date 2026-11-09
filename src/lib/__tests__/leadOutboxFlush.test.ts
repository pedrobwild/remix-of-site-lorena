/**
 * Gatilhos do reenvio da caixa de saída (instalados pelo Root depois da
 * hidratação): uma vez na instalação, no `online`, a cada ~3 min com
 * pendência e aba visível. Entrega pela fila só gera o evento GA4
 * `lead_outbox_delivered` — nada de Pixel/Google Ads (sem conversão dupla).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { LeadOutboxBody } from "../leadOutbox";

const sendLeadBodyMock = vi.fn<(body: Record<string, unknown>, opts?: { timeoutMs?: number }) => Promise<{ delivered: boolean; timedOut: boolean }>>();
const trackEventMock = vi.fn();
const reportLeadMock = vi.fn();

vi.mock("@/lib/sendLead", () => ({
  sendLeadBody: (body: Record<string, unknown>, opts?: { timeoutMs?: number }) => sendLeadBodyMock(body, opts),
}));
vi.mock("@/lib/ga4", () => ({
  trackEvent: (name: string, params?: Record<string, unknown>) => trackEventMock(name, params),
}));
vi.mock("@/lib/conversions", () => ({
  reportLead: (...a: unknown[]) => reportLeadMock(...a),
}));

import { __resetLeadOutboxLock, enqueueLead, LEAD_OUTBOX_RETRY_MS, listLeadOutbox } from "../leadOutbox";
import { flushLeadOutboxNow, installLeadOutboxFlush, LEAD_OUTBOX_INTERVAL_MS, withCurrentConsent } from "../leadOutboxFlush";

const BODY: LeadOutboxBody = {
  submission_id: "00000000-0000-4000-8000-000000000001",
  name: "Ana",
  whatsapp: "11912345678",
  email: null,
  form_path: "/orcamento",
  event_id: "evt-12345678",
};

/** Deixa as promessas encadeadas (import dinâmico, envio, gravação) terminarem. */
async function settle() {
  for (let i = 0; i < 10; i++) await vi.advanceTimersByTimeAsync(0);
}

let off: (() => void) | null = null;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-08T12:00:00Z"));
  window.localStorage.clear();
  __resetLeadOutboxLock();
  sendLeadBodyMock.mockReset();
  trackEventMock.mockReset();
  reportLeadMock.mockReset();
  Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
});

afterEach(() => {
  off?.();
  off = null;
  vi.useRealTimers();
});

describe("installLeadOutboxFlush", () => {
  it("fila vazia: não importa o envio nem manda nada", async () => {
    off = installLeadOutboxFlush();
    await settle();
    await vi.advanceTimersByTimeAsync(LEAD_OUTBOX_INTERVAL_MS * 2);
    expect(sendLeadBodyMock).not.toHaveBeenCalled();
  });

  it("reenvia na instalação; entregue sai da fila e só gera lead_outbox_delivered", async () => {
    enqueueLead(BODY, Date.now() - LEAD_OUTBOX_RETRY_MS);
    sendLeadBodyMock.mockResolvedValue({ delivered: true, timedOut: false });
    off = installLeadOutboxFlush();
    await settle();
    expect(sendLeadBodyMock).toHaveBeenCalledTimes(1);
    expect(sendLeadBodyMock.mock.calls[0][0]).toEqual(BODY);
    expect(listLeadOutbox()).toEqual([]);
    expect(trackEventMock).toHaveBeenCalledTimes(1);
    expect(trackEventMock).toHaveBeenCalledWith("lead_outbox_delivered", {
      form_path: "/orcamento",
      attempts: 2,
      minutes_queued: 2,
    });
    expect(trackEventMock).not.toHaveBeenCalledWith("generate_lead", expect.anything());
    expect(reportLeadMock).not.toHaveBeenCalled();
  });

  it("evento online reenvia sem esperar o intervalo da entrada", async () => {
    sendLeadBodyMock.mockResolvedValue({ delivered: false, timedOut: true });
    off = installLeadOutboxFlush();
    await settle();
    enqueueLead(BODY); // acabou de falhar: a próxima tentativa normal seria em 2 min
    window.dispatchEvent(new Event("online"));
    await settle();
    expect(sendLeadBodyMock).toHaveBeenCalledTimes(1);
    expect(listLeadOutbox()).toHaveLength(1);
  });

  it("com pendência, tenta a cada ~3 min só com a aba visível; para quando esvazia", async () => {
    off = installLeadOutboxFlush();
    await settle();
    sendLeadBodyMock.mockResolvedValue({ delivered: false, timedOut: false });
    enqueueLead(BODY);

    Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
    await vi.advanceTimersByTimeAsync(LEAD_OUTBOX_INTERVAL_MS);
    await settle();
    expect(sendLeadBodyMock).not.toHaveBeenCalled();

    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
    await vi.advanceTimersByTimeAsync(LEAD_OUTBOX_INTERVAL_MS);
    await settle();
    expect(sendLeadBodyMock).toHaveBeenCalledTimes(1);

    sendLeadBodyMock.mockResolvedValue({ delivered: true, timedOut: false });
    await vi.advanceTimersByTimeAsync(LEAD_OUTBOX_INTERVAL_MS * 2);
    await settle();
    expect(sendLeadBodyMock).toHaveBeenCalledTimes(2);
    expect(listLeadOutbox()).toEqual([]);

    await vi.advanceTimersByTimeAsync(LEAD_OUTBOX_INTERVAL_MS * 5);
    await settle();
    expect(sendLeadBodyMock).toHaveBeenCalledTimes(2);
  });

  it("falha ao carregar o envio não lança", async () => {
    enqueueLead(BODY, Date.now() - LEAD_OUTBOX_RETRY_MS);
    sendLeadBodyMock.mockImplementation(() => {
      throw new Error("chunk");
    });
    await expect(flushLeadOutboxNow()).resolves.toBeUndefined();
    expect(listLeadOutbox()).toHaveLength(1);
  });

  it("desinstalar remove os gatilhos", async () => {
    off = installLeadOutboxFlush();
    await settle();
    off();
    off = null;
    enqueueLead(BODY);
    window.dispatchEvent(new Event("online"));
    await vi.advanceTimersByTimeAsync(LEAD_OUTBOX_INTERVAL_MS * 2);
    await settle();
    expect(sendLeadBodyMock).not.toHaveBeenCalled();
  });
});

describe("withCurrentConsent", () => {
  const COM_ACEITE: LeadOutboxBody = {
    ...BODY,
    consent_marketing: true,
    fbp: "fb.1.1700000000000.123",
    fbc: "fb.1.1700000000000.abc",
    consent_record_id: "rec-1",
    consent_visitor_key: "vis-1",
  };

  it("aceite retirado depois de entrar na fila: reenvio sai sem ids do Meta e sem prova do aceite", () => {
    expect(withCurrentConsent(COM_ACEITE, false)).toEqual({
      ...COM_ACEITE,
      consent_marketing: false,
      fbp: null,
      fbc: null,
      consent_record_id: null,
      consent_visitor_key: null,
    });
  });

  it("aceite mantido: corpo igual; sem aceite no envio, nada é acrescentado depois", () => {
    expect(withCurrentConsent(COM_ACEITE, true)).toBe(COM_ACEITE);
    const semAceite = { ...BODY, consent_marketing: false, fbp: null, fbc: null };
    expect(withCurrentConsent(semAceite, true)).toBe(semAceite);
    expect(withCurrentConsent(semAceite, false)).toBe(semAceite);
  });

  it("o reenvio da fila aplica o aceite atual (sem cookie de aceite → sem fbp)", async () => {
    enqueueLead(COM_ACEITE, Date.now() - LEAD_OUTBOX_RETRY_MS);
    sendLeadBodyMock.mockResolvedValue({ delivered: true, timedOut: false });
    await flushLeadOutboxNow({ ignoreBackoff: true });
    expect(sendLeadBodyMock).toHaveBeenCalledTimes(1);
    const sent = sendLeadBodyMock.mock.calls[0][0];
    expect(sent.consent_marketing).toBe(false);
    expect(sent.fbp).toBeNull();
    expect(sent.submission_id).toBe(BODY.submission_id);
  });
});
