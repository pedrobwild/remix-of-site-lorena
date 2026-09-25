import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { LeadPayload, LeadTracking } from "../leadDelivery";
import type { SendLeadResult } from "../sendLead";

type SendOpts = { timeoutMs?: number; tracking?: LeadTracking };
const sendLeadMock = vi.fn<(payload: LeadPayload, opts?: SendOpts) => Promise<SendLeadResult>>();
const trackEventMock = vi.fn();
const reportLeadMock = vi.fn();

vi.mock("@/lib/sendLead", () => ({
  sendLead: (payload: LeadPayload, opts?: SendOpts) => sendLeadMock(payload, opts),
}));
vi.mock("@/lib/ga4", () => ({
  trackEvent: (name: string, params?: Record<string, unknown>) => trackEventMock(name, params),
}));
vi.mock("@/lib/conversions", () => ({
  reportLead: (...a: unknown[]) => reportLeadMock(...a),
}));

import { useLeadSubmit } from "../useLeadSubmit";

const payload: LeadPayload = {
  name: "Ana",
  whatsapp: "11912345678",
  email: null,
  location: "Pinheiros",
  area_m2: 32.5,
  objetivo: "Short stay",
  chaves: null,
  planta: null,
  message: null,
  utm_source: null,
  utm_medium: null,
  utm_campaign: null,
  referrer: null,
  landing_path: "/",
  user_agent: null,
  form_path: "/diagnostico",
};

function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

beforeEach(() => {
  sendLeadMock.mockReset();
  trackEventMock.mockReset();
  reportLeadMock.mockReset();
  window.localStorage.clear();
  document.cookie = "_fbp=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  window.history.replaceState(null, "", "/orcamento");
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("useLeadSubmit", () => {
  it("trava envio duplo: o segundo submit no mesmo tick não envia nem abre popup", async () => {
    const d = deferred<SendLeadResult>();
    sendLeadMock.mockReturnValue(d.promise);
    const beforeSend = vi.fn();
    const { result } = renderHook(() => useLeadSubmit({ method: "diagnostico_form" }));

    let first!: Promise<unknown>;
    let second!: Promise<unknown>;
    act(() => {
      first = result.current.submit(payload, { beforeSend });
      second = result.current.submit(payload, { beforeSend });
    });
    expect(beforeSend).toHaveBeenCalledTimes(1);
    expect(sendLeadMock).toHaveBeenCalledTimes(1);
    expect(result.current.sending).toBe(true);
    await expect(second).resolves.toBeNull();

    await act(async () => {
      d.resolve({ delivered: true, timedOut: false });
      await first;
    });
    expect(result.current.sending).toBe(false);
    expect(result.current.outcome).toBe("delivered");
  });

  it("beforeSend roda de forma síncrona, antes do envio (gesto do usuário)", () => {
    const order: string[] = [];
    sendLeadMock.mockImplementation(() => {
      order.push("send");
      return new Promise(() => {});
    });
    const { result } = renderHook(() => useLeadSubmit({ method: "contato_form" }));
    act(() => {
      void result.current.submit(payload, { beforeSend: () => order.push("popup") });
    });
    expect(order).toEqual(["popup", "send"]);
  });

  it("generate_lead com delivery=confirmed quando entregue", async () => {
    sendLeadMock.mockResolvedValue({ delivered: true, timedOut: false });
    const { result } = renderHook(() => useLeadSubmit({ method: "orcamento_form" }));
    await act(async () => {
      await result.current.submit(payload, { params: { objetivo: "Moradia" } });
    });
    expect(trackEventMock).toHaveBeenCalledWith("generate_lead", {
      method: "orcamento_form",
      delivery: "confirmed",
      objetivo: "Moradia",
    });
  });

  it("falha sem WhatsApp não conta conversão; reenvio que dá certo conta uma vez", async () => {
    sendLeadMock.mockResolvedValueOnce({ delivered: false, timedOut: false });
    const { result } = renderHook(() => useLeadSubmit({ method: "parceiros_form" }));
    await act(async () => {
      await result.current.submit(payload);
    });
    expect(result.current.outcome).toBe("failed");
    expect(trackEventMock).toHaveBeenCalledWith("lead_delivery_failed", {
      method: "parceiros_form",
      delivery: "failed",
    });
    expect(trackEventMock).not.toHaveBeenCalledWith("generate_lead", expect.anything());

    sendLeadMock.mockResolvedValueOnce({ delivered: true, timedOut: false });
    await act(async () => {
      await result.current.submit(payload);
    });
    expect(result.current.outcome).toBe("delivered");
    expect(trackEventMock.mock.calls.filter(([n]) => n === "generate_lead")).toHaveLength(1);
  });

  it("falha com os dados já no WhatsApp conta como lead (uma vez só)", async () => {
    sendLeadMock.mockResolvedValue({ delivered: false, timedOut: false });
    const { result } = renderHook(() => useLeadSubmit({ method: "lp_panfleto_form" }));
    await act(async () => {
      await result.current.submit(payload, { handedToWhatsapp: true });
    });
    await act(async () => {
      await result.current.submit(payload, { handedToWhatsapp: true });
    });
    const leads = trackEventMock.mock.calls.filter(([n]) => n === "generate_lead");
    expect(leads).toHaveLength(1);
    expect(leads[0][1]).toMatchObject({ method: "lp_panfleto_form", delivery: "failed" });
  });

  it("timeout vira outcome próprio e conta como lead (pode ter chegado)", async () => {
    sendLeadMock.mockResolvedValue({ delivered: false, timedOut: true });
    const { result } = renderHook(() => useLeadSubmit({ method: "lp_obra_gate" }));
    let outcome: unknown;
    await act(async () => {
      outcome = await result.current.submit(payload);
    });
    expect(outcome).toBe("timedOut");
    expect(result.current.outcome).toBe("timedOut");
    expect(trackEventMock).toHaveBeenCalledWith("generate_lead", {
      method: "lp_obra_gate",
      delivery: "timeout",
    });
  });

  it("sem setState depois de desmontar; isMounted informa a página", async () => {
    const d = deferred<SendLeadResult>();
    sendLeadMock.mockReturnValue(d.promise);
    const { result, unmount } = renderHook(() => useLeadSubmit({ method: "lp_obra_gate" }));
    let pending!: Promise<unknown>;
    act(() => {
      pending = result.current.submit(payload);
    });
    const isMounted = result.current.isMounted;
    unmount();
    d.resolve({ delivered: true, timedOut: false });
    await expect(pending).resolves.toBe("delivered");
    expect(isMounted()).toBe(false);
  });

  it("mídia paga: id de evento estável entre reenvios; Lead sai uma vez com esse id", async () => {
    window.localStorage.setItem("lal_cookie_consent", "accepted");
    document.cookie = "_fbp=fb.1.1790000000000.123456789; path=/";
    sendLeadMock.mockResolvedValueOnce({ delivered: false, timedOut: false });
    sendLeadMock.mockResolvedValueOnce({ delivered: true, timedOut: false });
    const { result } = renderHook(() => useLeadSubmit({ method: "orcamento_form" }));
    const p = { ...payload, form_path: "/orcamento" as const, email: "ana@exemplo.com" };
    await act(async () => {
      await result.current.submit(p);
    });
    await act(async () => {
      await result.current.submit(p);
    });
    const [first, second] = sendLeadMock.mock.calls.map(([, opts]) => opts?.tracking);
    expect(first?.event_id).toBeTruthy();
    expect(second?.event_id).toBe(first?.event_id);
    expect(first).toMatchObject({ consent_marketing: true, fbp: "fb.1.1790000000000.123456789", fbc: null });
    // O próprio payload do formulário não é alterado (reenvio usa o mesmo objeto).
    expect(sendLeadMock.mock.calls[0][0]).toBe(p);
    expect("event_id" in p).toBe(false);

    expect(reportLeadMock).toHaveBeenCalledTimes(1);
    expect(reportLeadMock).toHaveBeenCalledWith({
      eventId: first?.event_id,
      formPath: "/orcamento",
      method: "orcamento_form",
      email: "ana@exemplo.com",
      phoneDigits: "11912345678",
    });
  });

  it("sem aceite de cookies: o servidor fica sabendo e não recebe _fbp/_fbc", async () => {
    document.cookie = "_fbp=fb.1.1790000000000.123456789; path=/";
    sendLeadMock.mockResolvedValue({ delivered: true, timedOut: false });
    const { result } = renderHook(() => useLeadSubmit({ method: "contato_form" }));
    await act(async () => {
      await result.current.submit(payload);
    });
    expect(sendLeadMock.mock.calls[0][1]?.tracking).toMatchObject({ consent_marketing: false, fbp: null, fbc: null });
  });

  it("falha sem WhatsApp não conta Lead de mídia", async () => {
    sendLeadMock.mockResolvedValue({ delivered: false, timedOut: false });
    const { result } = renderHook(() => useLeadSubmit({ method: "orcamento_form" }));
    await act(async () => {
      await result.current.submit(payload);
    });
    expect(reportLeadMock).not.toHaveBeenCalled();
  });
});
