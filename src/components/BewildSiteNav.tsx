/**
 * BewildSiteNav — navegação Bewild v4 unificada em todas as páginas.
 *
 * Mesma identidade visual da home. Os itens que não fazem sentido na
 * página atual são escondidos (ex.: âncoras de seção só aparecem na
 * home; "Portfólio" some dentro do próprio /portfolio).
 *
 * Auto-contida (não depende de `.bw-home`) — usa `bw-nav.css`.
 */
import { useEffect, useState } from "react";
import "@/styles/bw-nav.css";

type Item = {
  label: string;
  /** href absoluto ou âncora relativa quando estiver na home */
  href: string;
  /** Se true, só renderiza quando o usuário está em "/" */
  onlyHome?: boolean;
  /** Esconde o item quando o pathname começa com este prefixo */
  hideOnPrefix?: string;
};

function getPathname(): string {
  if (typeof window === "undefined") return "/";
  return window.location.pathname || "/";
}

export default function BewildSiteNav() {
  const [pathname, setPathname] = useState<string>(() => getPathname());

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

  const isHome = pathname === "/" || pathname === "";

  const items: Item[] = [
    { label: "O que fazemos", href: "/#fazemos", onlyHome: true },
    { label: "Como funciona", href: "/#processo", onlyHome: true },
    { label: "Portfólio", href: "/portfolio", hideOnPrefix: "/portfolio" },
    { label: "Conteúdos", href: "/conteudos", hideOnPrefix: "/conteudos" },
    { label: "Diferenciais", href: "/#diferenciais", onlyHome: true },
    { label: "Sobre", href: "/sobre", hideOnPrefix: "/sobre" },
    {
      label: "FAQ",
      href: isHome ? "#faq" : "/faq",
      hideOnPrefix: "/faq",
    },
  ];

  const visible = items.filter((it) => {
    if (it.onlyHome && !isHome) return false;
    if (it.hideOnPrefix && (pathname === it.hideOnPrefix || pathname.startsWith(it.hideOnPrefix + "/"))) {
      return false;
    }
    return true;
  });

  return (
    <header className="bw-nav">
      <div className="bw-nav__inner">
        <a href="/" className="bw-nav__brand" aria-label="Bewild · Grupo Bwild — início">
          <span className="be">Be</span>
          <span className="wild">wild</span>
          <span className="sub">Grupo Bwild</span>
        </a>

        <nav className="bw-nav__links" aria-label="Navegação principal">
          {visible.map((it) => {
            const isPageLink = it.href.startsWith("/") && !it.href.startsWith("/#");
            const isCurrent = isPageLink && (pathname === it.href || pathname.startsWith(it.href + "/"));
            return (
              <a
                key={it.label}
                href={it.href}
                aria-current={isCurrent ? "page" : undefined}
              >
                {it.label}
              </a>
            );
          })}
        </nav>

        <a href="/diagnostico" className="bw-nav__cta">
          Solicitar diagnóstico <span className="arrow" aria-hidden>→</span>
        </a>
      </div>
    </header>
  );
}
