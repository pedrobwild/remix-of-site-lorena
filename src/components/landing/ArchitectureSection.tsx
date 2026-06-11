import { ArrowRight } from "lucide-react";
import { Container, SectionHeading, CTAButton, LandingImage } from "./primitives";
import { ARCH_BLOCKS } from "./content";

export default function ArchitectureSection() {
  return (
    <section id="arquitetura" className="scroll-mt-20 bg-white py-20 sm:py-28">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-14">
          <div className="flex flex-col gap-4 lg:sticky lg:top-28 lg:self-start">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-bewild-line shadow-[0_24px_60px_-24px_rgba(10,37,64,0.14)]">
              <LandingImage
                src="/images/reformas/projeto-arquitetura-3d-01.jpg"
                alt="Projeto de arquitetura personalizado para studio compacto da BeWild"
                label="SLOT · PLANTA / ESTUDO"
              />
              <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 font-mono text-[0.55rem] uppercase tracking-[0.28em] text-bewild-ink/60 backdrop-blur">
                Slot · Projeto
              </span>
            </div>
            <p className="max-w-md text-[0.85rem] leading-relaxed text-bewild-steel">
              Um studio de 19, 22 ou 28 m² não permite decisões aleatórias. Cada centímetro precisa
              justificar sua existência. Por isso, a BeWild desenvolve projeto de arquitetura
              personalizado para cada imóvel: layout, circulação, iluminação, marcenaria,
              armazenamento, eletros, pontos técnicos, estética e objetivo de uso.
            </p>
          </div>


          <div className="flex flex-col gap-5">
            <SectionHeading
              eyebrow="Projeto personalizado"
              title={
                <>
                  Arquitetura para cada metro quadrado{" "}
                  <span className="italic text-bewild-blue">trabalhar melhor.</span>
                </>
              }
              subtitle="Em studios compactos, projeto não é decoração. É estratégia de uso, operação e rentabilidade."
            />
            <div className="mt-2 flex flex-col gap-3">
              {ARCH_BLOCKS.map((block, i) => (
                <article
                  key={block.title}
                  className="group relative flex items-start gap-4 rounded-xl border border-bewild-line bg-white p-5 transition-all hover:border-bewild-blue/40 hover:shadow-[0_24px_60px_-24px_rgba(10,37,64,0.14)]"
                >
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-4 h-[calc(100%-2rem)] w-[2px] bg-[#C9A24B] opacity-0 transition-opacity group-hover:opacity-100"
                  />
                  <span className="font-mono text-sm font-medium text-[#C9A24B]">0{i + 1}</span>
                  <div>
                    <h3 className="font-display text-base font-semibold tracking-tight text-bewild-ink">
                      {block.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-bewild-steel">{block.text}</p>
                  </div>
                </article>
              ))}
              <div className="mt-3">
                <CTAButton href="/diagnostico" variant="primary" className="group">
                  Quero um projeto para meu studio
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </CTAButton>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
