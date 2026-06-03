import { useEffect, useState } from "react";
import { ArrowRight, Images } from "lucide-react";
import erik0381 from "@/assets/hero-slides/erik-03-8-1.png.asset.json";
import erik0311 from "@/assets/hero-slides/erik-03-11.png.asset.json";
import marcos104 from "@/assets/hero-slides/marcos-10-4.png.asset.json";
import marcos62 from "@/assets/hero-slides/marcos-6-2.png.asset.json";
import premium112 from "@/assets/hero-slides/premium-11-2.png.asset.json";
import premium74 from "@/assets/hero-slides/premium-7-4.png.asset.json";
import rodrigo11 from "@/assets/hero-slides/rodrigo-1-1.png.asset.json";
import rodrigo151 from "@/assets/hero-slides/rodrigo-15-1.png.asset.json";
import rodrigo8 from "@/assets/hero-slides/rodrigo-8.png.asset.json";
import { Container, Chip, CTAButton } from "./primitives";
import { HERO } from "./content";

const HERO_SLIDES = [
  erik0381.url,
  erik0311.url,
  premium112.url,
  premium74.url,
  rodrigo151.url,
  rodrigo8.url,
  rodrigo11.url,
  marcos62.url,
  marcos104.url,
];

export default function HeroSection() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % HERO_SLIDES.length);
    }, 4500);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <section
      id="topo"
      className="relative overflow-hidden bg-bewild-ink pt-28 pb-16 sm:pt-32 md:pb-24"
    >
      <div className="absolute inset-0" aria-hidden="true">
        {HERO_SLIDES.map((slide, index) => (
          <div
            key={slide}
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-[1600ms] ease-in-out"
            style={{
              backgroundImage: `url(${slide})`,
              opacity: activeSlide === index ? 1 : 0,
            }}
          />
        ))}
        <div className="absolute inset-0 bg-bewild-ink/55" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(10,17,30,0.88) 0%, rgba(10,17,30,0.7) 38%, rgba(10,17,30,0.48) 62%, rgba(10,17,30,0.74) 100%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(900px 520px at 78% 0%, rgba(30,91,184,0.24), transparent 60%), radial-gradient(700px 500px at 0% 100%, rgba(16,42,79,0.5), transparent 55%)",
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

      <Container className="relative">
        <div className="flex min-h-[70vh] flex-col justify-center gap-7 py-6">
          <h1 className="max-w-3xl font-display text-[2.1rem] font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl md:text-[3.4rem]">
            Reformas turn-key para transformar studios em{" "}
            <span className="text-bewild-blue-400">imóveis prontos para rentabilizar.</span>
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-white/82 sm:text-lg">
            Projeto de arquitetura personalizado, obra, marcenaria, mobiliário e tecnologia de
            acompanhamento em um processo único — para você não precisar virar gerente da própria
            reforma.
          </p>

          <p className="max-w-xl text-sm font-medium text-white/70">
            Da entrega das chaves ao imóvel pronto para foto, anúncio e operação.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <CTAButton href="#diagnostico" variant="primary">
              Solicitar diagnóstico do imóvel <ArrowRight className="h-4 w-4" />
            </CTAButton>
            <CTAButton href="#cases" variant="ghost" className="bg-bewild-ink/25 backdrop-blur-sm">
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

          <div className="flex items-center gap-2 pt-2" aria-label="Indicadores do slideshow">
            {HERO_SLIDES.map((slide, index) => (
              <span
                key={slide}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  activeSlide === index ? "w-8 bg-bewild-blue-400" : "w-1.5 bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}


