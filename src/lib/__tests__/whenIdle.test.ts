import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ensureGoogleTagScript, whenIdleAfterLoad } from "../whenIdle";

describe("rastreamento adiado", () => {
  let callbacks: Array<() => void>;
  beforeEach(() => {
    callbacks = [];
    localStorage.clear();
    localStorage.setItem("bewild_cookie_consent_v2", "accepted");
    document.head.querySelectorAll("script").forEach(node => node.remove());
    window.history.replaceState(null, "", "/orcamento");
    vi.spyOn(document, "readyState", "get").mockReturnValue("complete");
    vi.stubGlobal("requestIdleCallback", (cb: () => void) => { callbacks.push(cb); return callbacks.length; });
  });
  afterEach(() => { callbacks.forEach(cb => cb()); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
  it.each([["ga4", "ads"], ["ads", "ga4"]])("um download nas ordens %s e %s", (first, second) => {
    ensureGoogleTagScript(first, first === "ga4" ? "G-CE7GKKDG4L" : "AW-16893787587");
    ensureGoogleTagScript(second, second === "ga4" ? "G-CE7GKKDG4L" : "AW-16893787587");
    expect(document.head.querySelectorAll("script").length).toBe(0);
    expect(callbacks.length).toBe(1);
    callbacks.shift()?.();
    expect(document.head.querySelectorAll('script[src*="/gtag/js"]').length).toBe(1);
  });
  it.each(["declined", "admin"])("bloqueia download pendente após %s", (state) => {
    ensureGoogleTagScript("google", "G-CE7GKKDG4L");
    if (state === "declined") localStorage.setItem("bewild_cookie_consent_v2", "declined");
    else window.history.replaceState(null, "", "/admin/leads");
    callbacks.shift()?.();
    expect(document.head.querySelectorAll("script").length).toBe(0);
  });
  it("aguarda load antes de pedir tempo ocioso", () => {
    vi.spyOn(document, "readyState", "get").mockReturnValue("loading");
    const fn = vi.fn();
    whenIdleAfterLoad(fn);
    expect(callbacks.length).toBe(0);
    window.dispatchEvent(new Event("load"));
    expect(fn).not.toHaveBeenCalled();
    callbacks.shift()?.();
    expect(fn).toHaveBeenCalledTimes(1);
  });
});