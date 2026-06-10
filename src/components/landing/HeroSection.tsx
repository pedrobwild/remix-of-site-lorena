import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Images, Pause, Play, ShieldCheck } from "lucide-react";
import { Container, CTAButton } from "./primitives";

// ──────────────────────────────────────────────────────────────────
// HeroSection — versão rebrand (petróleo #004C7F + Playfair serif)
// Mantém o carrossel original; muda tipografia, cor e adiciona selo.
// ──────────────────────────────────────────────────────────────────

const SLIDE_SIZES = "(max-width: 640px) 100vw, (max-width: 1280px) 100vw, 1920px";

type HeroSlide = { stem: string; label: string };

const HERO_SLIDES: HeroSlide[] = [
  { stem: "erik-03-8-1", label: "Studio reformado por Erik" },
  { stem: "premium-11-2", label: "Acabamento premium em sala integrada" },
  { stem: "premium-7-4", label: "Cozinha premium com marcenaria sob medida" },
  { stem: "rodrigo-15-1", label: "Sala de studio Rodrigo" },
  { stem: "rodrigo-8", label: "Ambiente integrado studio Rodrigo" },
  { stem: "marcos-6-2", label: "Ambiente studio Marcos" },
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
        <div className="absolute inset-0 bg-bewild-ink/25 sm:bg-bewild-ink/20" />
        {/* Gradiente petróleo do lado do texto (era genérico #0A111E) */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(10,37,64,0.78) 0%, rgba(10,37,64,0.5) 38%, rgba(10,37,64,0.15) 62%, rgba(10,37,64,0) 100%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, transparent 65%, rgba(10,37,64,0.45) 100%), radial-gradient(900px 520px at 78% 0%, rgba(0,106,168,0.10), transparent 60%)",
          }}
        />
      </div>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        Slide {activeSlide + 1} de {HERO_SLIDES.length}: {HERO_SLIDES[activeSlide].label}
      </p>

      <Container className="relative">
        <div className="flex min-h-[70vh] flex-col justify-center gap-7 py-6">

          {/* ── SELO GOLD — prova, não botão. Novo papel do ouro. ── */}
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-bewild-gold/40 bg-bewild-gold/10 px-3.5 py-1.5 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-bewild-gold-400 backdrop-blur-sm">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Reforma + operação · ciclo completo
          </span>

          {/* ── TÍTULO — Playfair serif via font-display (bug corrigido). ── */}
          <h1 className="max-w-3xl font-display text-[2.2rem] font-semibold leading-[1.1] tracking-[-0.005em] text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.5)] sm:text-5xl md:text-[3.5rem]">
            Seu studio cru, transformado em{" "}
            <span className="text-bewild-blue-400">ativo pronto para render.</span>
          </h1>

          {/* Corpo segue em Poppins (font-body herdada). */}
          <p className="max-w-xl text-base leading-relaxed text-white/90 drop-shadow-[0_1px_8px_rgba(0,0,0,0.45)] sm:text-lg">
            Projeto de arquitetura, obra, marcenaria, mobiliário e setup em um processo único —
            e, se você quiser, a operação completa no Airbnb depois da entrega.
            Você não vira gerente de obra nem de hóspede.
          </p>

          <p className="max-w-xl text-sm font-medium text-white/75 drop-shadow-[0_1px_6px_rgba(0,0,0,0.4)]">
            Da entrega das chaves ao imóvel rendendo no short stay.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* CTA primário — petróleo sólido (CTAButton variant primary já atualizado) */}
            <CTAButton href="#diagnostico" variant="primary">
              Solicitar diagnóstico do imóvel <ArrowRight className="h-4 w-4" />
            </CTAButton>
            <CTAButton href="#cases" variant="ghost" className="bg-bewild-ink/40 backdrop-blur-sm">
              <Images className="h-4 w-4" /> Ver reformas entregues
            </CTAButton>
          </div>

          {/* Controles do slideshow — accent petróleo claro (era blue-400 antigo) */}
          <div className="flex flex-wrap items-center gap-3 pt-2" role="group" aria-label="Controles do slideshow">
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={goPrev} aria-label="Slide anterior"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-bewild-ink/50 text-white backdrop-blur-sm transition hover:bg-bewild-ink/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bewild-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-bewild-ink">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setIsPaused((p) => !p)}
                aria-label={isPaused ? "Reproduzir slideshow" : "Pausar slideshow"} aria-pressed={isPaused}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-bewild-ink/50 text-white backdrop-blur-sm transition hover:bg-bewild-ink/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bewild-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-bewild-ink">
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </button>
              <button type="button" onClick={goNext} aria-label="Próximo slide"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-bewild-ink/50 text-white backdrop-blur-sm transition hover:bg-bewild-ink/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bewild-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-bewild-ink">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-1.5" role="tablist" aria-label="Selecionar slide">
              {HERO_SLIDES.map((slide, index) => {
                const active = activeSlide === index;
                return (
                  <button key={slide.stem} type="button" role="tab" aria-selected={active}
                    aria-label={`Ir para slide ${index + 1}: ${slide.label}`}
                    tabIndex={active ? 0 : -1} onClick={() => goTo(index)}
                    className="group flex h-6 items-center px-1 focus-visible:outline-none">
                    <span className={`block h-1.5 rounded-full transition-all duration-500 ${
                      active ? "w-8 bg-bewild-blue-400" : "w-2 bg-white/50 group-hover:bg-white/70"
                    }`} />
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
