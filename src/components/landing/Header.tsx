import { useEffect, useState } from "react";
import { Menu, X, MessageCircle, ChevronDown, ArrowRight } from "lucide-react";
import { BewildLogo } from "./primitives";
import { NAV_LINKS, whatsappHref } from "./content";
import { supabase } from "@/integrations/supabase/client";

type TopPost = {
  slug: string;
  title: string;
  excerpt: string | null;
  category: string | null;
};

type FeaturedCase = {
  slug: string;
  title: string;
  cover_url: string | null;
  result_text: string | null;
  portfolio_tags: string[] | null;
};

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [contentOpen, setContentOpen] = useState(false);
  const [portfolioOpen, setPortfolioOpen] = useState(false);
  const [featured, setFeatured] = useState<FeaturedCase[]>([]);
  const [pathname, setPathname] = useState<string>(() =>
    typeof window === "undefined" ? "/" : window.location.pathname,
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const onNav = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", onNav);
    window.addEventListener("hashchange", onNav);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("popstate", onNav);
      window.removeEventListener("hashchange", onNav);
    };
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("projects")
        .select("slug, title, cover_url, result_text, portfolio_tags")
        .eq("visible", true)
        .eq("featured", true)
        .order("featured_order", { ascending: true })
        .limit(4);
      setFeatured((data ?? []) as FeaturedCase[]);
    })();
  }, []);

  const isActive = (href: string) => {
    const base = href.split("#")[0] || "/";
    if (base === "/") return pathname === "/";
    return pathname === base || pathname.startsWith(base + "/");
  };


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
            ) : link.label === "Portfólio" && featured.length > 0 ? (
              <div
                key={link.href}
                className="relative"
                onMouseEnter={() => setPortfolioOpen(true)}
                onMouseLeave={() => setPortfolioOpen(false)}
              >
                <a
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  aria-haspopup="true"
                  aria-expanded={portfolioOpen}
                  className={`inline-flex items-center gap-1 text-sm transition-colors ${
                    isActive(link.href)
                      ? isLight
                        ? "font-semibold text-bewild-ink"
                        : "font-semibold text-white"
                      : "font-medium " +
                        (isLight ? "text-bewild-ink/80 hover:text-bewild-blue" : "text-white/80 hover:text-white")
                  }`}
                >
                  {link.label} <ChevronDown className="h-3.5 w-3.5" />
                </a>
                {portfolioOpen && (
                  <div className="absolute left-1/2 top-full -translate-x-1/2 pt-3">
                    <div className="w-[min(92vw,720px)] rounded-2xl border border-bewild-ink/10 bg-white p-5 shadow-[0_30px_80px_-24px_rgba(10,37,64,0.22)]">
                      <div className="mb-3 flex items-baseline justify-between">
                        <span className="font-mono text-[0.6rem] uppercase tracking-[0.24em] text-[#C9A24B]">
                          Cases em destaque
                        </span>
                        <a
                          href="/portfolio"
                          className="text-xs font-medium text-bewild-blue hover:underline"
                        >
                          Ver todos →
                        </a>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {featured.map((c) => (
                          <a
                            key={c.slug}
                            href={`/portfolio#${c.slug}`}
                            className="group flex gap-3 rounded-xl p-2 transition-colors hover:bg-bewild-bone"
                          >
                            <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-bewild-ink/10">
                              {c.cover_url ? (
                                <img
                                  src={c.cover_url}
                                  alt=""
                                  loading="lazy"
                                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                />
                              ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-bewild-blue/40 to-bewild-ink" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-display text-sm font-semibold text-bewild-ink group-hover:text-bewild-blue">
                                {c.title}
                              </p>
                              {c.portfolio_tags && c.portfolio_tags.length > 0 && (
                                <p className="mt-0.5 truncate font-mono text-[0.6rem] uppercase tracking-[0.16em] text-bewild-ink/55">
                                  {c.portfolio_tags.slice(0, 2).join(" · ")}
                                </p>
                              )}
                              {c.result_text && (
                                <p className="mt-1 line-clamp-2 text-xs leading-snug text-bewild-ink/70">
                                  {c.result_text}
                                </p>
                              )}
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <a
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={`text-sm transition-colors ${
                  isActive(link.href)
                    ? isLight
                      ? "font-semibold text-bewild-ink"
                      : "font-semibold text-white"
                    : "font-medium " +
                      (isLight ? "text-bewild-ink/80 hover:text-bewild-blue" : "text-white/80 hover:text-white")
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
