import { Container, SectionHeading, LandingImage } from "./primitives";
import { CASES } from "./content";

export default function CasesGallery() {
  return (
    <section id="cases" className="scroll-mt-20 bg-white py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="Cases"
          title="Reformas reais para imóveis que precisam performar."
          subtitle="Veja como projeto, obra e acabamento se conectam para transformar studios compactos em unidades prontas para uso e locação."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {CASES.map((item) => (
            <article
              key={item.name}
              className="group flex flex-col overflow-hidden rounded-2xl border border-bewild-line bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-bewild-card"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <LandingImage
                  src={item.image}
                  alt={item.imageAlt}
                  rounded="rounded-none"
                  imgClassName="transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute left-3 top-3 rounded-full bg-bewild-ink/85 px-3 py-1 font-mono text-[0.65rem] uppercase tracking-wider text-white backdrop-blur">
                  {item.tag}
                </span>
              </div>
              <div className="flex flex-col gap-4 p-6">
                <h3 className="font-display text-xl font-semibold tracking-tight text-bewild-ink">
                  {item.name}
                </h3>
                <dl className="flex flex-col gap-3">
                  <CaseRow label="Desafio" value={item.challenge} />
                  <CaseRow label="Solução" value={item.solution} />
                  <CaseRow label="Resultado" value={item.result} highlight />
                </dl>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-bewild-concrete">
          Cases genéricos e ilustrativos. Imagens reais de reformas entregues serão adicionadas em{" "}
          <code className="font-mono">/public/images/cases/</code>.
        </p>
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
        className={`font-mono text-[0.65rem] uppercase tracking-wider ${
          highlight ? "text-bewild-blue" : "text-bewild-concrete"
        }`}
      >
        {label}
      </dt>
      <dd
        className={`text-sm leading-snug ${
          highlight ? "font-medium text-bewild-ink" : "text-bewild-steel"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
