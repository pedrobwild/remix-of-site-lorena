import { Play } from "lucide-react";
import { Container, SectionHeading } from "./primitives";

export default function TestimonialSection() {
  return (
    <section aria-label="Depoimento de cliente BeWild" className="bg-[#F5F7F9] py-20 sm:py-28">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
          <div className="relative aspect-video overflow-hidden rounded-2xl bg-gradient-to-br from-[#12395E] to-bewild-ink shadow-[0_24px_60px_-24px_rgba(10,37,64,0.18)]">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-[rgba(7,22,38,0.55)] to-[rgba(10,37,64,0.15)]"
            />
            <button
              type="button"
              aria-label="Assistir depoimento da cliente"
              className="absolute inset-0 z-10 m-auto flex h-[76px] w-[76px] items-center justify-center rounded-full bg-bewild-blue text-white shadow-[0_18px_44px_-12px_rgba(0,76,127,0.65)] transition-transform hover:scale-105 hover:bg-[#005C99]"
            >
              <Play className="ml-1 h-5 w-5 fill-white" aria-hidden="true" />
            </button>
            <span className="absolute bottom-3 left-3 z-10 rounded-md bg-bewild-ink/55 px-2.5 py-1 font-mono text-[0.55rem] uppercase tracking-[0.18em] text-white/80 backdrop-blur">
              Slot · vídeo do depoimento da cliente · legendado
            </span>
          </div>

          <div className="flex flex-col gap-5">
            <SectionHeading
              eyebrow="Depoimento"
              title={
                <>
                  Quem já passou pela obra{" "}
                  <span className="italic text-bewild-blue">conta melhor do que a gente.</span>
                </>
              }
            />
            <blockquote className="relative border-l-[3px] border-[#C9A24B] pl-5 font-display text-[clamp(1.25rem,2.1vw,1.6rem)] italic leading-[1.45] text-bewild-ink">
              [Transcrever aqui a frase mais forte do depoimento em vídeo da cliente.]
            </blockquote>
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.28em] text-bewild-steel/70">
              Cliente BeWild · Studio reformado em São Paulo
            </p>
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-bewild-steel/55">
              Depoimento real · vídeo na íntegra ao lado
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
