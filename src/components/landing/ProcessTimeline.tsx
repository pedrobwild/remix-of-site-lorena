import { Container, SectionHeading } from "./primitives";
import { STEPS } from "./content";

export default function ProcessTimeline() {
  return (
    <section id="como-funciona" className="scroll-mt-20 bg-[#F2EEE5] py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="Como funciona"
          title={
            <>
              Um processo claro,{" "}
              <span className="italic text-bewild-blue">do diagnóstico à entrega.</span>
            </>
          }
        />

        <ol className="relative mt-14 grid gap-5">
          <span
            aria-hidden="true"
            className="absolute left-4 top-0 hidden h-full w-px bg-[rgba(201,162,75,0.25)] md:block"
          />
          {STEPS.map((step) => (
            <li
              key={step.n}
              className="relative grid gap-4 rounded-2xl border border-bewild-line bg-white p-6 shadow-[0_24px_60px_-24px_rgba(10,37,64,0.14)] md:ml-12 md:p-7"
            >
              <span
                aria-hidden="true"
                className="absolute -left-12 top-7 hidden h-2 w-2 rounded-full bg-[#C9A24B] md:block"
              />
              <div className="flex items-center justify-between gap-4">
                <span className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-[#C9A24B]">
                  {step.n} / 07
                </span>
                <span className="font-display text-[5rem] font-semibold leading-none text-bewild-ink/[0.05] md:text-[6rem]">
                  {step.n}
                </span>
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold tracking-tight text-bewild-ink md:text-2xl">
                  {step.title}
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-bewild-steel md:text-base">
                  {step.text}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
