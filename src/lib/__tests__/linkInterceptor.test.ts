/**
 * FE-01 — o interceptor de links não pode estourar quando `event.target`
 * não é um Element.
 *
 * Evidência que originou o teste: 26 registros de `b.closest is not a
 * function` / `_.closest is not a function` em `crash_reports`, sempre em
 * pares e sempre com o frame `at HTMLDocument.<fn>` — dois handlers de
 * `document` quebrando no mesmo evento. `event.target` é tipado como
 * `EventTarget`; num evento sintético despachado direto no `document` ele é
 * o próprio `Document`, que não implementa `closest`.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc: vi.fn(), from: vi.fn() },
}));

import { closestElementFrom, installLinkInterceptor } from "../useHashRoute";

describe("closestElementFrom", () => {
  it("devolve o próprio elemento quando o target já é um Element", () => {
    const a = document.createElement("a");
    expect(closestElementFrom(a)).toBe(a);
  });

  it("sobe do nó de texto para o elemento que o contém", () => {
    const a = document.createElement("a");
    a.textContent = "Portfólio";
    const text = a.firstChild as Text;
    expect(text.nodeType).toBe(3);
    expect(closestElementFrom(text)).toBe(a);
  });

  it("devolve null para `document` — que não tem closest", () => {
    expect("closest" in document).toBe(false);
    expect(closestElementFrom(document)).toBeNull();
  });

  it("devolve null para target ausente ou objeto sem closest", () => {
    expect(closestElementFrom(null)).toBeNull();
    expect(closestElementFrom(window)).toBeNull();
  });
});

describe("installLinkInterceptor", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    delete (window as unknown as { __linkInterceptorInstalled?: boolean })
      .__linkInterceptorInstalled;
    window.history.replaceState({}, "", "/");
  });

  it("não lança quando o clique é despachado no próprio document", () => {
    installLinkInterceptor();

    const onError = vi.fn();
    window.addEventListener("error", onError);

    // Reproduz o crash: evento sintético no document → target === document.
    const ev = new MouseEvent("click", { bubbles: true, button: 0 });
    expect(() => document.dispatchEvent(ev)).not.toThrow();
    expect(ev.target).toBe(document);

    window.removeEventListener("error", onError);
  });

  it("não lança quando o clique nasce num nó de texto dentro de um link", () => {
    document.body.innerHTML = '<a href="/portfolio">Portfólio</a>';
    installLinkInterceptor();

    const text = document.querySelector("a")!.firstChild as Text;
    const ev = new MouseEvent("click", { bubbles: true, button: 0 });
    Object.defineProperty(ev, "target", { value: text, configurable: true });

    expect(() => document.dispatchEvent(ev)).not.toThrow();
  });

  it("continua interceptando um clique normal em link interno", () => {
    document.body.innerHTML = '<a href="/portfolio">Portfólio</a>';
    installLinkInterceptor();

    const a = document.querySelector("a")!;
    const ev = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 });
    a.dispatchEvent(ev);

    expect(ev.defaultPrevented).toBe(true);
    expect(window.location.pathname).toBe("/portfolio");
  });
});
