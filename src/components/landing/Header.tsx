import { useEffect, useState } from "react";
import { Menu, X, MessageCircle, ChevronDown, ArrowRight } from "lucide-react";
import { BewildLogo } from "./primitives";
import { NAV_LINKS, whatsappHref } from "./content";

const CONTENT_DROPDOWN = [
  { label: "Todos os artigos", href: "/blog" },
  { label: "Tags", href: "/blog/tags" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [contentOpen, setContentOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isLight = scrolled || open;
  const tone = isLight ? "dark" : "light";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        isLight
          ? "border-b border-bewild-ink/10 bg-[rgba(251,250,248,0.9)] backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-wrap items-center justify-between px-5 sm:h-[4.5rem] sm:px-8">
        <a href="/" className="flex items-center gap-2" aria-label="BeWild — início">
          <BewildLogo heightClass="h-6 sm:h-7" tone={tone} />
        </a>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Navegação principal">
          {NAV_LINKS.map((link) =>
            link.label === "Conteúdos" ? (
              <div
                key={link.href}
                className="relative"
                onMouseEnter={() => setContentOpen(true)}
                onMouseLeave={() => setContentOpen(false)}
              >
                <a
                  href={link.href}
                  className={`inline-flex items-center gap-1 text-sm font-medium transition-colors ${
                    isLight ? "text-bewild-ink/80 hover:text-bewild-blue" : "text-white/80 hover:text-white"
                  }`}
                >
                  {link.label} <ChevronDown className="h-3.5 w-3.5" />
                </a>
                {contentOpen && (
                  <div className="absolute left-0 top-full pt-2">
                    <div className="min-w-[180px] rounded-xl border border-bewild-ink/10 bg-white p-2 shadow-[0_24px_60px_-24px_rgba(10,37,64,0.18)]">
                      {CONTENT_DROPDOWN.map((d) => (
                        <a
                          key={d.href}
                          href={d.href}
                          className="block rounded-lg px-3 py-2 text-sm text-bewild-ink/80 hover:bg-bewild-bone hover:text-bewild-blue"
                        >
                          {d.label}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <a
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  isLight ? "text-bewild-ink/80 hover:text-bewild-blue" : "text-white/80 hover:text-white"
                }`}
              >
                {link.label}
              </a>
            )
          )}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a
            href={whatsappHref()}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Falar no WhatsApp"
            className={`text-sm font-medium transition-colors ${
              isLight ? "text-bewild-ink/70 hover:text-bewild-blue" : "text-white/75 hover:text-white"
            }`}
          >
            <MessageCircle className="inline h-4 w-4" /> WhatsApp
          </a>
          <a
            href="/diagnostico"
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-bewild-blue px-[1.7rem] py-2.5 text-[0.95rem] font-semibold text-white shadow-[0_14px_34px_-14px_rgba(0,76,127,0.55)] transition-all hover:bg-[#005C99] hover:-translate-y-0.5"
          >
            Solicitar diagnóstico
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          className={`inline-flex h-10 w-10 items-center justify-center rounded-full border lg:hidden ${
            isLight ? "border-bewild-ink/15 text-bewild-ink" : "border-white/20 text-white"
          }`}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden">
          <nav
            className="flex flex-col gap-1 border-t border-bewild-ink/10 bg-white px-5 pb-8 pt-4"
            aria-label="Navegação (mobile)"
          >
            {NAV_LINKS.map((link, i) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex items-baseline gap-3 rounded-xl px-3 py-3 text-lg font-display font-semibold text-bewild-ink hover:bg-bewild-bone"
              >
                <span className="font-mono text-[0.6rem] text-[#C9A24B] tracking-[0.28em]">
                  0{i + 1}
                </span>
                {link.label}
              </a>
            ))}
            <div className="mt-3 flex flex-col gap-2">
              <a
                href="/diagnostico"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-bewild-blue px-5 py-3 text-sm font-semibold text-white"
              >
                Solicitar diagnóstico <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href={whatsappHref()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-bewild-ink/20 px-5 py-3 text-sm font-semibold text-bewild-ink"
              >
                <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
