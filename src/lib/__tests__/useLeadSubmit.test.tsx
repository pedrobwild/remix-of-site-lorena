import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { LeadPayload } from "../leadDelivery";
import type { SendLeadResult } from "../sendLead";

const sendLeadMock = vi.fn<(payload: LeadPayload, opts?: { timeoutMs?: number }) => Promise<SendLeadResult>>();
const trackEventMock = vi.fn();

vi.mock("@/lib/sendLead", () => ({
  sendLead: (payload: LeadPayload, opts?: { timeoutMs?: number }) => sendLeadMock(payload, opts),
}));
vi.mock("@/lib/ga4", () => ({
  trackEvent: (name: string, params?: Record<string, unknown>) => trackEventMock(name, params),
}));
const trackMetaLeadMock = vi.fn();
vi.mock("@/lib/metaPixel", () => ({
  newMetaEventId: () => "evt-fixo",
  readMetaBrowserIds: () => ({ fbp: "fb.1.1700000000000.42", fbc: null }),
  trackMetaLead: (params: unknown) => trackMetaLeadMock(params),
}));
vi.mock("@/lib/cookieConsent", () => ({
  isConsentAccepted: () => true,
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
  trackMetaLeadMock.mockReset();
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

  it("Meta: anexa event_id/fbp/consentimento ao payload e dispara o Lead do Pixel com o mesmo id", async () => {
    sendLeadMock.mockResolvedValue({ delivered: true, timedOut: false });
    const { result } = renderHook(() => useLeadSubmit({ method: "orcamento_form" }));
    await act(async () => {
      await result.current.submit(payload);
    });
    const sent = sendLeadMock.mock.calls[0][0];
    expect(sent).toMatchObject({
      name: "Ana",
      meta_event_id: "evt-fixo",
      fbp: "fb.1.1700000000000.42",
      fbc: null,
      ads_consent: true,
    });
    expect(typeof sent.event_source_url).toBe("string");
    expect(trackMetaLeadMock).toHaveBeenCalledTimes(1);
    expect(trackMetaLeadMock).toHaveBeenCalledWith({
      eventId: "evt-fixo",
      formPath: "/diagnostico",
      objetivo: "Short stay",
    });
  });

  it("Meta: falha sem WhatsApp não dispara Lead no Pixel (mesma regra do generate_lead)", async () => {
    sendLeadMock.mockResolvedValue({ delivered: false, timedOut: false });
    const { result } = renderHook(() => useLeadSubmit({ method: "orcamento_form" }));
    await act(async () => {
      await result.current.submit(payload);
    });
    expect(trackEventMock).toHaveBeenCalledWith("lead_delivery_failed", expect.anything());
    expect(trackMetaLeadMock).not.toHaveBeenCalled();
  });
});
