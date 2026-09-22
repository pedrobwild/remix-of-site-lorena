import { ArrowRight } from "lucide-react";
import { Container, CTAButton } from "./primitives";

const HERO_STEM = "erik-03-8-1";
const HERO_IMG = `/images/hero-slides/${HERO_STEM}-lg.jpg`;
const HERO_SRCSET_JPG = `/images/hero-slides/${HERO_STEM}-sm.jpg 640w, /images/hero-slides/${HERO_STEM}-md.jpg 1280w, /images/hero-slides/${HERO_STEM}-lg.jpg 1920w`;
const HERO_SRCSET_AVIF = `/images/hero-slides/${HERO_STEM}-sm.avif 640w, /images/hero-slides/${HERO_STEM}-md.avif 1280w, /images/hero-slides/${HERO_STEM}-lg.avif 1920w`;
const HERO_SRCSET_WEBP = `/images/hero-slides/${HERO_STEM}-sm.webp 640w, /images/hero-slides/${HERO_STEM}-md.webp 1280w, /images/hero-slides/${HERO_STEM}-lg.webp 1920w`;

export default function HeroSection() {
  return (
    <section
      id="topo"
      aria-label="Bewild — reforma turn-key de studios"
      className="relative overflow-hidden bg-bewild-ink"
      style={{ minHeight: "max(100vh, 640px)" }}
    >
      <div className="absolute inset-0" aria-hidden="true">
        <picture>
          <source type="image/avif" srcSet={HERO_SRCSET_AVIF} sizes="100vw" />
          <source type="image/webp" srcSet={HERO_SRCSET_WEBP} sizes="100vw" />
          <img
            src={HERO_IMG}
            srcSet={HERO_SRCSET_JPG}
            sizes="100vw"
            alt=""
            decoding="async"
            loading="eager"
            fetchPriority="high"
            className="h-full w-full object-cover"
            style={{ animation: "hero-zoom 1.8s ease-out forwards" }}
          />
        </picture>
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(7,22,38,0.92) 0%, rgba(10,37,64,0.55) 55%, rgba(10,37,64,0.25) 100%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(100deg, rgba(10,37,64,0.5) 0%, rgba(10,37,64,0.25) 30%, transparent 55%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "3px 3px",
          }}
        />
      </div>

      <style>{`@keyframes hero-zoom{from{transform:scale(1.08)}to{transform:scale(1)}}
        @media (prefers-reduced-motion: reduce){[style*="hero-zoom"]{animation:none!important;transform:none!important}}`}</style>

      <Container className="relative flex h-full min-h-[100vh] flex-col justify-end pb-20 pt-32 sm:pb-28">
        <div className="flex max-w-3xl flex-col gap-6">
          <p
            className="font-mono text-[0.7rem] font-medium uppercase tracking-[0.28em] text-[#DCBE7A] animate-fade-in"
            style={{ animationDelay: "0.3s", animationFillMode: "backwards" }}
          >
            Bewild · Reforma turn-key de studios · São Paulo
          </p>

          <h1
            className="font-display text-[2.2rem] font-semibold leading-[1.05] tracking-tight text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.5)] sm:text-5xl md:text-[3.6rem] animate-fade-in"
            style={{ animationDelay: "0.45s", animationFillMode: "backwards" }}
          >
            Reforma turn-key de studios,
            <br />
            <span className="italic text-[#DCBE7A]">do cru ao pronto para rentabilizar.</span>
          </h1>

          <p
            className="max-w-xl text-base leading-relaxed text-white/85 sm:text-lg animate-fade-in"
            style={{ animationDelay: "0.9s", animationFillMode: "backwards" }}
          >
            Projeto de arquitetura, obra, marcenaria, mobiliário e tecnologia de acompanhamento em
            um processo único, para você não precisar virar gerente da própria reforma.
          </p>

          <p
            className="font-mono text-[0.7rem] uppercase tracking-[0.28em] text-white/55 animate-fade-in"
            style={{ animationDelay: "1.05s", animationFillMode: "backwards" }}
          >
            Da entrega das chaves ao imóvel pronto para foto, anúncio e operação
          </p>

          <div
            className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center animate-fade-in"
            style={{ animationDelay: "1.2s", animationFillMode: "backwards" }}
          >
            <CTAButton href="/diagnostico" variant="primary" className="group">
              Solicitar orçamento
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </CTAButton>
            <CTAButton href="/portfolio" variant="ghost">
              Ver reformas entregues
            </CTAButton>
          </div>
        </div>

        <div className="mt-12 hidden items-center gap-3 sm:flex">
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-white/45 animate-pulse">
            Role para descer
          </span>
          <span className="h-px w-12 bg-white/30" />
        </div>
      </Container>
    </section>
  );
}
