import { Container, SectionHeading } from "./primitives";
import { STEPS } from "./content";

export default function ProcessTimeline() {
  return (
    <section id="como-funciona" className="scroll-mt-20 bg-bewild-night py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="Como funciona"
          title="Um processo claro, do diagnóstico à entrega."
          tone="light"
        />

        <ol className="mt-12 grid gap-x-8 gap-y-4 md:grid-cols-2">
          {STEPS.map((step, i) => (
            <li
              key={step.n}
              className="relative flex gap-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-bewild-blue/40 hover:bg-white/[0.06]"
            >
              <div className="flex flex-col items-center">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-bewild-blue/15 text-bewild-blue-400">
                  <step.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                {i < STEPS.length - 1 && (
                  <span className="mt-2 hidden w-px flex-1 bg-gradient-to-b from-white/15 to-transparent md:block" />
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-xs font-medium tracking-widest text-bewild-blue-400">
                  {step.n}
                </span>
                <h3 className="font-display text-lg font-semibold tracking-tight text-white">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-white/65">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
