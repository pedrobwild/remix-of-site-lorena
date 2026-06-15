import { Container, SectionHeading } from "./primitives";
import { DIFFERENTIALS } from "./content";

export default function DifferentialsSection() {
  return (
    <section id="diferenciais" className="scroll-mt-20 bg-[#F5F7F9] py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="Diferenciais"
          title={
            <>
              Por que a Bewild{" "}
              <span className="italic text-bewild-blue">é diferente.</span>
            </>
          }
          subtitle="O trabalho não termina no desenho bonito. Ele precisa fechar tecnicamente, caber no orçamento, andar na obra e funcionar depois da entrega."
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DIFFERENTIALS.map((item) => (
            <article
              key={item.title}
              className="flex flex-col gap-3 rounded-xl border border-bewild-line bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:border-bewild-blue/40 hover:shadow-[0_24px_60px_-24px_rgba(10,37,64,0.14)]"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-bewild-blue/10 text-bewild-blue">
                <item.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="font-display text-base font-semibold tracking-tight text-bewild-ink">
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed text-bewild-steel">{item.text}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
