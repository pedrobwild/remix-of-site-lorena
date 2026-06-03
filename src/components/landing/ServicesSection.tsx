import { Container, SectionHeading } from "./primitives";
import { SERVICES } from "./content";

export default function ServicesSection() {
  return (
    <section id="o-que-fazemos" className="scroll-mt-20 bg-white py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="O que fazemos"
          title="Mais que uma reforma. Um imóvel pronto para operar."
          subtitle="A bewild combina arquitetura, obra, interiores, tecnologia e inteligência de investimento para entregar studios compactos com estética, funcionalidade e previsibilidade."
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service) => (
            <article
              key={service.title}
              className="group flex flex-col gap-4 rounded-2xl border border-bewild-line bg-white p-6 transition-all duration-200 hover:-translate-y-1 hover:border-bewild-blue/30 hover:shadow-bewild-card"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-bewild-blue/10 text-bewild-blue transition-colors group-hover:bg-bewild-blue group-hover:text-white">
                <service.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="font-display text-lg font-semibold tracking-tight text-bewild-ink">
                {service.title}
              </h3>
              <p className="text-sm leading-relaxed text-bewild-steel">{service.text}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
