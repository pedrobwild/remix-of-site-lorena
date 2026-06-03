import { ArrowRight } from "lucide-react";
import { Container, SectionHeading, CTAButton, LandingImage } from "./primitives";
import { ARCH_BLOCKS } from "./content";

export default function ArchitectureSection() {
  return (
    <section id="arquitetura" className="scroll-mt-20 bg-bewild-bone py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="Projeto personalizado"
          title="Arquitetura personalizada para cada metro quadrado trabalhar melhor."
          subtitle="Em studios compactos, projeto não é decoração. É estratégia de uso, operação e rentabilidade."
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          {/* Visual do projeto */}
          <div className="flex flex-col gap-4">
            <div className="aspect-[3/4] w-full overflow-hidden rounded-2xl border border-bewild-line shadow-bewild-card">
              {/* 👉 Render/planta/moodboard em
                  /public/images/reformas/projeto-arquitetura-3d-01.jpg
                  (referência: "Bwild - Projeto Urban Flex 19m") */}
              <LandingImage
                src="/images/reformas/projeto-arquitetura-3d-01.jpg"
                alt="Projeto de arquitetura personalizado para studio compacto da bewild"
              />
            </div>
            <p className="max-w-md text-sm leading-relaxed text-bewild-steel">
              Um studio de 19, 22 ou 28 m² não permite decisões aleatórias. Cada centímetro precisa
              justificar sua existência. Por isso, a bewild desenvolve projeto de arquitetura
              personalizado para cada imóvel — layout, circulação, iluminação, marcenaria,
              armazenamento, eletros, pontos técnicos, estética e objetivo de uso.
            </p>
          </div>

          {/* Blocos */}
          <div className="flex flex-col gap-3">
            {ARCH_BLOCKS.map((block, i) => (
              <article
                key={block.title}
                className="flex items-start gap-4 rounded-2xl border border-bewild-line bg-white p-5 transition-colors hover:border-bewild-blue/30"
              >
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-bewild-blue/10 text-bewild-blue">
                  <block.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-display text-base font-semibold tracking-tight text-bewild-ink">
                    <span className="mr-2 font-mono text-xs text-bewild-blue/70">0{i + 1}</span>
                    {block.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-bewild-steel">{block.text}</p>
                </div>
              </article>
            ))}
            <div className="mt-3">
              <CTAButton href="#diagnostico" variant="primary">
                Quero um projeto para meu studio <ArrowRight className="h-4 w-4" />
              </CTAButton>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
