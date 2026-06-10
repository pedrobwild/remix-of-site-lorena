/**
 * StackingSections — Sprint B1
 * Seções com foto full-width que ficam presas (sticky) ao scroll e a
 * próxima vem por cima, criando sobreposição fluida (padrão Guesty).
 *
 * Técnica: position:sticky + top:0 + z-index crescente por card +
 * border-radius no topo para efeito de "deck de cartas".
 *
 * Uso: substituir a seção de Produtos no App.tsx e reusável em páginas internas.
 */

import { ArrowRight, Wrench, BarChart3, CheckCircle } from "lucide-react";
import { navigate } from "../../lib/useHashRoute";

/* ─── Dados das seções ──────────────────────────────────── */
const SECTIONS = [
  {
    id: "reformas",
    eyebrow: "FASE 1",
    title: "Be Wild Reformas",
    subtitle: "Da planta crua ao studio pronto para hospedar.",
    body: "Projeto de arquitetura personalizado, obra turn-key, marcenaria, mobiliário e setup completo. Cada decisão pensada para foto, operação e manutenção.",
    bullets: [
      "Projeto voltado para short stay",
      "Material com durabilidade operacional",
      "Enxoval, eletros e fechadura digital",
      "Entrega pronta para hospedar",
    ],
    cta: "Conhecer o processo",
    href: "/be-wild",
    Icon: Wrench,
    // Fase 1 — fundo areia (CLARO)
    bg: "#F2EEE5",
    textClass: "text-bewild-ink",
    mutedClass: "text-bewild-text-muted",
    bodyClass: "text-bewild-text-body",
    eyebrowClass: "text-bewild-gold-accessible",
    image: "/images/cases/studio-compacto-pronto-01.jpg",
    imageFallbackGradient: "linear-gradient(135deg,#e9e2d5 0%,#d6c5a8 100%)",
  },
  {
    id: "hostcare",
    eyebrow: "FASE 2",
    title: "BeWild Host Care",
    subtitle: "Seu imóvel operando. Você não precisa fazer nada.",
    body: "Gestão profissional completa: anúncio, precificação dinâmica, atendimento 24h, check-in e check-out, limpeza, manutenção e repasse mensal.",
    bullets: [
      "Airbnb + Booking com calendário sincronizado",
      "Precificação dinâmica diária",
      "Operação 24h, total tranquilidade",
      "Relatório e repasse até dia 10",
    ],
    cta: "Ver a operação",
    href: "/bewild-host-care",
    Icon: BarChart3,
    // Fase 2 — fundo WHITE com detalhes petróleo (CLARO)
    bg: "#FFFFFF",
    textClass: "text-bewild-ink",
    mutedClass: "text-bewild-text-muted",
    bodyClass: "text-bewild-text-body",
    eyebrowClass: "text-bewild-blue",
    image: "/images/cases/bastidor-obra-01.jpg",
    imageFallbackGradient: "linear-gradient(135deg,#e8eef4 0%,#cdd9e6 100%)",
  },
  {
    id: "ciclo",
    eyebrow: "A TESE",
    title: "O fim da reforma é o início da gestão.",
    subtitle: "Um ciclo completo. Um só parceiro.",
    body: "Da decisão de reformar até o repasse mensal: a Be Wild é o único parceiro que cobre os dois lados do investimento em short stay.",
    bullets: [
      "Continuidade entre reforma e operação",
      "Menos interlocutores, mais clareza",
      "Decisões de projeto já pensadas para a gestão",
      "Diagnóstico gratuito antes de qualquer compromisso",
    ],
    cta: "Diagnosticar meu imóvel",
    href: "/diagnostico",
    Icon: CheckCircle,
    // Tese — ÚNICA seção escura do miolo
    bg: "#0A2540",
    textClass: "text-white",
    mutedClass: "text-white/60",
    bodyClass: "text-white/70",
    eyebrowClass: "text-bewild-gold",
    image: "/images/cases/antes-depois-studio-01-depois.jpg",
    imageFallbackGradient: "linear-gradient(135deg,#0A2540 0%,#004C7F 100%)",
  },
];


/* ─── Componente ─────────────────────────────────────────── */
export default function StackingSections() {
  return (
    <section className="relative" aria-label="Produtos Be Wild">
      {/*
        Mobile: cards empilham naturalmente (height: auto), sem sticky.
        Desktop (md+): wrapper alto = N * 100vh para gerar scroll com sticky.
      */}
      <div
        className="relative md:[height:var(--stack-h)]"
        style={{ ["--stack-h" as never]: `${SECTIONS.length * 100}vh` }}
      >
        {SECTIONS.map((sec, i) => (
          <StackCard key={sec.id} sec={sec} index={i} total={SECTIONS.length} />
        ))}
      </div>
    </section>
  );
}

/* ─── Card individual sticky ─────────────────────────────── */
function StackCard({
  sec,
  index,
  total,
}: {
  sec: (typeof SECTIONS)[0];
  index: number;
  total: number;
}) {
  const { Icon } = sec;
  const topRadius = index > 0 ? "1.5rem" : "0";
  const zIndex = (index + 1) * 10;
  const topOffset = index * 8;
  const isDark = sec.textClass === "text-white";
  const titleColor = isDark ? "#ffffff" : "var(--bw-ink)";
  const isTese = sec.id === "ciclo";

  // Cores semânticas: petróleo em cards claros, gold no card escuro (Tese)
  const accent = isDark ? "var(--bw-gold)" : "#004C7F";
  const accentBg = isDark ? "rgba(201,162,75,0.15)" : "rgba(0,76,127,0.10)";
  const eyebrowColor = isDark ? "var(--bw-gold)" : "#004C7F";
  const subtitleColor = isDark ? "rgba(255,255,255,0.65)" : "var(--bw-ink)";

  return (
    <div
      className="relative md:sticky flex items-center overflow-hidden min-h-screen md:min-h-0 md:h-screen"
      style={{
        top: `${topOffset}px`,
        zIndex,
        borderRadius: `${topRadius} ${topRadius} 0 0`,
        background: sec.bg,
        boxShadow: index > 0 ? "0 -8px 40px rgba(0,0,0,0.18)" : "none",
      }}
    >
      <div className="mx-auto w-full max-w-[76rem] px-5 sm:px-8 grid md:grid-cols-2 gap-12 items-center">
        {/* Texto */}
        <div className="py-16 md:py-0">
          <p
            className="font-mono text-xs uppercase tracking-[0.28em] mb-3"
            style={{ color: eyebrowColor }}
          >
            {sec.eyebrow}
          </p>

          <div className="flex items-center gap-3 mb-4">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: accentBg }}
            >
              <Icon className="h-5 w-5" style={{ color: accent }} />
            </div>
            <h2
              className="text-3xl sm:text-4xl font-bold leading-tight"
              style={{
                letterSpacing: "-0.02em",
                color: titleColor,
                fontFamily: "var(--bw-font-display)",
                fontWeight: 600,
              }}
            >
              {isTese ? (
                <>
                  O fim da reforma é{" "}
                  <em
                    style={{
                      fontStyle: "italic",
                      color: "var(--bw-gold)",
                      fontWeight: 600,
                    }}
                  >
                    o início da gestão.
                  </em>
                </>
              ) : (
                sec.title
              )}
            </h2>
          </div>

          <p
            className="text-lg mb-3"
            style={{
              fontFamily: "var(--bw-font-display)",
              fontStyle: "italic",
              fontWeight: 400,
              color: subtitleColor,
            }}
          >
            {sec.subtitle}
          </p>

          <p className={`leading-relaxed mb-7 ${sec.bodyClass}`}>{sec.body}</p>

          <ul className="space-y-2 mb-7">
            {sec.bullets.map((b) => (
              <li
                key={b}
                className={`flex items-center gap-2.5 text-sm ${sec.bodyClass}`}
              >
                <CheckCircle
                  className="h-4 w-4 flex-shrink-0"
                  style={{ color: accent }}
                />
                {b}
              </li>
            ))}
          </ul>

          {/* Extras exclusivos da Tese */}
          {isTese && (
            <>
              <p
                className="font-mono text-[11px] uppercase tracking-[0.28em] mb-7"
                style={{ color: "rgba(201,162,75,0.85)" }}
              >
                Sem ocupação garantida no papel: dado real, relatório mensal e repasse até o dia 10.
              </p>

              <figure
                className="mb-8 pl-4 border-l-2"
                style={{ borderColor: "var(--bw-gold)" }}
              >
                <blockquote
                  className="text-lg leading-snug text-white/90"
                  style={{
                    fontFamily: "var(--bw-font-display)",
                    fontStyle: "italic",
                    fontWeight: 400,
                  }}
                >
                  “Recebi a chave da construtora, passei para a Be Wild e em dois meses já tinha o imóvel gerando reservas.”
                </blockquote>
                <figcaption className="mt-3 font-mono text-[11px] uppercase tracking-[0.22em] text-white/55">
                  C. M. · Studio 28m² · Pinheiros
                </figcaption>
              </figure>
            </>
          )}

          {isTese ? (
            <button
              onClick={() => navigate(sec.href)}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:gap-3"
              style={{ backgroundColor: "#004C7F", color: "#ffffff" }}
            >
              {sec.cta}
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => navigate(sec.href)}
              className="inline-flex items-center gap-2 font-semibold text-sm transition-all duration-200 hover:gap-3"
              style={{ color: accent }}
            >
              {sec.cta}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>


        {/* Imagem */}
        <div
          className="hidden md:block relative rounded-2xl overflow-hidden"
          style={{ height: "65vh", maxHeight: "560px" }}
        >
          <img
            src={sec.image}
            alt={sec.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              const el = e.currentTarget as HTMLImageElement;
              el.style.display = "none";
              const fallback = el.nextElementSibling as HTMLElement | null;
              if (fallback) fallback.style.display = "flex";
            }}
          />
          {/* Fallback gradient */}
          <div
            className="absolute inset-0 hidden items-center justify-center"
            style={{ background: sec.imageFallbackGradient }}
          >
            <Icon className="h-16 w-16 opacity-20" style={{ color: "var(--bw-gold)" }} />
          </div>
          {/* Overlay sutil */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 55%)",
            }}
          />
        </div>
      </div>

      {/* Indicador de posição (dots) */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2"
        aria-hidden="true"
      >
        {Array.from({ length: total }).map((_, dotIdx) => (
          <span
            key={dotIdx}
            className="rounded-full transition-all duration-300"
            style={{
              width: dotIdx === index ? "24px" : "6px",
              height: "6px",
              background:
                dotIdx === index
                  ? "var(--bw-gold)"
                  : "rgba(255,255,255,0.3)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
