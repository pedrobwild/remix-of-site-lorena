import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { isInAppNavigationClick, useUnsavedChangesGuard } from "@/lib/useUnsavedChangesGuard";

function clickOn(el: Element, init: MouseEventInit = {}) {
  const e = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0, ...init });
  el.dispatchEvent(e);
  return e;
}

function link(href: string, attrs: Record<string, string> = {}) {
  const a = document.createElement("a");
  a.setAttribute("href", href);
  for (const [k, v] of Object.entries(attrs)) a.setAttribute(k, v);
  a.textContent = "ir";
  document.body.appendChild(a);
  return a;
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("isInAppNavigationClick", () => {
  const here = `${window.location.origin}/admin/projetos/x`;

  it("link interno para outra página conta; âncora, nova aba e externo não", () => {
    const cases: Array<[HTMLAnchorElement, boolean]> = [
      [link("/admin/projetos"), true],
      [link("#secao"), false],
      [link("/admin/projetos", { target: "_blank" }), false],
      [link("https://outro-site.com/"), false],
      [link("/arquivo.pdf", { download: "" }), false],
    ];
    for (const [a, expected] of cases) {
      let got: boolean | null = null;
      a.addEventListener("click", (e) => {
        got = isInAppNavigationClick(e, here);
        e.preventDefault();
      });
      clickOn(a);
      expect(got).toBe(expected);
    }
  });

  it("ctrl/cmd+clique (nova aba) não conta", () => {
    const a = link("/admin/projetos");
    let got: boolean | null = null;
    a.addEventListener("click", (e) => {
      got = isInAppNavigationClick(e, here);
      e.preventDefault();
    });
    clickOn(a, { ctrlKey: true });
    expect(got).toBe(false);
  });
});

describe("useUnsavedChangesGuard", () => {
  it("com alterações, pergunta e cancela a navegação se o admin desistir", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    renderHook(() => useUnsavedChangesGuard(true));
    const a = link("/admin/projetos");
    const e = clickOn(a);
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(e.defaultPrevented).toBe(true);
  });

  it("confirmando, o clique segue (o interceptor do SPA navega)", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderHook(() => useUnsavedChangesGuard(true));
    const a = link("/admin/projetos");
    // impede a navegação real do jsdom só depois do guard
    let seenByInterceptor = false;
    document.addEventListener(
      "click",
      (ev) => {
        seenByInterceptor = !ev.defaultPrevented;
        ev.preventDefault();
      },
      { once: true },
    );
    clickOn(a);
    expect(seenByInterceptor).toBe(true);
  });

  it("sem alterações, não pergunta nada", () => {
    const confirm = vi.spyOn(window, "confirm");
    renderHook(() => useUnsavedChangesGuard(false));
    const a = link("/admin/projetos");
    a.addEventListener("click", (e) => e.preventDefault());
    clickOn(a);
    expect(confirm).not.toHaveBeenCalled();
  });

  it("registra beforeunload só enquanto há alterações", () => {
    const { rerender } = renderHook(({ dirty }) => useUnsavedChangesGuard(dirty), {
      initialProps: { dirty: true },
    });
    const ev1 = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(ev1);
    expect(ev1.defaultPrevented).toBe(true);

    rerender({ dirty: false });
    const ev2 = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(ev2);
    expect(ev2.defaultPrevented).toBe(false);
  });
});
