import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import SiteAssistant from "../SiteAssistant";

/**
 * PUB-10: o assistente virou só o botão que leva à /faq — navegação pela SPA
 * (sem recarregar), escondido na própria /faq e nas rotas internas.
 */

afterEach(() => {
  cleanup();
  window.history.replaceState({}, "", "/");
});

describe("SiteAssistant", () => {
  it("leva à /faq pela SPA e some ao chegar lá", () => {
    window.history.replaceState({}, "", "/portfolio?utm_source=google");
    let navigated = 0;
    const onNavigate = () => (navigated += 1);
    window.addEventListener("lovable:navigate", onNavigate);

    render(<SiteAssistant />);
    const link = screen.getByRole("link", { name: /dúvidas/i });
    expect(link).toHaveAttribute("href", "/faq");

    act(() => {
      fireEvent.click(link);
    });
    window.removeEventListener("lovable:navigate", onNavigate);

    expect(navigated).toBe(1);
    // A navegação interna preserva a campanha (carryCampaignParams).
    expect(window.location.pathname + window.location.search).toBe("/faq?utm_source=google");
    expect(screen.queryByRole("link", { name: /dúvidas/i })).toBeNull();
  });

  it("Ctrl+clique fica com o navegador (nova aba)", () => {
    window.history.replaceState({}, "", "/portfolio");
    render(<SiteAssistant />);
    const link = screen.getByRole("link", { name: /dúvidas/i });
    let preventedByApp: boolean | null = null;
    const spy = (e: Event) => {
      preventedByApp = e.defaultPrevented;
      e.preventDefault(); // jsdom não navega entre documentos
    };
    document.addEventListener("click", spy);
    fireEvent.click(link, { ctrlKey: true });
    document.removeEventListener("click", spy);
    expect(preventedByApp).toBe(false);
    expect(window.location.pathname).toBe("/portfolio");
  });

  it.each(["/faq", "/admin/leads", "/diagnostico", "/o", "/p"])("não aparece em %s", (path) => {
    render(<SiteAssistant getPath={() => path} />);
    expect(screen.queryByRole("link", { name: /dúvidas/i })).toBeNull();
  });

  it("com o banner de cookies aberto, sobe acima da barra 'Solicitar orçamento' (que sobe acima do banner)", () => {
    // Quadros de animação controlados pelo teste.
    const frames: FrameRequestCallback[] = [];
    const raf = vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      frames.push(cb);
      return frames.length;
    });
    const caf = vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
    const flush = () => {
      while (frames.length) frames.shift()!(0);
    };
    const h = window.innerHeight;
    const fixedAt = (className: string, top: number, bottom: number) => {
      const el = document.createElement("div");
      el.className = className;
      el.style.opacity = "1";
      el.getBoundingClientRect = () =>
        ({ top, bottom, height: bottom - top, width: 360, left: 12, right: 372, x: 12, y: top, toJSON() {} }) as DOMRect;
      document.body.appendChild(el);
      return el;
    };
    // Banner com 157 px colado na borda; a barra 12 px acima dele.
    const banner = fixedAt("cookie-banner", h - 157, h);
    const cta = fixedAt("bwa-mobile-cta", h - 157 - 12 - 52, h - 157 - 12);
    try {
      window.history.replaceState({}, "", "/portfolio");
      render(<SiteAssistant />);
      act(() => flush());
      const wrap = document.querySelector<HTMLElement>(".bwas")!;
      // Antes: só o banner contava (a barra termina a mais de 120 px da borda)
      // e o botão parava em cima dela — offset 157.
      expect(wrap.style.getPropertyValue("--bwas-offset")).toBe(`${157 + 12 + 52}px`);
    } finally {
      banner.remove();
      cta.remove();
      raf.mockRestore();
      caf.mockRestore();
    }
  });

  it("volta a aparecer quando o Voltar sai da /faq", () => {
    window.history.replaceState({}, "", "/faq");
    render(<SiteAssistant />);
    expect(screen.queryByRole("link", { name: /dúvidas/i })).toBeNull();
    act(() => {
      window.history.replaceState({}, "", "/contato");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(screen.getByRole("link", { name: /dúvidas/i })).toBeInTheDocument();
  });
});
