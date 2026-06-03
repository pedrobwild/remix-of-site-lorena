import { Container, SectionHeading } from "./primitives";
import { AUDIENCE } from "./content";

export default function AudienceSection() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="Para quem é"
          title="Para quem quer reformar sem virar gerente de obra."
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AUDIENCE.map((item) => (
            <article
              key={item.title}
              className="flex items-start gap-4 rounded-2xl border border-bewild-line bg-white p-6 transition-colors hover:border-bewild-blue/30"
            >
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-bewild-blue/10 text-bewild-blue">
                <item.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-display text-base font-semibold tracking-tight text-bewild-ink">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-bewild-steel">{item.text}</p>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
