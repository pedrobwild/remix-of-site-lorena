/**
 * Header — Be Wild
 * Light mode editorial + navbar scroll (transparente → cream).
 * Padrão: Guesty (backdrop-blur transparente) + Mynd (solid ao scroll)
 * Sprint B — adicionado dropdown "Conteúdos" com postagens recentes
 */

import { useState, useRef, useEffect } from "react";
import { ArrowRight, ChevronDown, Clock, BookOpen } from "lucide-react";
import { navigate } from "../../lib/useHashRoute";
import { NAV_LINKS, whatsappHref } from "./content";
import { useNavbarScroll } from "../../lib/useNavbarScroll";
import { listConteudos } from "../../lib/conteudoData";

/* ─── Postagens para o dropdown (3 mais recentes) ─────────── */
const DROPDOWN_POSTS = listConteudos().slice(0, 3);

/* ─── Dropdown de Conteúdos ───────────────────────────────── */
function ConteudosDropdown({
  scrolled,
  onNavigate,
}: {
  scrolled: boolean;
  onNavigate: (href: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        className={`bw-navbar-link text-sm font-medium transition-colors duration-[160ms] flex items-center gap-1.5 ${
          scrolled
            ? "!text-bewild-text-body hover:!text-bewild-gold"
            : "!text-white/85 hover:!text-white"
        }`}
      >
        Conteúdos
        <ChevronDown
          className="h-3.5 w-3.5 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0)" }}
        />
      </button>

      {/* Dropdown panel */}
      <div
        className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-80 overflow-hidden"
        style={{
          borderRadius: "1rem",
          background: "#fff",
          boxShadow:
            "0 16px 48px rgba(10,17,30,0.16), 0 2px 8px rgba(10,17,30,0.08)",
          border: "1px solid var(--bw-cream-200, #E9E2D5)",
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0)" : "translateY(-8px)",
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.2s ease, transform 0.2s ease",
          zIndex: 100,
        }}
        onMouseLeave={() => setOpen(false)}
      >
        {/* Header do dropdown */}
        <div
          className="px-4 py-3 border-b"
          style={{ borderColor: "var(--bw-cream-200, #E9E2D5)", background: "var(--bw-cream, #F7F4EF)" }}
        >
          <p className="text-xs font-mono uppercase tracking-[0.12em] text-bewild-text-muted">
            Últimas publicações
          </p>
        </div>

        {/* Posts */}
        <div className="py-1">
          {DROPDOWN_POSTS.map((post) => (
            <button
              key={post.slug}
              onClick={() => {
                setOpen(false);
                navigate(`/conteudos/${post.slug}`);
              }}
              className="w-full text-left px-4 py-3.5 hover:bg-bewild-cream transition-colors duration-150 group"
            >
              <p className="text-sm font-medium text-bewild-ink leading-snug mb-1.5 group-hover:text-bewild-gold transition-colors line-clamp-2">
                {post.titulo}
              </p>
              <div className="flex items-center gap-3 text-xs text-bewild-text-muted">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {post.tempoLeitura}
                </span>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                  style={{ background: "var(--bw-cream-200, #E9E2D5)" }}
                >
                  {post.categoria}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Footer: Ver todos */}
        <div
          className="px-4 py-3 border-t"
          style={{ borderColor: "var(--bw-cream-200, #E9E2D5)" }}
        >
          <button
            onClick={() => {
              setOpen(false);
              onNavigate("/conteudos");
            }}
            className="w-full flex items-center justify-between text-sm font-semibold text-bewild-gold hover:text-bewild-ink transition-colors group"
          >
            <span className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Ver todos os conteúdos
            </span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Header principal ────────────────────────────────────── */
export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileConteudosOpen, setMobileConteudosOpen] = useState(false);
  const { scrolled } = useNavbarScroll(60);

  const handleNav = (href: string) => {
    const path = href.replace(/^#/, "");
    navigate(path);
    setMenuOpen(false);
    setMobileConteudosOpen(false);
  };

  // Links exceto "Conteúdos" (tratado separado com dropdown)
  const navLinksWithoutConteudos = NAV_LINKS.filter(
    (l) => l.href !== "/conteudos"
  );

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
            {navLinksWithoutConteudos.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNav(link.href)}
                className={`bw-navbar-link text-sm font-medium transition-colors duration-[160ms] ${
                  scrolled
                    ? "!text-bewild-text-body hover:!text-bewild-gold"
                    : "!text-white/85 hover:!text-white"
                }`}
              >
                {link.label}
              </button>
            ))}
            {/* Dropdown Conteúdos */}
            <ConteudosDropdown scrolled={scrolled} onNavigate={handleNav} />
          </nav>

          {/* CTAs desktop */}
          <div className="hidden lg:flex items-center gap-3">
            <a
              href={whatsappHref("Olá, quero conversar sobre meu imóvel.")}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-sm font-semibold transition-colors duration-[160ms] ${
                scrolled
                  ? "text-bewild-text-body hover:text-bewild-gold"
                  : "text-white/80 hover:text-white"
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

          {/* Hamburguer mobile */}
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
          menuOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-3 pointer-events-none"
        }`}
      >
        <div
          className="mx-4 rounded-2xl border border-bewild-cream-200 bg-bewild-cream shadow-bewild-premium overflow-hidden"
          style={{ boxShadow: "var(--bw-shadow-modal)" }}
        >
          <nav className="p-4 flex flex-col gap-1">
            {navLinksWithoutConteudos.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNav(link.href)}
                className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-bewild-text-body hover:bg-bewild-parchment hover:text-bewild-ink transition-colors duration-[160ms]"
              >
                {link.label}
              </button>
            ))}

            {/* Conteúdos com sub-links mobile */}
            <div>
              <button
                onClick={() => setMobileConteudosOpen((v) => !v)}
                className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-bewild-text-body hover:bg-bewild-parchment hover:text-bewild-ink transition-colors duration-[160ms] flex items-center justify-between"
              >
                Conteúdos
                <ChevronDown
                  className="h-4 w-4 text-bewild-text-muted transition-transform duration-200"
                  style={{ transform: mobileConteudosOpen ? "rotate(180deg)" : "rotate(0)" }}
                />
              </button>

              {/* Sub-links */}
              <div
                className="overflow-hidden transition-all duration-300"
                style={{ maxHeight: mobileConteudosOpen ? "400px" : "0" }}
              >
                <div className="pl-4 pb-1 space-y-0.5">
                  {DROPDOWN_POSTS.map((post) => (
                    <button
                      key={post.slug}
                      onClick={() => handleNav(`/conteudos/${post.slug}`)}
                      className="w-full text-left px-4 py-2.5 rounded-xl text-xs text-bewild-text-muted hover:bg-bewild-parchment hover:text-bewild-ink transition-colors duration-[160ms] line-clamp-2"
                    >
                      {post.titulo}
                    </button>
                  ))}
                  <button
                    onClick={() => handleNav("/conteudos")}
                    className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold text-bewild-gold hover:bg-bewild-parchment transition-colors duration-[160ms] flex items-center gap-1.5"
                  >
                    Ver todos <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </nav>

          <div className="px-4 pb-4 pt-1 border-t border-bewild-cream-200 mt-1">
            <button
              onClick={() => {
                navigate("/diagnostico");
                setMenuOpen(false);
              }}
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
