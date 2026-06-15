import { useEffect, useRef } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Container, SectionHeading, CTAButton, LandingImage } from "./primitives";
import { ARCH_BLOCKS, DIFFERENTIALS, METRICS, TRUST_POINTS } from "./content";
import { gsap } from "@/lib/gsap";

/**
 * Stack de 3 cartões sticky — Projeto · Diferenciais · Credibilidade.
 * Cartão anterior recua (scale .94, y -14) e escurece (dim .45) conforme o
 * próximo entra. Mobile: vira pilha simples sem sticky/scrub.
 */
export default function StackedShowcase() {
  const zoneRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const zone = zoneRef.current;
    if (!zone || typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isDesktop = window.matchMedia("(min-width: 901px)").matches;
    if (reduced || !isDesktop) return;

    const ctx = gsap.context(() => {
      const cards = Array.from(zone.querySelectorAll<HTMLElement>(".stack-card"));
      cards.forEach((card, i) => {
        if (i === cards.length - 1) return;
        const next = cards[i + 1];
        const dim = card.querySelector<HTMLElement>(".card-dim");
        const st = {
          trigger: next,
          start: "top bottom",
          end: "top top",
          scrub: true,
        };
        gsap.to(card, { scale: 0.94, y: -14, ease: "none", scrollTrigger: st });
        if (dim) gsap.to(dim, { opacity: 0.45, ease: "none", scrollTrigger: st });
      });
    }, zone);

    return () => ctx.revert();
  }, []);

  return (
    <section id="diferenciais" className="scroll-mt-20 bg-[#F5F7F9]">
      <div ref={zoneRef} className="relative">
        {/* ============ CARTÃO 1 · PROJETO PERSONALIZADO ============ */}
        <article className="stack-card relative flex min-h-[100svh] items-center overflow-hidden rounded-t-[28px] bg-white px-0 py-[clamp(3.2rem,7vh,4.5rem)] shadow-[0_-34px_70px_-34px_rgba(4,14,25,0.45)] lg:sticky lg:top-0">
          <CardDim />
          <Container className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch lg:gap-14">
            <div className="flex flex-col gap-4">
              <div className="relative flex-1 overflow-hidden rounded-2xl border border-bewild-line shadow-[0_24px_60px_-24px_rgba(10,37,64,0.14)] aspect-[4/5] lg:aspect-auto lg:min-h-[380px]">
                <LandingImage
                  src="/images/reformas/projeto-arquitetura-3d-01.jpg"
                  alt="Projeto de arquitetura personalizado para studio compacto da Bewild"
                  label="SLOT · PLANTA / ESTUDO"
                />
                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 font-mono text-[0.55rem] uppercase tracking-[0.28em] text-bewild-ink/60 backdrop-blur">
                  Slot · Projeto
                </span>
              </div>
              <p className="max-w-md text-[0.82rem] leading-relaxed text-bewild-steel">
                Um studio de 19, 22 ou 28 m² não permite decisões aleatórias. Cada centímetro precisa
                justificar sua existência. Por isso, a Bewild desenvolve projeto de arquitetura
                personalizado para cada imóvel: layout, circulação, iluminação, marcenaria,
                armazenamento, eletros, pontos técnicos, estética e objetivo de uso.
              </p>
            </div>

            <div className="flex flex-col gap-5">
              <SectionHeading
                eyebrow="Projeto personalizado"
                title={
                  <>
                    Arquitetura para cada metro quadrado{" "}
                    <span className="italic text-bewild-blue">trabalhar melhor.</span>
                  </>
                }
                subtitle="Em studios compactos, projeto não é decoração. É estratégia de uso, operação e rentabilidade."
              />
              <div className="mt-2 flex flex-col gap-2.5">
                {ARCH_BLOCKS.map((block, i) => (
                  <article
                    key={block.title}
                    className="group relative flex items-baseline gap-4 rounded-xl border border-bewild-line bg-white px-4 py-3.5 transition-transform hover:translate-x-1"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-3 h-[calc(100%-1.5rem)] w-[2px] bg-[#C9A24B] opacity-0 transition-opacity group-hover:opacity-100"
                    />
                    <span className="font-mono text-[0.66rem] text-[#C9A24B]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="font-display text-[0.95rem] font-medium tracking-tight text-bewild-ink">
                        {block.title}
                      </h3>
                      <p className="mt-1 text-[0.78rem] leading-relaxed text-bewild-steel">
                        {block.text}
                      </p>
                    </div>
                  </article>
                ))}
                <div className="mt-3">
                  <CTAButton href="/diagnostico" variant="primary" className="group">
                    Quero um projeto para meu studio
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </CTAButton>
                </div>
              </div>
            </div>
          </Container>
          <CardDots active={0} />
        </article>

        {/* ============ CARTÃO 2 · DIFERENCIAIS (INK) ============ */}
        <article className="stack-card relative flex min-h-[100svh] items-center overflow-hidden rounded-t-[28px] bg-bewild-ink px-0 py-[clamp(3.2rem,7vh,4.5rem)] text-white shadow-[0_-34px_70px_-34px_rgba(4,14,25,0.6)] lg:sticky lg:top-0">
          <CardDim />
          <Container>
            <SectionHeading
              eyebrow="Diferenciais"
              tone="light"
              title={
                <>
                  Por que a Bewild{" "}
                  <span className="italic text-[#DCBE7A]">é diferente.</span>
                </>
              }
              subtitle="O trabalho não termina no desenho bonito. Ele precisa fechar tecnicamente, caber no orçamento, andar na obra e funcionar depois da entrega."
            />
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {DIFFERENTIALS.map((item) => (
                <article
                  key={item.title}
                  className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:border-bewild-blue-400/40"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-bewild-blue-400/15 text-bewild-blue-400">
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="font-display text-base font-semibold tracking-tight text-white">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-white/65">{item.text}</p>
                </article>
              ))}
            </div>
          </Container>
          <CardDots active={1} dark />
        </article>

        {/* ============ CARTÃO 3 · CREDIBILIDADE (TESE) ============ */}
        <article
          className="stack-card relative flex min-h-[100svh] items-center overflow-hidden rounded-t-[28px] px-0 py-[clamp(3.2rem,7vh,4.5rem)] text-white shadow-[0_-34px_70px_-34px_rgba(4,14,25,0.6)] lg:sticky lg:top-0"
          style={{
            background:
              "radial-gradient(820px 420px at 50% 0%, rgba(0,76,127,0.3), transparent 60%), #0E2C4A",
          }}
        >
          <CardDim />
          <Container className="text-center">
            <SectionHeading
              eyebrow="Credibilidade"
              tone="light"
              align="center"
              title={
                <>
                  Credibilidade não é promessa.{" "}
                  <span className="italic text-[#DCBE7A]">É processo visível.</span>
                </>
              }
            />
            <div className="mt-10 grid gap-3 text-left sm:grid-cols-2 lg:grid-cols-4">
              {METRICS.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-2xl border border-white/10 bg-white/[0.05] p-6"
                >
                  <div className="flex items-baseline gap-2">
                    <span
                      className="font-display font-semibold tracking-tight text-white"
                      style={{ fontSize: "clamp(2.2rem,4vw,3rem)" }}
                    >
                      {metric.value}
                    </span>
                    <span className="font-mono text-[0.7rem] uppercase tracking-[0.28em] text-bewild-blue-400">
                      {metric.suffix}
                    </span>
                  </div>
                  <p className="mt-3 text-[0.72rem] leading-relaxed text-white/55">
                    {metric.label}
                  </p>
                </div>
              ))}
            </div>
            <ul className="mx-auto mt-8 grid max-w-3xl gap-x-8 gap-y-3 text-left sm:grid-cols-2 lg:grid-cols-3">
              {TRUST_POINTS.map((point) => (
                <li key={point} className="flex items-center gap-2.5">
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#C9A24B]/15 text-[#C9A24B]">
                    <Check className="h-3 w-3" aria-hidden="true" />
                  </span>
                  <span className="text-sm text-white/85">{point}</span>
                </li>
              ))}
            </ul>
          </Container>
          <CardDots active={2} dark />
        </article>
      </div>
    </section>
  );
}

function CardDim() {
  return (
    <span
      aria-hidden="true"
      className="card-dim pointer-events-none absolute inset-0 z-[5] bg-[#04101C] opacity-0"
    />
  );
}

function CardDots({ active, dark = false }: { active: number; dark?: boolean }) {
  return (
    <div className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 gap-1.5 lg:flex">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`h-[3px] rounded-full transition-all ${
            i === active
              ? "w-[30px] bg-[#C9A24B]"
              : dark
                ? "w-[18px] bg-white/25"
                : "w-[18px] bg-bewild-ink/15"
          }`}
        />
      ))}
    </div>
  );
}
