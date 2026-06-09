/**
 * Header — Be Wild
 * Light mode editorial + navbar scroll (transparente → cream).
 * Padrão: Guesty (backdrop-blur transparente) + Mynd (solid ao scroll)
 * Sprint A — Redesign completo
 */

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { navigate } from "../../lib/useHashRoute";
import { NAV_LINKS, whatsappHref } from "./content";
import { useNavbarScroll } from "../../lib/useNavbarScroll";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrolled } = useNavbarScroll(60);

  const handleNav = (href: string) => {
    const path = href.replace(/^#/, "");
    navigate(path);
    setMenuOpen(false);
  };

  return (
    <>
      <header
        className={`bw-navbar ${scrolled ? "bw-navbar--scrolled" : "bw-navbar--transparent"}`}
      >
        <div className="mx-auto w-full max-w-[76rem] px-5 sm:px-8 flex items-center justify-between h-full">
          {/* Logo */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 flex-shrink-0"
            aria-label="Be Wild — página inicial"
          >
            <span
              className={`text-lg font-bold tracking-tight transition-colors duration-[260ms] ${
                scrolled ? "text-bewild-ink" : "text-white"
              }`}
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Be Wild
            </span>
          </button>

          {/* Nav desktop */}
          <nav className="hidden lg:flex items-center gap-8" aria-label="Navegação principal">
            {NAV_LINKS.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNav(link.href)}
                className={`bw-navbar-link text-sm font-medium transition-colors duration-[160ms] ${
                  scrolled ? "!text-bewild-text-body hover:!text-bewild-gold" : "!text-white/85 hover:!text-white"
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* CTAs desktop */}
          <div className="hidden lg:flex items-center gap-3">
            <a
              href={whatsappHref("Olá, quero conversar sobre meu imóvel.")}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-sm font-semibold transition-colors duration-[160ms] ${
                scrolled ? "text-bewild-text-body hover:text-bewild-gold" : "text-white/80 hover:text-white"
              }`}
            >
              Falar no WhatsApp
            </a>
            <button
              onClick={() => navigate("/diagnostico")}
              className="bw-btn-dark inline-flex items-center gap-2 text-sm"
              style={{ padding: "10px 22px" }}
            >
              Diagnosticar meu imóvel
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Hamburguer mobile — Guesty-style (3 linhas → × ao abrir) */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`lg:hidden p-2 rounded-lg transition-colors duration-[160ms] ${
              scrolled ? "text-bewild-ink" : "text-white"
            }`}
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
          >
            <div className="relative h-5 w-5">
              <span
                className={`absolute left-0 h-0.5 w-5 bg-current rounded-full transition-all duration-[260ms] ease-out ${
                  menuOpen ? "top-2.5 rotate-45" : "top-1"
                }`}
              />
              <span
                className={`absolute left-0 top-2.5 h-0.5 w-5 bg-current rounded-full transition-all duration-[260ms] ease-out ${
                  menuOpen ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`absolute left-0 h-0.5 w-5 bg-current rounded-full transition-all duration-[260ms] ease-out ${
                  menuOpen ? "top-2.5 -rotate-45" : "top-4"
                }`}
              />
            </div>
          </button>
        </div>
      </header>

      {/* Menu mobile */}
      <div
        className={`fixed inset-x-0 top-[68px] z-40 lg:hidden transition-all duration-[300ms] ease-out ${
          menuOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-3 pointer-events-none"
        }`}
      >
        <div
          className="mx-4 rounded-2xl border border-bewild-cream-200 bg-bewild-cream shadow-bewild-premium overflow-hidden"
          style={{ boxShadow: "var(--bw-shadow-modal)" }}
        >
          <nav className="p-4 flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNav(link.href)}
                className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-bewild-text-body hover:bg-bewild-parchment hover:text-bewild-ink transition-colors duration-[160ms]"
              >
                {link.label}
              </button>
            ))}
          </nav>
          <div className="px-4 pb-4 pt-1 border-t border-bewild-cream-200 mt-1">
            <button
              onClick={() => { navigate("/diagnostico"); setMenuOpen(false); }}
              className="w-full bw-btn-dark text-sm font-bold justify-center"
              style={{ borderRadius: "8px", padding: "12px 24px" }}
            >
              Diagnosticar meu imóvel <ArrowRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Overlay do menu mobile */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden bg-black/20 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </>
  );
}
