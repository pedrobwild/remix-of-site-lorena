import { ArrowRight, Images } from "lucide-react";
import { Container, Chip, CTAButton } from "./primitives";
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
        <div className="flex flex-col gap-7">
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

          {HERO.chips.length > 0 && (
            <ul className="flex flex-wrap gap-2 pt-1">
              {HERO.chips.map((chip) => (
                <li key={chip}>
                  <Chip>{chip}</Chip>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Container>
    </section>
  );
}

