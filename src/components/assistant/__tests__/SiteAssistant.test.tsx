import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import SiteAssistant from "../SiteAssistant";
import { assistantShowsOn } from "../assistantPaths";

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

  it("com o banner de cookies aberto, sobe só a altura dele: a barra 'Solicitar orçamento' fica na mesma linha, não embaixo", () => {
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
    // Banner com 157 px colado na borda; a barra 12 px acima dele. No
    // celular o botão virou ícone ao lado da barra (site-assistant.css):
    // sobe o banner e para na linha dela — antes subia os dois (221 px) e
    // ficava empilhado em cima da barra.
    const banner = fixedAt("cookie-banner", h - 157, h);
    const cta = fixedAt("bwa-mobile-cta", h - 157 - 12 - 52, h - 157 - 12);
    try {
      window.history.replaceState({}, "", "/portfolio");
      render(<SiteAssistant />);
      act(() => flush());
      const wrap = document.querySelector<HTMLElement>(".bwas")!;
      expect(wrap.style.getPropertyValue("--bwas-offset")).toBe("157px");
      // Com obstáculo, a base do celular é a mesma da barra: 12 px.
      expect(wrap.style.getPropertyValue("--bwas-base-m")).toBe("12px");
    } finally {
      banner.remove();
      cta.remove();
      raf.mockRestore();
      caf.mockRestore();
    }
  });

  it("marca o <html> com data-bwas enquanto aparece (a barra do celular termina antes do botão)", () => {
    const html = document.documentElement;
    const classBefore = html.className;
    const { unmount } = render(<SiteAssistant getPath={() => "/portfolio"} />);
    expect(html).toHaveAttribute("data-bwas");
    // Atributo, não classe: mexer na classe do <html> recalcula o estilo do
    // documento inteiro (MOB-03).
    expect(html.className).toBe(classBefore);
    unmount();
    expect(html).not.toHaveAttribute("data-bwas");

    render(<SiteAssistant getPath={() => "/faq"} />);
    expect(html).not.toHaveAttribute("data-bwas");
  });

  it("assistantShowsOn segue a mesma regra do componente (o servidor usa para mandar data-bwas no HTML)", () => {
    for (const path of ["/", "/portfolio", "/orcamento", "/conteudos/um-artigo"]) expect(assistantShowsOn(path)).toBe(true);
    for (const path of ["/faq", "/admin/leads", "/diagnostico", "/o", "/p"]) expect(assistantShowsOn(path)).toBe(false);
  });

  it("com data-bwas já vindo do servidor, montar não escreve nada no <html>", () => {
    const html = document.documentElement;
    html.setAttribute("data-bwas", "");
    const setAttribute = vi.spyOn(html, "setAttribute");
    try {
      const { unmount } = render(<SiteAssistant getPath={() => "/portfolio"} />);
      expect(setAttribute).not.toHaveBeenCalled();
      // A folga de rolagem vem do CSS (html[data-bwas]); nada de style inline.
      expect(html.style.scrollPaddingBottom).toBe("");
      unmount();
      expect(html).not.toHaveAttribute("data-bwas");
    } finally {
      setAttribute.mockRestore();
      html.removeAttribute("data-bwas");
    }
  });

  it("data-bwas vindo do servidor numa rota em que o botão não aparece é retirado", () => {
    const html = document.documentElement;
    html.setAttribute("data-bwas", "");
    try {
      render(<SiteAssistant getPath={() => "/faq"} />);
      expect(html).not.toHaveAttribute("data-bwas");
    } finally {
      html.removeAttribute("data-bwas");
    }
  });

  it("folga de rolagem: o banner de cookies entra pelo CSS; outro obstáculo vira style no <html>", () => {
    const frames: FrameRequestCallback[] = [];
    const raf = vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      frames.push(cb);
      return frames.length;
    });
    const caf = vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
    const flush = () => {
      while (frames.length) frames.shift()!(0);
    };
    const html = document.documentElement;
    const h = window.innerHeight;
    const fixedAt = (className: string, height: number) => {
      const el = document.createElement("div");
      el.className = className;
      el.style.opacity = "1";
      el.getBoundingClientRect = () =>
        ({ top: h - height, bottom: h, height, width: 360, left: 0, right: 360, x: 0, y: h - height, toJSON() {} }) as DOMRect;
      document.body.appendChild(el);
      return el;
    };
    try {
      // 1) Só o banner, com a altura publicada por ele em --cookie-banner-h:
      //    o CSS já soma (96px + var), o componente não escreve.
      const banner = fixedAt("cookie-banner", 138);
      html.style.setProperty("--cookie-banner-h", "138px");
      const first = render(<SiteAssistant getPath={() => "/portfolio"} />);
      act(() => flush());
      expect(document.querySelector<HTMLElement>(".bwas")!.style.getPropertyValue("--bwas-offset")).toBe("138px");
      expect(html.style.scrollPaddingBottom).toBe("");
      first.unmount();
      banner.remove();

      // 1b) Banner ainda entrando na tela (translateY): só 40 px dele aparecem,
      //     mas a altura publicada já é a final. A folga do CSS cobre — nada de
      //     escrever um valor menor no <html> para desfazer logo depois.
      const entering = fixedAt("cookie-banner", 40);
      const mid = render(<SiteAssistant getPath={() => "/portfolio"} />);
      act(() => flush());
      expect(document.querySelector<HTMLElement>(".bwas")!.style.getPropertyValue("--bwas-offset")).toBe("40px");
      expect(html.style.scrollPaddingBottom).toBe("");
      mid.unmount();
      entering.remove();
      html.style.removeProperty("--cookie-banner-h");

      // 2) Outro obstáculo (barra do guia, 64 px), sem banner: 96 + 64.
      const bar = fixedAt("fixed bottom-0", 64);
      const second = render(<SiteAssistant getPath={() => "/guia-do-investidor"} />);
      act(() => flush());
      expect(html.style.scrollPaddingBottom).toBe("160px");
      second.unmount();
      expect(html.style.scrollPaddingBottom).toBe("");
      bar.remove();
    } finally {
      html.style.removeProperty("--cookie-banner-h");
      html.style.scrollPaddingBottom = "";
      document.querySelectorAll(".cookie-banner, .fixed.bottom-0").forEach((el) => el.remove());
      raf.mockRestore();
      caf.mockRestore();
    }
  });

  it("em /orcamento continua no desktop e some só no celular (bwas--sem-mobile)", () => {
    render(<SiteAssistant getPath={() => "/orcamento"} />);
    expect(screen.getByRole("link", { name: /dúvidas/i })).toBeInTheDocument();
    expect(document.querySelector(".bwas")).toHaveClass("bwas--sem-mobile");
    cleanup();

    render(<SiteAssistant getPath={() => "/portfolio"} />);
    expect(document.querySelector(".bwas")).not.toHaveClass("bwas--sem-mobile");
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
