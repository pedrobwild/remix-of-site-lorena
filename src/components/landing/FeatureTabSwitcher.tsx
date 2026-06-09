/**
 * FeatureTabSwitcher — Sprint B2
 * Tabs horizontais que ao clicar trocam imagem + conteúdo lateral com animação.
 * Padrão Guesty: "Diverse Distribution / Centralized Control / etc."
 *
 * Uso: seção de funcionalidades na homepage e páginas de produto.
 */

import React, { useState, useEffect } from "react";
import {
  Globe2,
  SlidersHorizontal,
  BarChart3,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { navigate } from "../../lib/useHashRoute";

/* ─── Tabs de conteúdo ───────────────────────────────────── */
const TABS = [
  {
    id: "distribuicao",
    label: "Distribuição",
    Icon: Globe2,
    headline: "Presença em todas as plataformas.",
    body: "Anúncios sincronizados no Airbnb, Booking.com, Vrbo e Expedia. Calendário unificado, sem conflito de reservas.",
    bullets: [
      "Calendário multi-plataforma",
      "Fotos e descrição profissional",
      "Sync automático de disponibilidade",
      "Tarifa dinâmica por plataforma",
    ],
    // Logos das plataformas — SVG inline simples
    platforms: ["airbnb", "booking", "vrbo", "expedia"],
    image: "/images/cases/studio-compacto-pronto-01.jpg",
    imageFallback: "linear-gradient(135deg,#e9e2d5 0%,#d6c5a8 100%)",
  },
  {
    id: "precificacao",
    label: "Precificação",
    Icon: SlidersHorizontal,
    headline: "Tarifa certa na hora certa.",
    body: "Algoritmo de precificação dinâmica ajusta o valor por noite de acordo com sazonalidade, eventos, ocupação da região e demanda em tempo real.",
    bullets: [
      "Precificação diária automática",
      "Análise de sazonalidade",
      "Monitoramento de eventos locais",
      "Relatório de performance mensal",
    ],
    platforms: [],
    image: "/images/cases/marcenaria-studio-01.jpg",
    imageFallback: "linear-gradient(135deg,#f0ebe1 0%,#ddd0b8 100%)",
  },
  {
    id: "gestao",
    label: "Gestão",
    Icon: BarChart3,
    headline: "Operação 24h, sem você no centro.",
    body: "Atendimento aos hóspedes, check-in/out, limpeza, manutenção e repasse. Você recebe o relatório e o valor — nada mais.",
    bullets: [
      "Atendimento 24h aos hóspedes",
      "Check-in digital e chave segura",
      "Equipe de limpeza certificada",
      "Repasse até dia 10",
    ],
    platforms: [],
    image: "/images/cases/bastidor-obra-01.jpg",
    imageFallback: "linear-gradient(135deg,#0e1b30 0%,#1e3a5f 100%)",
  },
  {
    id: "manutencao",
    label: "Manutenção",
    Icon: Wrench,
    headline: "Imóvel sempre em condições.",
    body: "Vistorias periódicas, reparos preventivos e atendimento de emergência. Seu ativo se valoriza com o tempo.",
    bullets: [
      "Vistoria entre reservas",
      "Reparos preventivos",
      "Acionamento de emergência",
      "Registro fotográfico",
    ],
    platforms: [],
    image: "/images/cases/antes-depois-studio-01-depois.jpg",
    imageFallback: "linear-gradient(135deg,#1a1108 0%,#2d1d07 100%)",
  },
  {
    id: "confianca",
    label: "Confiança",
    Icon: ShieldCheck,
    headline: "Transparência em tudo.",
    body: "Portal do proprietário com dados em tempo real, histórico de reservas, relatórios e comunicação centralizada.",
    bullets: [
      "Dashboard de reservas",
      "Histórico financeiro detalhado",
      "Comunicação em canal único",
      "Relatório mensal de desempenho",
    ],
    platforms: [],
    image: "/images/cases/studio-compacto-pronto-01.jpg",
    imageFallback: "linear-gradient(135deg,#f7f4ef 0%,#e9e2d5 100%)",
  },
];

/* ─── SVGs de plataformas (simplificados, brand-safe) ──────── */
function PlatformChip({ name }: { name: string }) {
  const MAP: Record<string, React.ReactElement> = {
    airbnb: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="#FF5A5F" aria-label="Airbnb">
        <path d="M12 2C9.6 2 7.5 3.7 6.4 6.2L2.5 16.5C2.2 17.2 2 18 2 18.7 2 21 3.8 22 5.8 22c1.4 0 2.7-.7 3.5-2l2.7-4.3 2.7 4.3c.8 1.3 2.1 2 3.5 2 2 0 3.8-1 3.8-3.3 0-.7-.2-1.5-.5-2.2L17.6 6.2C16.5 3.7 14.4 2 12 2zm0 2c1.7 0 3.2 1.2 4.1 3.2l3.9 10.3c.2.5.3.9.3 1.2 0 1-.7 1.3-1.6 1.3-.7 0-1.3-.4-1.7-1l-3-4.8a.8.8 0 00-1.4 0l-3 4.8c-.4.6-1 1-1.7 1-.9 0-1.6-.3-1.6-1.3 0-.3.1-.7.3-1.2L11.9 7.2C10.8 5.2 10.3 4 12 4z" />
      </svg>
    ),
    booking: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="#003580" aria-label="Booking.com">
        <rect x="3" y="4" width="7" height="16" rx="1" />
        <path d="M13 4h4a3 3 0 010 6h-4V4z" />
        <path d="M13 13h4.5a3.5 3.5 0 010 7H13v-7z" />
      </svg>
    ),
    vrbo: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="#1DA462" aria-label="Vrbo">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 9l4 6 4-6" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
    ),
    expedia: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="#FFC72C" aria-label="Expedia">
        <polygon points="12,2 15.5,9 23,10 17.5,15.5 19,23 12,19.5 5,23 6.5,15.5 1,10 8.5,9" />
      </svg>
    ),
  };
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-bewild-cream-200 bg-white text-xs font-medium text-bewild-text-body">
      {MAP[name]}
      <span className="capitalize">{name === "booking" ? "Booking.com" : name.charAt(0).toUpperCase() + name.slice(1)}</span>
    </span>
  );
}

/* ─── Componente principal ───────────────────────────────── */
export default function FeatureTabSwitcher({
  eyebrow = "BeWild Host Care",
  title = "Tudo que seu imóvel precisa para operar.",
  ctaLabel = "Diagnosticar meu imóvel",
  ctaHref = "/diagnostico",
}: {
  eyebrow?: string;
  title?: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  const [active, setActive] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  function switchTab(idx: number) {
    if (idx === active) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActive(idx);
      setAnimKey((k) => k + 1);
      setIsTransitioning(false);
    }, 180);
  }

  // Auto-avança a cada 5s
  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => {
        const next = (prev + 1) % TABS.length;
        setAnimKey((k) => k + 1);
        return next;
      });
    }, 5200);
    return () => clearInterval(interval);
  }, []);

  const tab = TABS[active];

  return (
    <section
      className="py-24 sm:py-32 border-t border-bewild-cream-200"
      style={{ backgroundColor: "var(--bw-cream)" }}
    >
      <div className="mx-auto max-w-[76rem] px-5 sm:px-8">
        {/* Header */}
        <div className="mb-12">
          <p
            className="font-mono text-xs uppercase tracking-[0.14em] mb-3"
            style={{ color: "var(--bw-gold-accessible)" }}
          >
            {eyebrow}
          </p>
          <h2
            className="text-3xl sm:text-4xl font-bold text-bewild-ink"
            style={{ letterSpacing: "-0.02em", maxWidth: "32ch" }}
          >
            {title}
          </h2>
        </div>

        {/* Tabs nav */}
        <div className="flex gap-2 mb-10 overflow-x-auto pb-1 scrollbar-none">
          {TABS.map((t, i) => {
            const { Icon: TabIcon } = t;
            const isActive = i === active;
            return (
              <button
                key={t.id}
                onClick={() => switchTab(i)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0"
                style={{
                  background: isActive ? "var(--bw-ink)" : "var(--bw-cream-100, #f2efe8)",
                  color: isActive ? "#fff" : "var(--bw-text-body, #3d3d3d)",
                  border: isActive ? "1.5px solid var(--bw-ink)" : "1.5px solid var(--bw-cream-200, #e9e2d5)",
                  boxShadow: isActive ? "0 4px 16px rgba(10,17,30,0.15)" : "none",
                }}
              >
                <TabIcon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Conteúdo: imagem + texto */}
        <div className="grid md:grid-cols-[1fr_1fr] gap-8 items-center min-h-[420px]">
          {/* Imagem */}
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{ height: "420px" }}
          >
            <div
              key={`img-${animKey}`}
              className="w-full h-full"
              style={{
                opacity: isTransitioning ? 0 : 1,
                transform: isTransitioning ? "scale(1.02)" : "scale(1)",
                transition: "opacity 0.28s ease, transform 0.28s ease",
              }}
            >
              <img
                src={tab.image}
                alt={tab.headline}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const el = e.currentTarget as HTMLImageElement;
                  el.style.display = "none";
                  const next = el.nextElementSibling as HTMLElement | null;
                  if (next) next.style.display = "flex";
                }}
              />
              <div
                className="absolute inset-0 hidden items-center justify-center"
                style={{ background: tab.imageFallback }}
              />
            </div>
            {/* Overlay gradiente */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to top, rgba(10,17,30,0.45) 0%, transparent 50%)",
              }}
            />
            {/* Label na imagem */}
            <div className="absolute bottom-5 left-5">
              <span
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
                style={{ background: "rgba(10,17,30,0.65)", backdropFilter: "blur(8px)" }}
              >
                {React.createElement(tab.Icon, { className: "h-3 w-3" })}
                {tab.label}
              </span>
            </div>
          </div>

          {/* Texto */}
          <div
            key={`text-${animKey}`}
            style={{
              opacity: isTransitioning ? 0 : 1,
              transform: isTransitioning ? "translateX(12px)" : "translateX(0)",
              transition: "opacity 0.28s ease, transform 0.28s ease",
            }}
          >
            <h3
              className="text-2xl sm:text-3xl font-bold text-bewild-ink mb-4"
              style={{ letterSpacing: "-0.02em" }}
            >
              {tab.headline}
            </h3>
            <p className="text-bewild-text-body leading-relaxed mb-7">{tab.body}</p>

            {/* Bullets */}
            <ul className="space-y-2.5 mb-7">
              {tab.bullets.map((b) => (
                <li key={b} className="flex items-center gap-2.5 text-sm text-bewild-text-body">
                  <span
                    className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                    style={{ background: "var(--bw-gold)" }}
                  />
                  {b}
                </li>
              ))}
            </ul>

            {/* Platform chips (só na aba distribuição) */}
            {tab.platforms.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {tab.platforms.map((p) => (
                  <PlatformChip key={p} name={p} />
                ))}
              </div>
            )}

            {/* Progress bar */}
            <div className="flex items-center gap-3 mb-8">
              {TABS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => switchTab(i)}
                  className="h-1 rounded-full transition-all duration-300 flex-1"
                  style={{
                    background:
                      i === active
                        ? "var(--bw-gold)"
                        : "var(--bw-cream-200, #e9e2d5)",
                    opacity: i === active ? 1 : 0.5,
                    maxWidth: i === active ? "64px" : "24px",
                  }}
                  aria-label={`Tab ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={() => navigate(ctaHref)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-all duration-200 hover:shadow-bewild-gold hover:scale-[1.02]"
              style={{
                background: "var(--bw-ink)",
                color: "#fff",
              }}
            >
              {ctaLabel}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
