/**
 * BewildSiteNav — navegação Bewild v4 unificada em todas as páginas.
 *
 * Header navy sólido com a logo real da marca (lockup branco). Mesmos
 * links em todas as páginas; item da página atual marcado como ativo.
 * No mobile, menu hambúrguer abre um overlay em tela cheia com os links
 * e os dois CTAs (Área do cliente + Solicitar diagnóstico) no rodapé,
 * dentro da zona do polegar.
 *
 * Na home (pathname "/"), o header começa transparente sobre o hero e
 * condensa para navy sólido ao rolar (~70px). Nas demais páginas o
 * header é sempre navy sólido.
 *
 * Auto-contido (não depende de `.bw-home`) — usa `bw-nav.css`.
 */
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Menu, X, CircleUserRound } from "lucide-react";
import "@/styles/bw-nav.css";

type Item = { label: string; homeHref: string; pageHref: string };

const ITEMS: Item[] = [
  { label: "O que fazemos", homeHref: "#fazemos", pageHref: "/#fazemos" },
  { label: "Como funciona", homeHref: "#processo", pageHref: "/#processo" },
  { label: "Por que a Bewild", homeHref: "#diferenciais", pageHref: "/#diferenciais" },
  { label: "Portfólio", homeHref: "/portfolio", pageHref: "/portfolio" },
  { label: "Conteúdos", homeHref: "/conteudos", pageHref: "/conteudos" },
  { label: "FAQ", homeHref: "/faq", pageHref: "/faq" },
];

const CLIENT_AREA_URL = "https://bwildworkflow.com";

function getPathname(): string {
  if (typeof window === "undefined") return "/";
  return window.location.pathname || "/";
}

export default function BewildSiteNav() {
  const [pathname, setPathname] = useState<string>(() => getPathname());
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
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
    const onScroll = () => setScrolled(window.scrollY > 70);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scrollspy: somente na home — baseado em posição (determinístico, sem flicker)
  useEffect(() => {
    const isHomePath = pathname === "/" || pathname === "";
    if (!isHomePath) {
      setActiveSection(null);
      return;
    }
    const ids = ["fazemos", "processo", "diferenciais"];
    let raf = 0;

    const compute = () => {
      raf = 0;
      const line = window.innerHeight * 0.5; // centro da viewport
      let current: string | null = null;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.top <= line && r.bottom > line) {
          current = id;
          break;
        }
      }
      setActiveSection((prev) => (prev === current ? prev : current));
    };

    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(compute);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    compute();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
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

  const sectionId = (it: Item): string | null => {
    if (!isHome) return null;
    if (it.homeHref === "#fazemos") return "fazemos";
    if (it.homeHref === "#processo") return "processo";
    if (it.homeHref === "#diferenciais") return "diferenciais";
    return null;
  };

  const transparent = false;

  const headerClass = [
    "bw-nav",
    transparent ? "bw-nav--transparent" : "bw-nav--solid",
    scrolled && !transparent ? "bw-nav--scrolled" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={headerClass}>
      <div className="bw-nav__inner">
        <a href="/" className="bw-nav__brand" aria-label="Bewild — início">
          <img
            src="/brand/bewild-logo-cropped.png"
            alt="Bewild"
            className="bw-nav__logo"
            width={81}
            height={28}
            decoding="async"
            {...({ fetchpriority: "high" } as { fetchpriority: string })}
          />
        </a>

        <nav className="bw-nav__links" aria-label="Navegação principal">
          {ITEMS.map((it) => {
            const sid = sectionId(it);
            const current = sid !== null && activeSection === sid;
            return (
              <a
                key={it.label}
                href={isHome ? it.homeHref : it.pageHref}
                aria-current={isActive(it) ? "page" : undefined}
                className={current ? "is-current" : undefined}
              >
                {it.label}
              </a>
            );
          })}
        </nav>

        <div className="bw-nav__actions">
          <a
            href={CLIENT_AREA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bw-nav__secondary"
          >
            <CircleUserRound size={16} aria-hidden />
            <span>Área do cliente</span>
          </a>
          <a href="/diagnostico" className="bw-nav__cta">
            Solicitar diagnóstico <span className="arrow" aria-hidden>→</span>
          </a>
        </div>

        <button
          ref={toggleRef}
          type="button"
          className="bw-nav__toggle"
          aria-expanded={menuOpen}
          aria-controls="bw-nav-mobile"
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <Menu size={22} aria-hidden />
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
          <div className="bw-nav__mobile-top">
            <a
              href="/"
              className="bw-nav__brand"
              aria-label="Bewild — início"
              onClick={() => setMenuOpen(false)}
            >
              <img
                src="/brand/bewild-logo-cropped.png"
                alt="Bewild"
                className="bw-nav__logo"
                width={81}
                height={28}
                decoding="async"
              />
            </a>
            <button
              type="button"
              className="bw-nav__close"
              aria-label="Fechar menu"
              onClick={() => setMenuOpen(false)}
            >
              <X size={22} aria-hidden />
            </button>
          </div>

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
          </nav>

          <div className="bw-nav__mobile-foot">
            <a
              href={CLIENT_AREA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="bw-nav__secondary bw-nav__secondary--mobile"
              onClick={() => setMenuOpen(false)}
            >
              <CircleUserRound size={18} aria-hidden />
              <span>Área do cliente</span>
            </a>
            <a
              href="/diagnostico"
              className="bw-nav__cta bw-nav__cta--mobile"
              onClick={() => setMenuOpen(false)}
            >
              Solicitar diagnóstico <span className="arrow" aria-hidden>→</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
