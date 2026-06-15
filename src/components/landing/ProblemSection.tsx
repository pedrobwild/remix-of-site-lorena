import { Container, SectionHeading } from "./primitives";
import { PROBLEM_BULLETS } from "./content";

export default function ProblemSection() {
  return (
    <section className="bg-[#F5F7F9] py-20 sm:py-28">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div className="flex flex-col gap-6">
            <SectionHeading
              eyebrow="O problema"
              title={
                <>
                  Reformar um studio para renda{" "}
                  <span className="italic text-bewild-blue">não precisa ser sua segunda profissão.</span>
                </>
              }
            />
            <p className="max-w-xl text-base leading-relaxed text-bewild-steel">
              A Bewild integra arquitetura, engenharia, obra e inteligência de mercado em um único
              processo, para quem precisa reformar e não quer carregar o pesadelo de cuidar de uma
              obra sozinho, muitas vezes à distância. Você acompanha. A gente executa.
            </p>
          </div>

          <ul className="grid gap-3 self-center">
            {PROBLEM_BULLETS.map((bullet) => (
              <li
                key={bullet}
                className="flex items-start gap-3 rounded-xl border border-bewild-line bg-white px-4 py-3.5 shadow-[0_8px_24px_-16px_rgba(10,37,64,0.12)]"
              >
                <span
                  className="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full bg-[#C9A24B]"
                  aria-hidden="true"
                />
                <span className="text-sm leading-snug text-bewild-ink/80">{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
