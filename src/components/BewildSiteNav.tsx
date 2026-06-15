/**
 * BewildSiteNav — navegação Bewild v4 unificada em todas as páginas.
 *
 * Header navy sólido com a logo real da marca (lockup branco). Mesmos
 * links em todas as páginas; item da página atual marcado como ativo.
 * No mobile, um menu hambúrguer abre um painel com os mesmos links + CTA.
 *
 * Auto-contida (não depende de `.bw-home`) — usa `bw-nav.css`.
 */
import { useEffect, useRef, useState } from "react";
import "@/styles/bw-nav.css";

type Item = { label: string; homeHref: string; pageHref: string };

const ITEMS: Item[] = [
  { label: "O que fazemos", homeHref: "#fazemos", pageHref: "/#fazemos" },
  { label: "Como funciona", homeHref: "#processo", pageHref: "/#processo" },
  { label: "Portfólio", homeHref: "/portfolio", pageHref: "/portfolio" },
  { label: "Diferenciais", homeHref: "#diferenciais", pageHref: "/#diferenciais" },
  { label: "FAQ", homeHref: "/faq", pageHref: "/faq" },
  { label: "Conteúdos", homeHref: "/conteudos", pageHref: "/conteudos" },
];

function getPathname(): string {
  if (typeof window === "undefined") return "/";
  return window.location.pathname || "/";
}

export default function BewildSiteNav() {
  const [pathname, setPathname] = useState<string>(() => getPathname());
  const [menuOpen, setMenuOpen] = useState(false);
  const firstLinkRef = useRef<HTMLAnchorElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const onNav = () => setPathname(getPathname());
    window.addEventListener("popstate", onNav);
    window.addEventListener("hashchange", onNav);
    window.addEventListener("lovable:navigate", onNav);
    return () => {
      window.removeEventListener("popstate", onNav);
      window.removeEventListener("hashchange", onNav);
      window.removeEventListener("lovable:navigate", onNav);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    // foco no primeiro link
    setTimeout(() => firstLinkRef.current?.focus(), 10);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const isHome = pathname === "/" || pathname === "";

  const isActive = (it: Item) => {
    if (it.pageHref.startsWith("/") && !it.pageHref.startsWith("/#")) {
      return pathname === it.pageHref || pathname.startsWith(it.pageHref + "/");
    }
    return false;
  };

  return (
    <header className="bw-nav">
      <div className="bw-nav__inner">
        <a href="/" className="bw-nav__brand" aria-label="Bewild — início">
          <img
            src="/brand/logo-branco.png"
            alt="Bewild"
            className="bw-nav__logo"
            width={231}
            height={28}
            decoding="async"
            {...({ fetchpriority: "high" } as { fetchpriority: string })}
          />
        </a>

        <nav className="bw-nav__links" aria-label="Navegação principal">
          {ITEMS.map((it) => (
            <a
              key={it.label}
              href={isHome ? it.homeHref : it.pageHref}
              aria-current={isActive(it) ? "page" : undefined}
            >
              {it.label}
            </a>
          ))}
        </nav>

        <a href="/diagnostico" className="bw-nav__cta">
          Solicitar diagnóstico <span className="arrow" aria-hidden>→</span>
        </a>

        <button
          ref={toggleRef}
          type="button"
          className="bw-nav__toggle"
          aria-expanded={menuOpen}
          aria-controls="bw-nav-mobile"
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span aria-hidden>{menuOpen ? "✕" : "☰"}</span>
        </button>
      </div>

      {menuOpen && (
        <div
          id="bw-nav-mobile"
          className="bw-nav__mobile"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <nav className="bw-nav__mobile-links" aria-label="Navegação principal — móvel">
            {ITEMS.map((it, i) => (
              <a
                key={it.label}
                ref={i === 0 ? firstLinkRef : undefined}
                href={isHome ? it.homeHref : it.pageHref}
                aria-current={isActive(it) ? "page" : undefined}
                onClick={() => setMenuOpen(false)}
              >
                {it.label}
              </a>
            ))}
            <a
              href="/diagnostico"
              className="bw-nav__cta bw-nav__cta--mobile"
              onClick={() => setMenuOpen(false)}
            >
              Solicitar diagnóstico <span className="arrow" aria-hidden>→</span>
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
