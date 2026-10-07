import { useEffect, useRef } from "react";
import BewildLogo from "@/components/BewildLogo";
import { whatsappHref } from "@/components/landing/content";
import { NAV_PARCEIROS } from "@/content/incorporadoras";
import { useIncorporadorasEnabled } from "@/lib/incorporadorasFlag";
import { withUtm } from "@/lib/utm";
import { BwaInternalStylesheets } from "@/components/BwaStylesheets";
import { keepBwaStylesheetsLast } from "@/lib/bwaStylesheetOrder";
import { initBwaNav } from "../pages/home-bwa-script";

/** Mesma mensagem do atalho do WhatsApp no menu da home (home-bwa-body.ts). */
const MENU_WHATSAPP_TEXT = "Olá, quero falar com a Bewild sobre meu apartamento";

/**
 * BwaNav — Header .bwa unificado (nav desktop + menu mobile), idêntico ao
 * da home. Carrega home-bwa.css + bwa-internal.css como ÚLTIMAS folhas do
 * <head> (para vencer preflight/temas legados) e inicializa initBwaNav
 * (idempotente, restrito a este componente). Usado em toda página pública
 * fora da home.
 *
 * As duas folhas saem no HTML do servidor por dois caminhos que apontam para
 * o mesmo recurso (o React não duplica): o `seoHead()` de cada rota
 * (src/lib/routeHead.ts) e este componente (BwaStylesheets.tsx), que cobre a
 * página 404 e qualquer rota cujo `head` não passe pelo `seoHead`. Antes
 * eram criadas num efeito, depois da hidratação, e a página aparecia primeiro
 * no tema escuro legado para só então trocar de tema e de layout.
 *
 * Menu mobile acessível (em home-bwa-script.ts): ao abrir, o foco vai para
 * o primeiro link, o Tab fica preso no header + menu e o resto da página
 * fica `inert`; Esc fecha e devolve o foco ao botão. Ao desmontar, o menu
 * fecha — a classe `bwa-menu-open` (que trava a rolagem do body) nunca
 * vaza para a próxima rota.
 */
export default function BwaNav() {
  const ref = useRef<HTMLDivElement>(null);
  // "Incorporadoras" só entra no menu com a flag ligada ou em prévia interna.
  const incorporadorasOn = useIncorporadorasEnabled();
  const itensParceiros = NAV_PARCEIROS.items.filter((item) => !item.gated || incorporadorasOn);

  useEffect(() => {
    // Navegação interna: o CSS da página nova entra no fim do <head>, depois
    // das folhas .bwa; elas voltam para o fim (na carga direta já estão lá).
    keepBwaStylesheetsLast();
    const cleanupNav = initBwaNav(ref.current);

    return () => {
      cleanupNav();
      // As folhas .bwa são mantidas de propósito no <head>: remover e recriar o
      // <link> a cada navegação entre internas abre uma janela de repaint sem
      // estilo. O vazamento de paleta que isso poderia causar está coberto na
      // origem — /diagnostico injeta a própria folha por último e as LPs
      // definem o próprio fundo (ver src/styles/bw-lp.css).
    };
  }, []);

  return (
    <div ref={ref}>
      <BwaInternalStylesheets />
      <a className="bwa-skip" href="#main">Pular para o conteúdo</a>

      <header className="bwa-nav bwa-nav--internal" data-nav>
        <div className="bwa-shell bwa-nav-inner">
          <a className="bwa-wordmark" href="/" aria-label="Bewild, início">
            <BewildLogo decorative variant="blue" />
          </a>

          <nav className="bwa-nav-links" aria-label="Navegação principal">
            <a href="/">Início</a>
            <a href="/servicos">Serviços</a>
            <a href="/#depoimentos">Depoimentos</a>
            <a href="/portfolio">Portfólio</a>
            <a href="/marcenaria">Marcenaria</a>
            <a href="/conteudos">Blog</a>
            <a href="/guia-do-investidor">Guia do Investidor</a>
            <a href="/faq">FAQ</a>
            {/* Disclosure, não role="menu": são links de navegação comuns. */}
            <div className="bwa-nav-dd" data-nav-dd>
              <button
                className="bwa-nav-dd-button"
                type="button"
                aria-expanded="false"
                aria-controls="bwa-nav-dd-parceiros"
                data-nav-dd-button
              >
                {NAV_PARCEIROS.label}
                <span className="bwa-nav-dd-chev" aria-hidden="true" />
              </button>
              <div className="bwa-nav-dd-panel" id="bwa-nav-dd-parceiros" data-nav-dd-panel>
                {itensParceiros.map((item) => (
                  <a key={item.href} href={item.href} data-cta={item.cta}>
                    <span className="bwa-nav-dd-title">{item.title}</span>
                    <span className="bwa-nav-dd-desc">{item.desc}</span>
                  </a>
                ))}
              </div>
            </div>
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
          <a href="/">Início</a>
          <a href="/servicos">Serviços</a>
          <a href="/#depoimentos">Depoimentos</a>
          <a href="/portfolio">Portfólio</a>
          <a href="/marcenaria">Marcenaria</a>
          <a href="/conteudos">Blog</a>
          <a href="/guia-do-investidor">Guia do Investidor</a>
          <a href="/faq">FAQ</a>
          <p className="bwa-menu-group-label">{NAV_PARCEIROS.label}</p>
          {itensParceiros.map((item) => (
            <a className="bwa-menu-sub" key={item.href} href={item.href} data-cta={item.cta}>
              {item.title}
            </a>
          ))}
          <a href="/contato">Contato</a>
        </nav>
        {/* Pé do menu (fixo ao rolar): o orçamento em destaque e o atalho do
            WhatsApp, iguais aos do menu da home. */}
        <div className="bwa-menu-actions">
          <a className="bwa-button bwa-button-light" href={withUtm("/orcamento")} data-cta="menu-orcamento">
            Solicitar orçamento <span aria-hidden="true">→</span>
          </a>
          <a
            className="bwa-button bwa-button-wa"
            href={whatsappHref(MENU_WHATSAPP_TEXT)}
            target="_blank"
            rel="noopener noreferrer"
            data-cta="menu-whatsapp"
          >
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
