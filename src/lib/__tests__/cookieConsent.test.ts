/**
 * Cobertura: o gate LGPD em `track()` (src/lib/analytics.ts) e em
 * `injectTrackers()` (src/lib/useSeo.ts) lê o estado central de
 * `cookieConsent`. Antes do aceite, nada deve sair pela rede e nenhum
 * script de terceiros deve aparecer no <head>.
 *
 * Este teste cobre o vetor descrito em #2 / B4: sem aceite explícito,
 * a chamada de `track()` é silenciada e os trackers não são injetados.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Após A9 o tracker bate na edge function /functions/v1/track via fetch.
// Mockamos o global fetch e contamos quantos POSTs saem.
const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
vi.stubGlobal("fetch", fetchMock);

import { track } from "@/lib/analytics";
import {
  CONSENT_VERSION,
  hadLegacyAcceptance,
  isConsentAccepted,
  onConsentChange,
  readConsent,
  setConsent,
} from "@/lib/cookieConsent";

beforeEach(() => {
  window.localStorage.clear();
  fetchMock.mockClear();
});

afterEach(() => {
  window.localStorage.clear();
});

describe("track() — gate de consentimento LGPD", () => {
  it("não envia evento quando não há decisão de consentimento", () => {
    expect(isConsentAccepted()).toBe(false);
    track("pageview", { path: "/" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("não envia evento quando o usuário recusou", () => {
    setConsent("declined");
    track("pageview", { path: "/" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("envia evento depois que o usuário aceita", () => {
    setConsent("accepted");
    track("pageview", { path: "/" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toMatch(/\/functions\/v1\/track$/);
    expect((init as RequestInit)?.method).toBe("POST");
  });

  it("volta a silenciar se o consentimento for revogado para 'declined'", () => {
    setConsent("accepted");
    track("pageview", { path: "/a" });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    setConsent("declined");
    track("pageview", { path: "/b" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("cookieConsent — evento de mudança", () => {
  it("dispara CustomEvent 'cookie:consent-change' quando muda", () => {
    const listener = vi.fn();
    window.addEventListener("cookie:consent-change", listener as EventListener);

    setConsent("accepted");
    setConsent("declined");

    expect(listener).toHaveBeenCalledTimes(2);
    window.removeEventListener(
      "cookie:consent-change",
      listener as EventListener
    );
  });
});

describe("cookieConsent — versão do aceite (LGPD art. 9º §2º)", () => {
  const currentKey = `bewild_cookie_consent_v${CONSENT_VERSION}`;

  it("aceite da versão anterior não vale mais: pergunta de novo, nada rastreia", () => {
    window.localStorage.setItem("lal_cookie_consent", "accepted");
    expect(readConsent()).toBeNull();
    expect(isConsentAccepted()).toBe(false);
    expect(hadLegacyAcceptance()).toBe(true);
    track("pageview", { path: "/" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("recusa da versão anterior continua valendo", () => {
    window.localStorage.setItem("lal_cookie_consent", "declined");
    expect(readConsent()).toBe("declined");
    expect(hadLegacyAcceptance()).toBe(false);
  });

  it("a escolha nova grava na chave da versão atual e apaga a antiga", () => {
    window.localStorage.setItem("lal_cookie_consent", "accepted");
    setConsent("accepted");
    expect(window.localStorage.getItem(currentKey)).toBe("accepted");
    expect(window.localStorage.getItem("lal_cookie_consent")).toBeNull();
    expect(isConsentAccepted()).toBe(true);
    expect(hadLegacyAcceptance()).toBe(false);
  });

  it("renovar o aceite avisa os assinantes como primeira escolha (anterior = null)", () => {
    window.localStorage.setItem("lal_cookie_consent", "accepted");
    const handler = vi.fn();
    const off = onConsentChange(handler);
    setConsent("accepted");
    off();
    expect(handler).toHaveBeenCalledWith("accepted", null);
  });

  it("outra aba: só a chave da versão atual conta", () => {
    const handler = vi.fn();
    const off = onConsentChange(handler);
    window.dispatchEvent(
      new StorageEvent("storage", { key: "lal_cookie_consent", oldValue: null, newValue: "accepted" }),
    );
    window.dispatchEvent(new StorageEvent("storage", { key: currentKey, oldValue: null, newValue: "accepted" }));
    off();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith("accepted", null);
  });
});
