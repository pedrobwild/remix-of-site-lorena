import { ArrowRight, Images } from "lucide-react";
import { Container, Chip, CTAButton, LandingImage } from "./primitives";
import { HERO } from "./content";

export default function HeroSection() {
  return (
    <section
      id="topo"
      className="relative overflow-hidden bg-bewild-ink pt-28 pb-16 sm:pt-32 md:pb-24"
    >
      {/* Brilho/gradiente atmosférico da marca */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(900px 520px at 78% 0%, rgba(30,91,184,0.28), transparent 60%), radial-gradient(700px 500px at 0% 100%, rgba(16,42,79,0.55), transparent 55%)",
        }}
      />
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
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          {/* Copy */}
          <div className="flex flex-col gap-7">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-bewild-blue-400">
              Reformas turn-key · studios · short-stay
            </span>

            <h1 className="font-display text-[2.1rem] font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl md:text-[3.4rem]">
              Reformas turn-key para transformar studios em{" "}
              <span className="text-bewild-blue-400">imóveis prontos para rentabilizar.</span>
            </h1>

            <p className="max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
              Projeto de arquitetura personalizado, obra, marcenaria, mobiliário e tecnologia de
              acompanhamento em um processo único — para você não precisar virar gerente da própria
              reforma.
            </p>

            <p className="max-w-xl text-sm font-medium text-white/55">
              Da entrega das chaves ao imóvel pronto para foto, anúncio e operação.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <CTAButton href="#diagnostico" variant="primary">
                Solicitar diagnóstico do imóvel <ArrowRight className="h-4 w-4" />
              </CTAButton>
              <CTAButton href="#cases" variant="ghost">
                <Images className="h-4 w-4" /> Ver reformas entregues
              </CTAButton>
            </div>

            <ul className="flex flex-wrap gap-2 pt-1">
              {HERO.chips.map((chip) => (
                <li key={chip}>
                  <Chip>{chip}</Chip>
                </li>
              ))}
            </ul>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[1.5rem] border border-white/10 shadow-bewild-float sm:aspect-[3/4]">
              {/* 👉 Trocar por foto real de studio pronto em
                  /public/images/reformas/hero-studio-bewild.jpg */}
              <LandingImage
                src="/images/reformas/hero-studio-bewild.jpg"
                alt="Studio compacto reformado e mobiliado pela bewild, pronto para operar"
                rounded="rounded-[1.5rem]"
                loading="eager"
              />
              <div
                className="pointer-events-none absolute inset-0 rounded-[1.5rem]"
                style={{
                  background: "linear-gradient(180deg, transparent 55%, rgba(10,17,30,0.55) 100%)",
                }}
                aria-hidden="true"
              />
            </div>

            {/* Cards flutuantes */}
            <div className="mt-4 grid gap-3 sm:absolute sm:-bottom-6 sm:-left-6 sm:mt-0 sm:w-[60%] sm:gap-2.5">
              {HERO.floatingCards.slice(0, 2).map((card) => (
                <div
                  key={card.title}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-bewild-night/80 p-3.5 backdrop-blur-xl"
                >
                  <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-bewild-blue/20 text-bewild-blue-400">
                    <card.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{card.title}</p>
                    <p className="text-xs leading-snug text-white/65">{card.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Terceiro card — topo direito no desktop */}
            <div className="hidden sm:absolute sm:-right-4 sm:top-8 sm:block sm:w-[55%]">
              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-bewild-night/80 p-3.5 backdrop-blur-xl">
                <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-bewild-blue/20 text-bewild-blue-400">
                  {(() => {
                    const Icon = HERO.floatingCards[2].icon;
                    return <Icon className="h-5 w-5" aria-hidden="true" />;
                  })()}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{HERO.floatingCards[2].title}</p>
                  <p className="text-xs leading-snug text-white/65">{HERO.floatingCards[2].text}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
