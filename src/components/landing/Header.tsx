import { useEffect, useState } from "react";
import { Menu, X, MessageCircle } from "lucide-react";
import { BewildLogo } from "./primitives";
import { NAV_LINKS, whatsappHref } from "./content";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Trava o scroll do body quando o menu mobile está aberto.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled || open
          ? "border-b border-white/10 bg-bewild-ink/85 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-wrap items-center justify-between px-5 sm:h-[4.5rem] sm:px-8">
        <a href="#topo" className="flex items-center gap-2" aria-label="bewild — início">
          <BewildLogo heightClass="h-6 sm:h-7" />
        </a>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Navegação principal">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-white/75 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a
            href={whatsappHref()}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Falar com especialista no WhatsApp"
            className="text-sm font-medium text-white/75 transition-colors hover:text-white"
          >
            <MessageCircle className="inline h-4 w-4" aria-hidden="true" /> WhatsApp
          </a>
          <a
            href="#diagnostico"
            className="inline-flex items-center justify-center rounded-full bg-bewild-blue px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-bewild-blue-600 hover:-translate-y-0.5"
          >
            Solicitar diagnóstico
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white lg:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Menu mobile */}
      {open && (
        <div className="lg:hidden">
          <nav
            className="flex flex-col gap-1 border-t border-white/10 bg-bewild-ink/95 px-5 pb-8 pt-4 backdrop-blur-xl"
            aria-label="Navegação principal (mobile)"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 text-base font-medium text-white/85 transition-colors hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-3 flex flex-col gap-2">
              <a
                href="#diagnostico"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center rounded-full bg-bewild-blue px-5 py-3 text-sm font-semibold text-white"
              >
                Solicitar diagnóstico
              </a>
              <a
                href={whatsappHref()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white"
              >
                <MessageCircle className="h-4 w-4" /> Falar com especialista
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
