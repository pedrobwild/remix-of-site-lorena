import { ArrowRight } from "lucide-react";
import { Container, SectionHeading, LandingImage, CTAButton, Selo } from "./primitives";
import { CASES } from "./content";

export default function CasesGallery() {
  const preview = CASES.slice(0, 2);
  return (
    <section id="cases" className="scroll-mt-20 bg-white py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="Portfólio"
          title={
            <>
              Reformas reais para imóveis{" "}
              <span className="italic text-bewild-blue">que precisam performar.</span>
            </>
          }
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {preview.map((item) => (
            <article
              key={item.name}
              className="group flex flex-col overflow-hidden rounded-2xl border border-bewild-line bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_24px_60px_-24px_rgba(10,37,64,0.18)]"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <LandingImage
                  src={item.image}
                  alt={item.imageAlt}
                  rounded="rounded-none"
                  imgClassName="transition-transform duration-700 group-hover:scale-105"
                />
                <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 font-mono text-[0.55rem] uppercase tracking-[0.28em] text-bewild-ink/60 backdrop-blur">
                  Slot · Foto real
                </span>
                <div className="absolute left-3 top-3">
                  <Selo tone="gold">{item.tag}</Selo>
                </div>
              </div>
              <div className="flex flex-col gap-4 p-6">
                <h3 className="font-display text-[1.15rem] font-semibold tracking-tight text-bewild-ink">
                  {item.name}
                </h3>
                <dl className="flex flex-col gap-2.5">
                  <CaseRow label="Desafio" value={item.challenge} />
                  <CaseRow label="Solução" value={item.solution} />
                  <CaseRow label="Resultado" value={item.result} highlight />
                </dl>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center gap-5">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-bewild-steel/70">
            Cases ilustrativos até a publicação das fotos reais das reformas entregues
          </p>
          <CTAButton href="/portfolio" variant="ghost-ink" className="group">
            Ver portfólio completo
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </CTAButton>
        </div>
      </Container>
    </section>
  );
}

function CaseRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="grid grid-cols-[88px_1fr] gap-3">
      <dt
        className={`font-mono text-[0.6rem] uppercase tracking-[0.28em] ${
          highlight ? "text-bewild-blue" : "text-bewild-concrete"
        }`}
      >
        {label}
      </dt>
      <dd
        className={`text-[0.82rem] leading-snug ${
          highlight ? "font-medium text-bewild-ink" : "text-bewild-steel"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
