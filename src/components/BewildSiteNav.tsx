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
import bewildLogo from "@/assets/bewild-logo-color.png.asset.json";
import bewildLogoWhite from "@/assets/bewild-logo-white.png.asset.json";


type Item = { label: string; homeHref: string; pageHref: string };

const ITEMS: Item[] = [
  { label: "Como funciona", homeHref: "#como-funciona", pageHref: "/#como-funciona" },
  { label: "Por que a Bewild", homeHref: "#por-que-a-bewild", pageHref: "/#por-que-a-bewild" },
  { label: "Portfólio", homeHref: "/portfolio", pageHref: "/portfolio" },
  { label: "Conteúdos", homeHref: "/conteudos", pageHref: "/conteudos" },
  { label: "FAQ", homeHref: "/faq", pageHref: "/faq" },
];

const CLIENT_AREA_URL = "https://bwildworkflow.com";

function getPathname(): string {
  if (typeof window === "undefined") return "/";
  return window.location.pathname || "/";
}

function BwNavProgress() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0;
      el.style.width = p + "%";
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return <span ref={ref} className="bw-nav__progress" aria-hidden="true" />;
}

export default function BewildSiteNav() {
  const [pathname, setPathname] = useState<string>(() => getPathname());
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const firstLinkRef = useRef<HTMLAnchorElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const lastYRef = useRef(0);


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
    const isHome = pathname === "/" || pathname === "";
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 80);
      if (isHome) {
        const goingDown = y > lastYRef.current && y > 240;
        setHidden(goingDown);
      } else {
        setHidden(false);
      }
      lastYRef.current = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);


  // Scrollspy: somente na home — baseado em posição (determinístico, sem flicker)
  useEffect(() => {
    const isHomePath = pathname === "/" || pathname === "";
    if (!isHomePath) {
      setActiveSection(null);
      return;
    }
    const ids = ["como-funciona", "por-que-a-bewild"];
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
    if (it.homeHref === "#como-funciona") return "como-funciona";
    if (it.homeHref === "#por-que-a-bewild") return "por-que-a-bewild";
    return null;
  };

  const transparent = isHome && !scrolled;

  const headerClass = [
    "bw-nav",
    isHome ? "bw-nav--home" : "",
    transparent ? "bw-nav--transparent" : "bw-nav--solid",
    scrolled && !transparent ? "bw-nav--scrolled" : "",
    hidden ? "bw-nav--hidden" : "",
  ]
    .filter(Boolean)
    .join(" ");


  return (
    <header className={headerClass}>
      <BwNavProgress />
      <div className="bw-nav__inner">
        <a href="/" className="bw-nav__brand" aria-label="Bewild — início">
          <img src={bewildLogo.url} alt="Bewild" className="bw-nav__logo bw-nav__logo--color" />
          <img src={bewildLogoWhite.url} alt="Bewild" className="bw-nav__logo bw-nav__logo--white" aria-hidden="true" />
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
            Solicitar Orçamento <span className="arrow" aria-hidden>→</span>
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

      {menuOpen && typeof document !== "undefined" &&
        createPortal(
          <div
            style={{
              ["--bw-navy-deep" as string]: "#0B2342",
              ["--bw-navy" as string]: "#11355B",
              ["--bw-cyan" as string]: "#2F86B8",
              ["--bw-cyan-2" as string]: "#5FB2DD",
              ["--bw-display" as string]: '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              ["--bw-sans" as string]: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              ["--bw-ink-deep" as string]: "#071427",
              ["--bw-hair" as string]: "rgba(255,255,255,.14)",
              ["--bw-sky" as string]: "#5FB2DD",
              ["--bw-mono" as string]: '"JetBrains Mono",ui-monospace,"SFMono-Regular",Menlo,monospace',
            } as React.CSSProperties}
          >
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
                <img src={bewildLogo.url} alt="Bewild" className="bw-nav__logo bw-nav__logo--color" />
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
                Solicitar Orçamento <span className="arrow" aria-hidden>→</span>
              </a>
            </div>
          </div>
          </div>,
          document.body
        )}
    </header>
  );
}
