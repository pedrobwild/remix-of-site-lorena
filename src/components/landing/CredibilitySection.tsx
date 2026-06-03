import { Check } from "lucide-react";
import { Container, SectionHeading } from "./primitives";
import { METRICS, TRUST_POINTS } from "./content";

export default function CredibilitySection() {
  return (
    <section className="relative overflow-hidden bg-bewild-navy py-20 sm:py-28">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      <Container className="relative">
        <SectionHeading
          eyebrow="Credibilidade"
          title="Credibilidade não é promessa. É processo visível."
          tone="light"
        />

        {/* Métricas — números editáveis (validar internamente antes de publicar) */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {METRICS.map((metric) => (
            <div
              key={metric.label}
              className="rounded-2xl border border-white/12 bg-white/[0.04] p-6"
            >
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-4xl font-semibold tracking-tight text-white">
                  {metric.value}
                </span>
                <span className="text-sm font-medium text-bewild-blue-400">{metric.suffix}</span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-white/55">{metric.label}</p>
            </div>
          ))}
        </div>

        {/* Bloco de confiança */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-7">
          <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {TRUST_POINTS.map((point) => (
              <li key={point} className="flex items-center gap-2.5">
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-bewild-blue/20 text-bewild-blue-400">
                  <Check className="h-3 w-3" aria-hidden="true" />
                </span>
                <span className="text-sm text-white/80">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
