import { useEffect, useRef } from "react";
import BewildLogo from "@/components/BewildLogo";
import { withUtm } from "@/lib/utm";
import homeBwaCssUrl from "../pages/home-bwa.css?url";
import bwaInternalCssUrl from "../pages/bwa-internal.css?url";
import { initBwaNav } from "../pages/home-bwa-script";

const FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Manrope:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,500&display=swap";

/**
 * BwaNav — Header .bwa unificado (nav desktop + menu mobile), idêntico ao
 * da home. Autoinjeta home-bwa.css + bwa-internal.css como ÚLTIMAS folhas do
 * <head> (para vencer preflight/temas legados) e inicializa initBwaNav
 * (idempotente, restrito a este componente). Usado em toda página pública
 * fora da home.
 *
 * Menu mobile acessível (em home-bwa-script.ts): ao abrir, o foco vai para
 * o primeiro link, o Tab fica preso no header + menu e o resto da página
 * fica `inert`; Esc fecha e devolve o foco ao botão. Ao desmontar, o menu
 * fecha — a classe `bwa-menu-open` (que trava a rolagem do body) nunca
 * vaza para a próxima rota.
 */
export default function BwaNav() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const marker1 = "data-bwa-home-css";
    const marker2 = "data-bwa-internal-css";
    let homeLink = document.head.querySelector<HTMLLinkElement>(`link[${marker1}]`);
    if (!homeLink) {
      homeLink = document.createElement("link");
      homeLink.rel = "stylesheet";
      homeLink.href = homeBwaCssUrl;
      homeLink.setAttribute(marker1, "");
      document.head.appendChild(homeLink);
    } else {
      document.head.appendChild(homeLink);
    }
    let intLink = document.head.querySelector<HTMLLinkElement>(`link[${marker2}]`);
    if (!intLink) {
      intLink = document.createElement("link");
      intLink.rel = "stylesheet";
      intLink.href = bwaInternalCssUrl;
      intLink.setAttribute(marker2, "");
      document.head.appendChild(intLink);
    } else {
      document.head.appendChild(intLink);
    }
    const fontsMarker = "data-bwa-fonts";
    if (!document.head.querySelector(`link[${fontsMarker}]`)) {
      const f = document.createElement("link");
      f.rel = "stylesheet";
      f.href = FONTS_HREF;
      f.setAttribute(fontsMarker, "");
      document.head.appendChild(f);
    }

    document.documentElement.classList.add("bwa-home-root");
    document.body.classList.add("bwa-home-root");
    const cleanupNav = initBwaNav(ref.current);

    return () => {
      cleanupNav();
      document.documentElement.classList.remove("bwa-home-root");
      document.body.classList.remove("bwa-home-root");
      // As folhas .bwa são mantidas de propósito no <head>: remover e recriar o
      // <link> a cada navegação entre internas abre uma janela de repaint sem
      // estilo. O vazamento de paleta que isso poderia causar está coberto na
      // origem — /diagnostico injeta a própria folha por último e as LPs
      // definem o fundo com `body:has(.bw-lp)`, de especificidade maior.
    };
  }, []);

  return (
    <div ref={ref}>
      <a className="bwa-skip" href="#main">Pular para o conteúdo</a>

      <header className="bwa-nav bwa-nav--internal" data-nav>
        <div className="bwa-shell bwa-nav-inner">
          <a className="bwa-wordmark" href="/" aria-label="Bewild, início">
            <BewildLogo decorative />
          </a>

          <nav className="bwa-nav-links" aria-label="Navegação principal">
            <a href="/#para-quem">Para quem</a>
            <a href="/#certeza">Como trabalhamos</a>
            <a href="/#depoimentos">Depoimentos</a>
            <a href="/portfolio">Projetos</a>
            <a href="/marcenaria">Marcenaria</a>
            <a href="/como-funciona">Como funciona</a>
            <a href="/conteudos">Blog</a>
            <a href="/guia-do-investidor">Guia do Investidor</a>
            <a href="/faq">FAQ</a>
            <a href="/contato">Contato</a>
          </nav>

          <a className="bwa-button" href={withUtm("/orcamento")}>
            Solicitar orçamento
            <span aria-hidden="true">→</span>
          </a>

          <button
            className="bwa-menu-button"
            type="button"
            aria-label="Abrir menu"
            aria-expanded="false"
            aria-controls="bwa-mobile-menu"
            data-menu-button
          >
            <span></span>
          </button>
        </div>
      </header>

      <div className="bwa-mobile-menu" id="bwa-mobile-menu" data-mobile-menu>
        <nav aria-label="Navegação mobile">
          <a href="/#para-quem">Para quem</a>
          <a href="/#certeza">Como trabalhamos</a>
          <a href="/#depoimentos">Depoimentos</a>
          <a href="/portfolio">Projetos</a>
          <a href="/marcenaria">Marcenaria</a>
          <a href="/como-funciona">Como funciona</a>
          <a href="/conteudos">Blog</a>
          <a href="/guia-do-investidor">Guia do Investidor</a>
          <a href="/faq">FAQ</a>
          <a href="/contato">Contato</a>
          <a href={withUtm("/orcamento")}>Solicitar orçamento</a>
        </nav>
      </div>
    </div>
  );
}
