/**
 * HoverImageCards — Sprint B3
 * Cards com foto que ao hover escurece + aparece texto em branco por cima.
 * Padrão Tabas: grid geométrico de cards com overlay e texto em negativo.
 *
 * Uso: seção de serviços / diferenciais em qualquer página.
 */

import { useState } from "react";
import { ArrowRight, Wrench, BedDouble, Hammer, Sofa, Globe2, BarChart3 } from "lucide-react";
import { navigate } from "../../lib/useHashRoute";

/* ─── Dados dos cards ────────────────────────────────────── */
const CARDS = [
  {
    id: "reforma",
    tag: "BeWild Reformas",
    title: "Reforma turn-key para short stay",
    body: "Projeto, obra, marcenaria, mobiliário e setup. Pronto para hospedar.",
    Icon: Wrench,
    href: "/be-wild",
    image: "/images/cases/studio-compacto-pronto-01.jpg",
    fallback: "linear-gradient(135deg,#e9e2d5 0%,#b8a88a 100%)",
    size: "large", // ocupa 2 colunas no grid
  },
  {
    id: "studios",
    tag: "Especialidade",
    title: "Studios compactos",
    body: "Cada centímetro pensado para foto, limpeza e operação.",
    Icon: BedDouble,
    href: "/be-wild",
    image: "/images/cases/marcenaria-studio-01.jpg",
    fallback: "linear-gradient(135deg,#d6c5a8 0%,#e9e2d5 100%)",
    size: "small",
  },
  {
    id: "marcenaria",
    tag: "Detalhes",
    title: "Marcenaria sob medida",
    body: "Armazenamento, painéis e bancadas integrados ao projeto.",
    Icon: Hammer,
    href: "/be-wild",
    image: "/images/cases/bastidor-obra-01.jpg",
    fallback: "linear-gradient(135deg,#0e1b30 0%,#102a4f 100%)",
    size: "small",
  },
  {
    id: "mobiliario",
    tag: "Setup",
    title: "Mobiliário, eletros e enxoval",
    body: "Curadoria completa para sair pronto para anúncio.",
    Icon: Sofa,
    href: "/be-wild",
    image: "/images/cases/antes-depois-studio-01-depois.jpg",
    fallback: "linear-gradient(135deg,#1a1108 0%,#2d1d07 100%)",
    size: "small",
  },
  {
    id: "distribuicao",
    tag: "BeWild Host Care",
    title: "Airbnb + Booking + mais",
    body: "Anúncios profissionais, calendário sincronizado e tarifa dinâmica.",
    Icon: Globe2,
    href: "/bewild-host-care",
    image: "/images/cases/studio-compacto-pronto-01.jpg",
    fallback: "linear-gradient(135deg,#102a4f 0%,#1e5bb8 100%)",
    size: "small",
  },
  {
    id: "gestao",
    tag: "Operação",
    title: "Gestão profissional",
    body: "Check-in, limpeza, manutenção, atendimento 24h e repasse mensal.",
    Icon: BarChart3,
    href: "/bewild-host-care",
    image: "/images/cases/bastidor-obra-01.jpg",
    fallback: "linear-gradient(135deg,#0a111e 0%,#0e1b30 100%)",
    size: "large",
  },
];

/* ─── Card individual ────────────────────────────────────── */
function HoverCard({ card }: { card: (typeof CARDS)[0] }) {
  const [hovered, setHovered] = useState(false);
  const { Icon } = card;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl cursor-pointer group ${
        card.size === "large" ? "md:col-span-2" : ""
      }`}
      style={{ height: card.size === "large" ? "360px" : "280px" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(card.href)}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && navigate(card.href)}
      aria-label={card.title}
    >
      {/* Imagem de fundo */}
      <img
        src={card.image}
        alt={card.title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700"
        style={{ transform: hovered ? "scale(1.06)" : "scale(1)" }}
        onError={(e) => {
          const el = e.currentTarget as HTMLImageElement;
          el.style.display = "none";
          const fb = document.getElementById(`fb-${card.id}`);
          if (fb) fb.style.display = "flex";
        }}
      />
      {/* Fallback de cor */}
      <div
        id={`fb-${card.id}`}
        className="absolute inset-0 hidden items-center justify-center"
        style={{ background: card.fallback }}
      >
        <Icon className="h-12 w-12 opacity-20 text-white" />
      </div>

      {/* Overlay escurecido — sempre presente, mais intenso no hover */}
      <div
        className="absolute inset-0 transition-all duration-300 ease-out"
        style={{
          background: hovered
            ? "linear-gradient(to top, rgba(10,17,30,0.88) 0%, rgba(10,17,30,0.55) 60%, rgba(10,17,30,0.25) 100%)"
            : "linear-gradient(to top, rgba(10,17,30,0.62) 0%, rgba(10,17,30,0.2) 55%, transparent 100%)",
        }}
      />

      {/* Conteúdo — sempre visível (tag + título), body e arrow aparecem no hover */}
      <div className="absolute inset-0 flex flex-col justify-end p-6">
        {/* Tag */}
        <span
          className="inline-flex self-start mb-3 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide transition-all duration-300"
          style={{
            background: hovered ? "var(--bw-gold)" : "rgba(255,255,255,0.18)",
            color: hovered ? "#0a111e" : "#fff",
            backdropFilter: "blur(6px)",
          }}
        >
          {card.tag}
        </span>

        <h3
          className="text-white font-bold leading-tight mb-2"
          style={{
            fontSize: card.size === "large" ? "1.4rem" : "1.1rem",
            letterSpacing: "-0.01em",
          }}
        >
          {card.title}
        </h3>

        {/* Body + arrow: só no hover */}
        <div
          className="overflow-hidden transition-all duration-300"
          style={{
            maxHeight: hovered ? "80px" : "0",
            opacity: hovered ? 1 : 0,
          }}
        >
          <p className="text-white/75 text-sm leading-relaxed mb-3">{card.body}</p>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-bewild-gold">
            Saiba mais <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Componente principal ───────────────────────────────── */
export default function HoverImageCards({
  eyebrow = "O que fazemos",
  title = "Dois produtos. Um ciclo completo.",
  subtitle = "Reforma e gestão sob o mesmo teto.",
}: {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
}) {
  return (
    <section
      className="py-24 sm:py-32 border-t border-bewild-cream-200"
      style={{ background: "var(--bw-cream)" }}
    >
      <div className="mx-auto max-w-[76rem] px-5 sm:px-8">
        {/* Header */}
        <div className="mb-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p
              className="font-mono text-xs uppercase tracking-[0.14em] mb-3"
              style={{ color: "var(--bw-gold-accessible)" }}
            >
              {eyebrow}
            </p>
            <h2
              className="text-3xl sm:text-4xl font-bold text-bewild-ink"
              style={{ letterSpacing: "-0.02em" }}
            >
              {title}
            </h2>
            <p
              className="mt-2 text-lg"
              style={{
                fontFamily: "var(--bw-font-display)",
                fontStyle: "italic",
                color: "var(--bw-text-muted, #747474)",
              }}
            >
              {subtitle}
            </p>
          </div>
          <button
            onClick={() => navigate("/diagnostico")}
            className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all duration-200 hover:shadow-[0_8px_24px_rgba(0,76,127,0.18)]"
            style={{ background: "var(--bw-ink)", color: "#fff" }}
          >
            Diagnosticar meu imóvel <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Grid de cards — 3 colunas no desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {CARDS.map((card) => (
            <HoverCard key={card.id} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}
