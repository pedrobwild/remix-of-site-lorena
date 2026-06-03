import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Images, Pause, Play } from "lucide-react";
import { Container, Chip, CTAButton } from "./primitives";
import { HERO } from "./content";

// Variantes geradas em /public/images/hero-slides/<stem>-{sm,md,lg}.{avif,webp,jpg}
// sm=640w, md=1280w, lg=1920w. Browser escolhe a melhor pelo srcset+sizes.
const SLIDE_SIZES = "(max-width: 640px) 100vw, (max-width: 1280px) 100vw, 1920px";

type HeroSlide = { stem: string; label: string };

const HERO_SLIDES: HeroSlide[] = [
  { stem: "erik-03-8-1", label: "Studio reformado por Erik" },
  { stem: "erik-03-11", label: "Detalhe de marcenaria em studio Erik" },
  { stem: "premium-11-2", label: "Acabamento premium em sala integrada" },
  { stem: "premium-7-4", label: "Cozinha premium com marcenaria sob medida" },
  { stem: "rodrigo-15-1", label: "Sala de studio Rodrigo" },
  { stem: "rodrigo-8", label: "Ambiente integrado studio Rodrigo" },
  { stem: "rodrigo-1-1", label: "Detalhe de iluminação studio Rodrigo" },
  { stem: "marcos-6-2", label: "Ambiente studio Marcos" },
  { stem: "marcos-10-4", label: "Cozinha studio Marcos" },
];

const slideUrl = (stem: string, size: "sm" | "md" | "lg", ext: "avif" | "webp" | "jpg") =>
  `/images/hero-slides/${stem}-${size}.${ext}`;
const buildSrcSet = (stem: string, ext: "avif" | "webp" | "jpg") =>
  `${slideUrl(stem, "sm", ext)} 640w, ${slideUrl(stem, "md", ext)} 1280w, ${slideUrl(stem, "lg", ext)} 1920w`;

const SLIDE_INTERVAL = 5500;

export default function HeroSection() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const prefersReducedMotionRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    prefersReducedMotionRef.current = mq.matches;
    if (mq.matches) setIsPaused(true);
    const onChange = (e: MediaQueryListEvent) => {
      prefersReducedMotionRef.current = e.matches;
      if (e.matches) setIsPaused(true);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % HERO_SLIDES.length);
    }, SLIDE_INTERVAL);
    return () => window.clearInterval(interval);
  }, [isPaused]);

  const goTo = useCallback((index: number) => {
    setActiveSlide(((index % HERO_SLIDES.length) + HERO_SLIDES.length) % HERO_SLIDES.length);
  }, []);
  const goPrev = useCallback(() => goTo(activeSlide - 1), [activeSlide, goTo]);
  const goNext = useCallback(() => goTo(activeSlide + 1), [activeSlide, goTo]);

  return (
    <section
      id="topo"
      aria-roledescription="carousel"
      aria-label="Reformas entregues pela bewild"
      className="relative overflow-hidden bg-bewild-ink pt-28 pb-16 sm:pt-32 md:pb-24"
    >
      <div className="absolute inset-0" aria-hidden="true">
        {HERO_SLIDES.map((slide, index) => {
          // Eager-load only the first slide (LCP). Preload the next one to keep
          // transitions smooth; defer the rest with native lazy loading.
          const isLCP = index === 0;
          const isNext = index === (activeSlide + 1) % HERO_SLIDES.length;
          const shouldEagerLoad = isLCP || index === activeSlide || isNext;
          return (
            <picture key={slide.stem}>
              <source type="image/avif" srcSet={buildSrcSet(slide.stem, "avif")} sizes={SLIDE_SIZES} />
              <source type="image/webp" srcSet={buildSrcSet(slide.stem, "webp")} sizes={SLIDE_SIZES} />
              <img
                src={slideUrl(slide.stem, "md", "jpg")}
                srcSet={buildSrcSet(slide.stem, "jpg")}
                sizes={SLIDE_SIZES}
                alt=""
                aria-hidden="true"
                draggable={false}
                decoding="async"
                loading={shouldEagerLoad ? "eager" : "lazy"}
                fetchPriority={isLCP ? "high" : "low"}
                width={1920}
                height={1080}
                className="absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-[1600ms] ease-in-out motion-reduce:transition-none"
                style={{ opacity: activeSlide === index ? 1 : 0 }}
              />
            </picture>
          );
        })}
        {/* Base darkening for legibility on every image */}
        <div className="absolute inset-0 bg-bewild-ink/45 sm:bg-bewild-ink/35" />
        {/* Left-side gradient ensuring text contrast */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(10,17,30,0.92) 0%, rgba(10,17,30,0.78) 45%, rgba(10,17,30,0.55) 75%, rgba(10,17,30,0.7) 100%)",
          }}
        />
        {/* Bottom vignette for indicators/controls */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, transparent 55%, rgba(10,17,30,0.55) 100%), radial-gradient(900px 520px at 78% 0%, rgba(30,91,184,0.38), transparent 60%)",
          }}
        />
      </div>

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Live region for screen readers */}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        Slide {activeSlide + 1} de {HERO_SLIDES.length}: {HERO_SLIDES[activeSlide].label}
      </p>

      <Container className="relative">
        <div className="flex min-h-[70vh] flex-col justify-center gap-7 py-6">
          <h1 className="max-w-3xl font-display text-[2.1rem] font-semibold leading-[1.08] tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)] sm:text-5xl md:text-[3.4rem]">
            Reformas turn-key para transformar studios em{" "}
            <span className="text-bewild-blue-400">imóveis prontos para rentabilizar.</span>
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-white/90 drop-shadow-[0_1px_8px_rgba(0,0,0,0.4)] sm:text-lg">
            Projeto de arquitetura personalizado, obra, marcenaria, mobiliário e tecnologia de
            acompanhamento em um processo único — para você não precisar virar gerente da própria
            reforma.
          </p>

          <p className="max-w-xl text-sm font-medium text-white/80 drop-shadow-[0_1px_6px_rgba(0,0,0,0.4)]">
            Da entrega das chaves ao imóvel pronto para foto, anúncio e operação.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <CTAButton href="#diagnostico" variant="primary">
              Solicitar diagnóstico do imóvel <ArrowRight className="h-4 w-4" />
            </CTAButton>
            <CTAButton href="#cases" variant="ghost" className="bg-bewild-ink/40 backdrop-blur-sm">
              <Images className="h-4 w-4" /> Ver reformas entregues
            </CTAButton>
          </div>

          {HERO.chips.length > 0 && (
            <ul className="flex flex-wrap gap-2 pt-1">
              {HERO.chips.map((chip) => (
                <li key={chip}>
                  <Chip>{chip}</Chip>
                </li>
              ))}
            </ul>
          )}

          {/* Slideshow controls */}
          <div
            className="flex flex-wrap items-center gap-3 pt-2"
            role="group"
            aria-label="Controles do slideshow"
          >
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={goPrev}
                aria-label="Slide anterior"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-bewild-ink/50 text-white backdrop-blur-sm transition hover:bg-bewild-ink/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bewild-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-bewild-ink"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsPaused((p) => !p)}
                aria-label={isPaused ? "Reproduzir slideshow" : "Pausar slideshow"}
                aria-pressed={isPaused}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-bewild-ink/50 text-white backdrop-blur-sm transition hover:bg-bewild-ink/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bewild-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-bewild-ink"
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label="Próximo slide"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-bewild-ink/50 text-white backdrop-blur-sm transition hover:bg-bewild-ink/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bewild-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-bewild-ink"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div
              className="flex items-center gap-1.5"
              role="tablist"
              aria-label="Selecionar slide"
            >
              {HERO_SLIDES.map((slide, index) => {
                const active = activeSlide === index;
                return (
                  <button
                    key={slide.stem}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-label={`Ir para slide ${index + 1}: ${slide.label}`}
                    tabIndex={active ? 0 : -1}
                    onClick={() => goTo(index)}
                    className="group flex h-6 items-center px-1 focus-visible:outline-none"
                  >
                    <span
                      className={`block h-1.5 rounded-full transition-all duration-500 group-focus-visible:ring-2 group-focus-visible:ring-bewild-blue-400 group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-bewild-ink ${
                        active ? "w-8 bg-bewild-blue-400" : "w-2 bg-white/50 group-hover:bg-white/70"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
