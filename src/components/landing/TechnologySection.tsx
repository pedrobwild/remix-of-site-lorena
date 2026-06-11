import { Check, Circle, Camera, FileText, CalendarClock } from "lucide-react";
import { Container, SectionHeading } from "./primitives";
import { TECH_BULLETS } from "./content";

const MOCK_STAGES = [
  { name: "Demolição e remoção", done: true },
  { name: "Elétrica e hidráulica", done: true },
  { name: "Marcenaria sob medida", done: false, current: true },
  { name: "Acabamentos e pintura", done: false },
  { name: "Montagem e enxoval", done: false },
];

export default function TechnologySection() {
  return (
    <section id="tecnologia" className="scroll-mt-20 bg-[#FBFAF8] py-20 sm:py-28">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-16">
          <div className="flex flex-col gap-6">
            <SectionHeading
              eyebrow="Tecnologia · Portal"
              title={
                <>
                  Obra com visibilidade.{" "}
                  <span className="italic text-bewild-blue">Gestão sem caixa-preta.</span>
                </>
              }
            />
            <p className="max-w-xl text-sm leading-relaxed text-bewild-steel">
              Acompanhamento por WhatsApp ajuda, mas não pode ser o único banco de dados da obra.
              Por isso, a BeWild trabalha com portal, registros, fotos, cronograma e informações
              organizadas para dar mais previsibilidade ao cliente e mais controle para a operação.
            </p>
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {TECH_BULLETS.map((bullet) => (
                <li key={bullet} className="flex items-center gap-2.5">
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#C9A24B]/15 text-[#C9A24B]">
                    <Check className="h-3 w-3" aria-hidden="true" />
                  </span>
                  <span className="text-sm text-bewild-ink/85">{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          <PortalMockup />
        </div>
      </Container>
    </section>
  );
}

function PortalMockup() {
  return (
    <div
      className="rounded-2xl border p-5 shadow-[0_40px_90px_-30px_rgba(4,18,33,0.55)]"
      style={{
        background: "linear-gradient(180deg, #0F3154, #0B2746)",
        borderColor: "rgba(255,255,255,0.08)",
      }}
      aria-label="Exemplo ilustrativo do portal de acompanhamento BeWild"
      role="img"
    >
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.28em] text-[#DCBE7A]">
            Portal BeWild · Exemplo
          </p>
          <p className="mt-1 font-display text-base font-semibold text-white">
            Studio Urban Flex · 22 m²
          </p>
        </div>
        <span className="rounded-full bg-bewild-blue-400/15 px-3 py-1 font-mono text-[0.6rem] uppercase tracking-[0.28em] text-bewild-blue-400">
          Em obra
        </span>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-white/60">
          <span className="inline-flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5" /> Cronograma
          </span>
          <span className="font-medium text-white">52% concluído</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full"
            style={{ width: "52%", background: "linear-gradient(90deg, #004C7F, #3B82C4)" }}
          />
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {MOCK_STAGES.map((stage) => (
          <li
            key={stage.name}
            className="flex items-center gap-3 rounded-xl border px-3 py-2.5"
            style={{
              borderColor: stage.current ? "rgba(59,130,196,0.4)" : "rgba(255,255,255,0.1)",
              background: stage.current ? "rgba(59,130,196,0.08)" : "rgba(255,255,255,0.02)",
            }}
          >
            {stage.done ? (
              <Check className="h-4 w-4 text-[#C9A24B]" aria-hidden="true" />
            ) : (
              <Circle
                className={`h-4 w-4 ${stage.current ? "text-bewild-blue-400" : "text-white/30"}`}
                aria-hidden="true"
              />
            )}
            <span className={`text-sm ${stage.done ? "text-white/55 line-through" : "text-white/85"}`}>
              {stage.name}
            </span>
            {stage.current && (
              <span className="ml-auto rounded-full bg-bewild-blue-400/15 px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.28em] text-bewild-blue-400">
                Em andamento
              </span>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex aspect-square items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]"
          >
            <Camera className="h-5 w-5 text-white/30" aria-hidden="true" />
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5">
        <FileText className="h-4 w-4 text-bewild-blue-400" aria-hidden="true" />
        <span className="text-xs text-white/70">
          Relatório semanal #6: marcenaria instalada, elétrica revisada.
        </span>
      </div>
      <p className="mt-3 font-mono text-[0.55rem] uppercase tracking-[0.28em] text-white/35">
        Interface ilustrativa do portal de acompanhamento
      </p>
    </div>
  );
}
