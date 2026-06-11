import { Check } from "lucide-react";
import { Container, SectionHeading } from "./primitives";
import { METRICS, TRUST_POINTS } from "./content";

export default function CredibilitySection() {
  return (
    <section className="bg-[#FBFAF8] py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="Credibilidade"
          title={
            <>
              Credibilidade não é promessa.{" "}
              <span className="italic text-bewild-blue">É processo visível.</span>
            </>
          }
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {METRICS.map((metric) => (
            <div
              key={metric.label}
              className="rounded-2xl border border-bewild-line bg-white p-6 shadow-[0_24px_60px_-24px_rgba(10,37,64,0.10)]"
            >
              <div className="flex items-baseline gap-2">
                <span
                  className="font-display font-semibold tracking-tight text-bewild-ink"
                  style={{ fontSize: "clamp(2.2rem,4vw,3rem)" }}
                >
                  {metric.value}
                </span>
                <span className="font-mono text-[0.7rem] uppercase tracking-[0.28em] text-bewild-blue">
                  {metric.suffix}
                </span>
              </div>
              <p className="mt-3 text-[0.72rem] leading-relaxed text-bewild-steel/80">
                {metric.label}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-bewild-line bg-white p-6 sm:p-7">
          <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {TRUST_POINTS.map((point) => (
              <li key={point} className="flex items-center gap-2.5">
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#C9A24B]/15 text-[#C9A24B]">
                  <Check className="h-3 w-3" aria-hidden="true" />
                </span>
                <span className="text-sm text-bewild-ink/85">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
