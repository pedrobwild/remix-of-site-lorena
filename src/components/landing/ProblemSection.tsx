import { AlertTriangle, Check } from "lucide-react";
import { Container, SectionHeading } from "./primitives";
import { PROBLEM_BULLETS } from "./content";

export default function ProblemSection() {
  return (
    <section className="bg-bewild-bone py-20 sm:py-28">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <div className="flex flex-col gap-6">
            <SectionHeading
              eyebrow="O problema"
              title={
                <>
                  Reformar um studio para renda não deveria virar uma{" "}
                  <span className="text-bewild-blue">segunda profissão.</span>
                </>
              }
            />
            <p className="max-w-xl text-base leading-relaxed text-bewild-steel">
              A Bwild desenvolve soluções que integram arquitetura, engenharia, tecnologia e inteligência de mercado em uma só plataforma, para gerar o máximo de valor para quem precisa reformar, e não quer passar pelo pesadelo de cuidar de uma obra sozinho, muitas vezes à distância.
              <br />
              <br />
              E além disso, busca desfrutar de uma excelente experiência durante todo o processo, tendo no final um imóvel com alta qualidade e potencial de rendimento.
            </p>
            <div className="mt-2 flex items-start gap-3 rounded-2xl border border-bewild-blue/15 bg-white p-5 shadow-bewild-card">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-bewild-blue/10 text-bewild-blue">
                <Check className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="text-sm font-medium leading-relaxed text-bewild-ink">
                A bewild existe para integrar essas etapas em um processo claro, técnico e
                acompanhável.
              </p>
            </div>
          </div>

          <ul className="grid gap-3 self-center">
            {PROBLEM_BULLETS.map((bullet) => (
              <li
                key={bullet}
                className="flex items-start gap-3 rounded-xl border border-bewild-line bg-white px-4 py-3.5"
              >
                <AlertTriangle
                  className="mt-0.5 h-4 w-4 shrink-0 text-bewild-blue/70"
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
