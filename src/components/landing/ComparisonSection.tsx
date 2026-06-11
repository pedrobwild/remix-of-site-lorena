import { X, Check } from "lucide-react";
import { Container, SectionHeading } from "./primitives";
import { COMPARISON } from "./content";

export default function ComparisonSection() {
  return (
    <section className="bg-bewild-bone py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="Comparativo"
          title="O custo invisível de coordenar tudo sozinho."
        />

        <div className="mt-12 overflow-hidden rounded-2xl border border-bewild-line bg-white shadow-bewild-card">
          {/* Cabeçalho */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.4fr_1.4fr]">
            <div className="hidden border-b border-bewild-line p-5 sm:block" />
            <div className="border-b border-bewild-line p-5">
              <p className="font-display text-sm font-semibold text-bewild-steel">
                Reforma tradicional
              </p>
            </div>
            <div className="border-b border-bewild-line bg-bewild-blue/5 p-5">
              <p className="font-display text-sm font-semibold text-bewild-blue">bewild turn-key</p>
            </div>
          </div>

          {COMPARISON.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-1 border-b border-bewild-line last:border-0 sm:grid-cols-[1fr_1.4fr_1.4fr]"
            >
              <div className="bg-bewild-bone/60 px-5 py-4 sm:flex sm:items-center">
                <p className="font-display text-sm font-semibold tracking-tight text-bewild-ink">
                  {row.label}
                </p>
              </div>
              <div className="flex items-start gap-2.5 px-5 py-4">
                <X className="mt-0.5 h-4 w-4 shrink-0 text-bewild-concrete" aria-hidden="true" />
                <p className="text-sm leading-snug text-bewild-steel">{row.traditional}</p>
              </div>
              <div className="flex items-start gap-2.5 bg-bewild-blue/5 px-5 py-4">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-bewild-blue" aria-hidden="true" />
                <p className="text-sm font-medium leading-snug text-bewild-ink">{row.bewild}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
