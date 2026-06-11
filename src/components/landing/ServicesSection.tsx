import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Container, SectionHeading, Selo } from "./primitives";

type Blade = { selo: string; title: string; text: string; imgLabel: string };

const BLADES: Blade[] = [
  {
    selo: "O Núcleo",
    title: "Reforma turn-key",
    text: "Projeto, obra, compras, fornecedores, marcenaria, mobiliário e acabamento final coordenados em um único processo.",
    imgLabel: "OBRA EM ANDAMENTO",
  },
  {
    selo: "Projeto",
    title: "Arquitetura personalizada",
    text: "Cada imóvel recebe um estudo próprio de layout, circulação, marcenaria, iluminação, acabamentos e uso. Nada de copiar e colar projeto genérico.",
    imgLabel: "PRANCHA DE PROJETO",
  },
  {
    selo: "Especialidade",
    title: "Studios para short stay",
    text: "Soluções pensadas para foto, diária, experiência do hóspede, limpeza rápida, resistência e manutenção simples.",
    imgLabel: "STUDIO COMPACTO PRONTO",
  },
  {
    selo: "Interiores",
    title: "Marcenaria inteligente",
    text: "Aproveitamento de cada centímetro com armários, bancadas, painéis, iluminação e móveis sob medida para studios compactos.",
    imgLabel: "CLOSE DE MARCENARIA",
  },
  {
    selo: "Setup",
    title: "Mobiliário, eletros e enxoval",
    text: "Curadoria de itens essenciais para o imóvel sair pronto para uso, anúncio e operação.",
    imgLabel: "CAMA FEITA + ELETROS",
  },
  {
    selo: "Tecnologia",
    title: "Acompanhamento sem caixa-preta",
    text: "Portal, cronograma, fotos, relatórios e registros para reduzir incerteza e dar visibilidade total ao cliente.",
    imgLabel: "PORTAL · EXEMPLO",
  },
];

export default function ServicesSection() {
  const [active, setActive] = useState(0);
  const [interacted, setInteracted] = useState(false);

  useEffect(() => {
    if (interacted) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setActive((a) => (a + 1) % BLADES.length), 4800);
    return () => window.clearInterval(id);
  }, [interacted]);

  const select = (i: number) => {
    setInteracted(true);
    setActive(((i % BLADES.length) + BLADES.length) % BLADES.length);
  };

  return (
    <section id="o-que-fazemos" className="scroll-mt-20 bg-[#FBFAF8] py-20 sm:py-28">
      <Container>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow="O que fazemos"
            title={
              <>
                Mais que uma reforma.{" "}
                <span className="italic text-bewild-blue">Um imóvel pronto para operar.</span>
              </>
            }
            subtitle="Arquitetura, obra, interiores, tecnologia e inteligência de investimento em uma entrega única."
          />
          <div className="hidden gap-2 sm:flex">
            <button
              type="button"
              aria-label="Lâmina anterior"
              onClick={() => select(active - 1)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-bewild-ink/15 text-bewild-ink transition hover:border-bewild-blue hover:text-bewild-blue"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Próxima lâmina"
              onClick={() => select(active + 1)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-bewild-ink/15 text-bewild-ink transition hover:border-bewild-blue hover:text-bewild-blue"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-12 hidden h-[460px] gap-2 md:flex">
          {BLADES.map((b, i) => {
            const isActive = i === active;
            return (
              <button
                key={b.title}
                type="button"
                onClick={() => select(i)}
                onMouseEnter={() => select(i)}
                aria-label={`Abrir lâmina ${b.title}`}
                className="group relative overflow-hidden rounded-2xl border border-bewild-line bg-bewild-ink text-left transition-[flex] duration-[1000ms] ease-out"
                style={{ flex: isActive ? 4.4 : 1 }}
              >
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-br from-bewild-night via-bewild-navy to-bewild-ink transition-transform duration-[1200ms]"
                  style={{ transform: isActive ? "scale(1)" : "scale(1.08)" }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: isActive
                      ? "linear-gradient(180deg, rgba(10,17,30,0.2) 0%, rgba(10,17,30,0.85) 100%)"
                      : "linear-gradient(180deg, rgba(10,17,30,0.55) 0%, rgba(10,17,30,0.92) 100%)",
                  }}
                />
                <span className="absolute right-3 top-3 z-10 rounded-full bg-bewild-ink/80 px-2 py-1 font-mono text-[0.55rem] uppercase tracking-[0.28em] text-white/60 backdrop-blur">
                  Slot · {b.imgLabel}
                </span>

                {!isActive && (
                  <div className="relative z-10 flex h-full items-center justify-center p-4">
                    <span
                      className="font-display text-base font-semibold tracking-tight text-white"
                      style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
                    >
                      {b.title}
                    </span>
                  </div>
                )}

                {isActive && (
                  <div className="relative z-10 flex h-full flex-col justify-between p-7">
                    <Selo tone="gold">{b.selo}</Selo>
                    <div className="flex flex-col gap-3">
                      <h3 className="font-display text-2xl font-semibold leading-tight text-white">
                        {b.title}
                      </h3>
                      <p className="max-w-md text-sm leading-relaxed text-white/75">{b.text}</p>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-5 hidden items-center gap-1.5 md:flex" role="tablist" aria-label="Selecionar lâmina">
          {BLADES.map((b, i) => (
            <button
              key={b.title}
              role="tab"
              aria-selected={i === active}
              aria-label={`Lâmina ${i + 1}`}
              onClick={() => select(i)}
              className="group h-6 px-1"
            >
              <span
                className={`block h-[2px] rounded-full transition-all duration-500 ${
                  i === active ? "w-8 bg-[#C9A24B]" : "w-3 bg-bewild-ink/15 group-hover:bg-bewild-ink/30"
                }`}
              />
            </button>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 md:hidden">
          {BLADES.map((b) => (
            <article key={b.title} className="rounded-2xl border border-bewild-line bg-white p-5">
              <Selo tone="gold">{b.selo}</Selo>
              <h3 className="mt-3 font-display text-lg font-semibold tracking-tight text-bewild-ink">
                {b.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-bewild-steel">{b.text}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
