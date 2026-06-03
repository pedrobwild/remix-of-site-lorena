import { Check, Circle, Camera, FileText, CalendarClock } from "lucide-react";
import { Container, SectionHeading } from "./primitives";
import { TECH_BULLETS } from "./content";

/** Etapas fictícias do mockup do portal (dados genéricos, não reais). */
const MOCK_STAGES = [
  { name: "Demolição e remoção", done: true },
  { name: "Elétrica e hidráulica", done: true },
  { name: "Marcenaria sob medida", done: false, current: true },
  { name: "Acabamentos e pintura", done: false },
  { name: "Montagem e enxoval", done: false },
];

export default function TechnologySection() {
  return (
    <section id="tecnologia" className="scroll-mt-20 bg-bewild-ink py-20 sm:py-28">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-16">
          {/* Copy */}
          <div className="flex flex-col gap-6">
            <SectionHeading
              eyebrow="Tecnologia · Portal"
              title="Obra com visibilidade. Gestão sem caixa-preta."
              subtitle="A bewild usa tecnologia para transformar reforma em um processo acompanhável."
              tone="light"
            />
            <p className="max-w-xl text-sm leading-relaxed text-white/65">
              Acompanhamento por WhatsApp ajuda, mas não pode ser o único banco de dados da obra.
              Por isso, a bewild trabalha com portal, registros, fotos, cronograma e informações
              organizadas para dar mais previsibilidade ao cliente e mais controle para a operação.
            </p>
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {TECH_BULLETS.map((bullet) => (
                <li key={bullet} className="flex items-center gap-2.5">
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-bewild-blue/20 text-bewild-blue-400">
                    <Check className="h-3 w-3" aria-hidden="true" />
                  </span>
                  <span className="text-sm text-white/80">{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Mockup do portal (dados fictícios) */}
          <PortalMockup />
        </div>
      </Container>
    </section>
  );
}

function PortalMockup() {
  return (
    <div
      className="rounded-2xl border border-white/12 bg-bewild-night/80 p-5 shadow-bewild-float backdrop-blur-xl"
      aria-label="Exemplo ilustrativo do portal de acompanhamento bewild"
      role="img"
    >
      {/* Topo */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <p className="font-mono text-[0.65rem] uppercase tracking-wider text-bewild-blue-400">
            Portal bewild · exemplo
          </p>
          <p className="mt-1 font-display text-base font-semibold text-white">
            Studio Urban Flex — 22 m²
          </p>
        </div>
        <span className="rounded-full bg-bewild-blue/20 px-3 py-1 text-xs font-medium text-bewild-blue-400">
          Em obra
        </span>
      </div>

      {/* Progresso */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-white/60">
          <span className="inline-flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5" /> Cronograma
          </span>
          <span className="font-medium text-white">52% concluído</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-[52%] rounded-full bg-gradient-to-r from-bewild-blue to-bewild-blue-400" />
        </div>
      </div>

      {/* Etapas */}
      <ul className="mt-4 space-y-2">
        {MOCK_STAGES.map((stage) => (
          <li
            key={stage.name}
            className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${
              stage.current
                ? "border-bewild-blue/40 bg-bewild-blue/10"
                : "border-white/8 bg-white/[0.02]"
            }`}
          >
            {stage.done ? (
              <Check className="h-4 w-4 text-bewild-blue-400" aria-hidden="true" />
            ) : (
              <Circle
                className={`h-4 w-4 ${stage.current ? "text-bewild-blue-400" : "text-white/30"}`}
                aria-hidden="true"
              />
            )}
            <span
              className={`text-sm ${stage.done ? "text-white/55 line-through" : "text-white/85"}`}
            >
              {stage.name}
            </span>
            {stage.current && (
              <span className="ml-auto text-[0.65rem] font-medium uppercase tracking-wider text-bewild-blue-400">
                Em andamento
              </span>
            )}
          </li>
        ))}
      </ul>

      {/* Rodapé: fotos + relatório */}
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
          Relatório semanal #6 — marcenaria instalada, elétrica revisada.
        </span>
      </div>
    </div>
  );
}
