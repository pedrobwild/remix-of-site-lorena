import { Container, SectionHeading } from "./primitives";
import { DIFFERENTIALS } from "./content";

export default function DifferentialsSection() {
  return (
    <section id="diferenciais" className="scroll-mt-20 bg-bewild-ink py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="Diferenciais"
          title="Por que a bewild é diferente"
          subtitle="Porque o nosso trabalho não termina no desenho bonito. Ele precisa fechar tecnicamente, caber no orçamento, andar na obra e funcionar depois da entrega."
          tone="light"
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DIFFERENTIALS.map((item) => (
            <article
              key={item.title}
              className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-bewild-blue/40 hover:bg-white/[0.06]"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-bewild-blue/15 text-bewild-blue-400">
                <item.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="font-display text-base font-semibold tracking-tight text-white">
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed text-white/60">{item.text}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
