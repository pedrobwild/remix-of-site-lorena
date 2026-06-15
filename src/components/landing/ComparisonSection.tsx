import { X, Check } from "lucide-react";
import { Container, SectionHeading } from "./primitives";
import { COMPARISON } from "./content";

export default function ComparisonSection() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="Comparativo"
          title={
            <>
              O custo invisível de{" "}
              <span className="italic text-bewild-blue">coordenar tudo sozinho.</span>
            </>
          }
        />

        <div className="mt-12 hidden overflow-hidden rounded-2xl border border-bewild-line bg-white shadow-[0_24px_60px_-24px_rgba(10,37,64,0.14)] sm:block">
          <div className="grid grid-cols-[1fr_1.4fr_1.4fr]">
            <div className="border-b border-bewild-line p-5" />
            <div className="border-b border-bewild-line p-5">
              <p className="font-display text-sm font-semibold text-bewild-steel">
                Reforma tradicional
              </p>
            </div>
            <div
              className="border-b border-bewild-line p-5"
              style={{ background: "rgba(0,76,127,0.05)" }}
            >
              <p className="font-display text-sm font-semibold text-bewild-blue">Bewild turn-key</p>
            </div>
          </div>
          {COMPARISON.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-[1fr_1.4fr_1.4fr] border-b border-bewild-line last:border-0"
            >
              <div className="flex items-center bg-bewild-bone/60 px-5 py-4">
                <p className="font-display text-sm font-semibold tracking-tight text-bewild-ink">
                  {row.label}
                </p>
              </div>
              <div className="flex items-start gap-2.5 px-5 py-4">
                <X
                  className="mt-0.5 h-4 w-4 shrink-0"
                  style={{ color: "rgba(10,37,64,0.35)" }}
                  aria-hidden="true"
                />
                <p className="text-sm leading-snug text-bewild-steel">{row.traditional}</p>
              </div>
              <div
                className="flex items-start gap-2.5 px-5 py-4"
                style={{ background: "rgba(0,76,127,0.05)" }}
              >
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#C9A24B]" aria-hidden="true" />
                <p className="text-sm font-medium leading-snug text-bewild-blue">{row.bewild}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 sm:hidden">
          {COMPARISON.map((row) => (
            <article key={row.label} className="rounded-2xl border border-bewild-line bg-white p-5">
              <p className="font-display text-base font-semibold tracking-tight text-bewild-ink">
                {row.label}
              </p>
              <div className="mt-3 flex items-start gap-2.5">
                <X
                  className="mt-0.5 h-4 w-4 shrink-0"
                  style={{ color: "rgba(10,37,64,0.35)" }}
                  aria-hidden="true"
                />
                <p className="text-sm text-bewild-steel">{row.traditional}</p>
              </div>
              <div className="mt-2 flex items-start gap-2.5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#C9A24B]" aria-hidden="true" />
                <p className="text-sm font-medium text-bewild-blue">{row.bewild}</p>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
