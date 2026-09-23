/**
 * CORE-01 — retirar o consentimento (Aceitar → depois Recusar em
 * "Preferências de cookies") precisa parar o rastreamento de verdade:
 * Consent Mode do Google em "denied", `fbq('consent','revoke')`, cookies dos
 * trackers expirados e reload (a página volta sem nenhum script de terceiro,
 * porque eles só são injetados depois do aceite).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cookieDomainCandidates,
  expireTrackerCookies,
  installConsentWithdrawalGuard,
  onConsentChange,
  setConsent,
} from "../cookieConsent";

type W = Window & { gtag?: (...a: unknown[]) => void; fbq?: (...a: unknown[]) => void };

function clearAllCookies() {
  for (const c of document.cookie.split(";")) {
    const name = c.split("=")[0]?.trim();
    if (name) document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  }
}

beforeEach(() => {
  window.localStorage.clear();
  clearAllCookies();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  delete (window as W).gtag;
  delete (window as W).fbq;
  clearAllCookies();
});

describe("onConsentChange — valor novo e anterior", () => {
  it("entrega o valor anterior no evento da própria aba", () => {
    const calls: Array<[string, string | null]> = [];
    const off = onConsentChange((v, prev) => calls.push([v, prev]));
    setConsent("accepted");
    setConsent("declined");
    off();
    setConsent("accepted");
    expect(calls).toEqual([
      ["accepted", null],
      ["declined", "accepted"],
    ]);
  });

  it("entrega oldValue/newValue do evento `storage` (outra aba) e ignora outras chaves", () => {
    const handler = vi.fn();
    const off = onConsentChange(handler);
    window.dispatchEvent(
      new StorageEvent("storage", { key: "lal_cookie_consent", oldValue: "accepted", newValue: "declined" }),
    );
    window.dispatchEvent(new StorageEvent("storage", { key: "outra", newValue: "declined" }));
    window.dispatchEvent(new StorageEvent("storage", { key: "lal_cookie_consent", newValue: "lixo" }));
    off();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith("declined", "accepted");
  });
});

describe("cookies dos trackers", () => {
  it("domínios candidatos: host e cada domínio-pai; nada para localhost/IP", () => {
    expect(cookieDomainCandidates("www.bewild.com.br")).toEqual([
      "www.bewild.com.br",
      "bewild.com.br",
      "com.br",
    ]);
    expect(cookieDomainCandidates("localhost")).toEqual([]);
    expect(cookieDomainCandidates("127.0.0.1")).toEqual([]);
  });

  it("expira _ga*, _gid, _gcl*, _fbp, _fbc, _clck, _clsk e _hj* — e mais nada", () => {
    const names = ["_ga", "_ga_CE7GKKDG4L", "_gid", "_gcl_au", "_fbp", "_fbc", "_clck", "_clsk", "_hjSessionUser_1"];
    for (const n of names) document.cookie = `${n}=x; path=/`;
    document.cookie = "sb-auth=keep; path=/";
    document.cookie = "preferencia=keep; path=/";

    expireTrackerCookies();

    const left = document.cookie.split(";").map((c) => c.split("=")[0].trim()).filter(Boolean);
    expect(left.sort()).toEqual(["preferencia", "sb-auth"]);
  });
});

describe("installConsentWithdrawalGuard", () => {
  it("Aceitar → Recusar: Consent Mode denied, fbq revoke, cookies apagados e reload", () => {
    const gtag = vi.fn();
    const fbq = vi.fn();
    (window as W).gtag = gtag;
    (window as W).fbq = fbq;
    document.cookie = "_ga=GA1.1.1; path=/";
    document.cookie = "_fbp=fb.1; path=/";
    const reload = vi.fn();
    const off = installConsentWithdrawalGuard(reload);

    setConsent("accepted");
    expect(reload).not.toHaveBeenCalled();

    setConsent("declined");
    expect(gtag).toHaveBeenCalledWith("consent", "update", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    expect(fbq).toHaveBeenCalledWith("consent", "revoke");
    expect(document.cookie).not.toMatch(/_ga=|_fbp=/);
    // Reload assíncrono: os demais listeners do evento rodam antes.
    expect(reload).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(reload).toHaveBeenCalledTimes(1);
    off();
  });

  it("retirada feita em OUTRA aba também limpa e recarrega esta", () => {
    const reload = vi.fn();
    const off = installConsentWithdrawalGuard(reload);
    window.dispatchEvent(
      new StorageEvent("storage", { key: "lal_cookie_consent", oldValue: "accepted", newValue: "declined" }),
    );
    vi.runAllTimers();
    expect(reload).toHaveBeenCalledTimes(1);
    off();
  });

  it("recusa de primeira (sem aceite anterior) não recarrega, mas expira cookies que tenham sobrado", () => {
    document.cookie = "_ga=GA1.1.antigo; path=/";
    const reload = vi.fn();
    const gtag = vi.fn();
    (window as W).gtag = gtag;
    const off = installConsentWithdrawalGuard(reload);

    setConsent("declined");
    vi.runAllTimers();

    expect(reload).not.toHaveBeenCalled();
    expect(gtag).not.toHaveBeenCalled();
    expect(document.cookie).not.toMatch(/_ga=/);
    off();
  });

  it("SDK que lança não impede a limpeza nem o reload", () => {
    (window as W).gtag = () => {
      throw new Error("gtag quebrado");
    };
    const reload = vi.fn();
    const off = installConsentWithdrawalGuard(reload);
    setConsent("accepted");
    setConsent("declined");
    vi.runAllTimers();
    expect(reload).toHaveBeenCalledTimes(1);
    off();
  });
});
