import { useEffect, useRef, type ReactNode } from "react";
import { openCookiePreferences } from "@/lib/cookieConsent";
import homeBwaCssUrl from "../pages/home-bwa.css?url";
import bwaInternalCssUrl from "../pages/bwa-internal.css?url";
// @ts-expect-error - JS module sem tipos
import { initBwaNav } from "../pages/home-bwa-script.js";

const FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Manrope:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,500&display=swap";

/**
 * BwaSharedChrome — nav + main slot + footer no design .bwa,
 * usado por todas as páginas internas (FAQ, Portfólio, Conteúdos, Diagnóstico
 * e páginas de detalhe). Injeta home-bwa.css + bwa-internal.css como
 * ÚLTIMAS folhas do <head> (para vencer o preflight/tema legado),
 * reaproveita o guard de idempotência do nav (data-bwa-nav-inited) e
 * remove tudo no unmount para não vazar paleta para rotas antigas.
 */
export default function BwaSharedChrome({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1) Fontes + folhas .bwa como últimas no <head>
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

    // 2) Inicializa nav (idempotente)
    initBwaNav(rootRef.current ?? document);

    return () => {
      document.documentElement.classList.remove("bwa-home-root");
      document.body.classList.remove("bwa-home-root");
      homeLink?.parentNode?.removeChild(homeLink);
      intLink?.parentNode?.removeChild(intLink);
    };
  }, []);

  return (
    <div ref={rootRef}>
      <a className="bwa-skip" href="#conteudo">Pular para o conteúdo</a>

      {/* MENU atualizado 17/jul por ordem do dono: páginas internas integradas */}
      <header className="bwa-nav bwa-nav--internal" data-nav>
        <div className="bwa-shell bwa-nav-inner">
          <a className="bwa-wordmark" href="/" aria-label="Bewild, início">Bewild</a>

          <nav className="bwa-nav-links" aria-label="Navegação principal">
            <a href="/#certeza">O contrato</a>
            <a href="/#historia">A história</a>
            <a href="/#projetos">Projetos</a>
            <a href="/#workflow">Bwild Workflow</a>
            <a href="/#prova">Prova</a>
            <a href="/portfolio">Portfólio</a>
            <a href="/conteudos">Conteúdos</a>
            <a href="/faq">FAQ</a>
          </nav>

          <a className="bwa-button" href="/diagnostico">
            Solicitar Orçamento
            <span aria-hidden="true">→</span>
          </a>

          <button
            className="bwa-menu-button"
            type="button"
            aria-label="Abrir menu"
            aria-expanded="false"
            data-menu-button
          >
            <span></span>
          </button>
        </div>
      </header>

      <div className="bwa-mobile-menu" data-mobile-menu>
        <nav aria-label="Navegação mobile">
          <a href="/#certeza">O contrato</a>
          <a href="/#historia">A história</a>
          <a href="/#projetos">Projetos</a>
          <a href="/#oque-fazemos">O que fazemos</a>
          <a href="/#workflow">Bwild Workflow</a>
          <a href="/#prova">Prova</a>
          <a href="/#objetivos">Morar, alugar ou vender</a>
          <a href="/portfolio">Portfólio</a>
          <a href="/conteudos">Conteúdos</a>
          <a href="/faq">FAQ</a>
          <a href="/diagnostico">Solicitar Orçamento</a>
        </nav>
      </div>

      <main id="conteudo" className="bwa-internal-main">
        {children}
      </main>

      <footer className="bwa-footer">
        <div className="bwa-shell">
          <div className="bwa-footer-main">
            <div className="bwa-footer-brand">
              <div className="bwa-footer-wordmark">Bewild</div>
              <p>Seu desejo é uma obra.</p>
              <p>
                Reforma completa de studios em São Paulo. Projeto, obra, marcenaria,
                mobiliário e entrega num processo único.
              </p>
            </div>

            <div className="bwa-footer-column">
              <h3>Navegação</h3>
              <nav>
                <a href="/#certeza">O contrato</a>
                <a href="/#historia">A história</a>
                <a href="/#oque-fazemos">O que fazemos</a>
                <a href="/#como-funciona">Como funciona</a>
                <a href="/portfolio">Portfólio</a>
                <a href="/conteudos">Conteúdos</a>
                <a href="/faq">FAQ</a>
                <a href="/diagnostico">Diagnóstico</a>
              </nav>
            </div>

            <div className="bwa-footer-column">
              <h3>Contato</h3>
              <div>
                <span>WhatsApp</span>
                <span>Instagram</span>
                <span>LinkedIn</span>
                <span>e-mail</span>
                <a href="/privacidade">Política de privacidade</a>
                <button type="button" className="bwa-footer-cookie-prefs" onClick={openCookiePreferences}>Preferências de cookies</button>
              </div>
            </div>
          </div>

          <div className="bwa-footer-bottom">
            <p className="bwa-footer-tech">
              BEWILD · SÃO PAULO, BRASIL · CNPJ 47.350.338/0001-37 · RESP. TÉCNICO · THIAGO DANTAS DO AMOR · CAU A162437-7
            </p>
            <span className="bwa-footer-copy">© 2026 Bewild</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
