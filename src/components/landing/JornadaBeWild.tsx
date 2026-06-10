/**
 * JornadaBeWild — Componente proprietário de jornada.
 *
 * Variantes:
 *   "home"     — cards em grid com linha conectora, destaques Fase 1 / Fase 2, dois CTAs
 *   "metodo"   — cards expandidos com lista de detalhes por etapa
 *   "compacta" — linha horizontal em texto, sem cards
 *   "mini"     — três cards inline
 *
 * Prop tone:
 *   "dark"  — para fundos escuros (texto branco/cinza-claro).
 *   "light" — para fundos claros bewild-cream/parchment/white (texto ink).
 *   Default: "light", pois quase todas as instâncias atuais estão em fundo claro.
 */

import { useEffect, useRef, useState, createContext, useContext } from "react";
import { navigate } from "../../lib/useHashRoute";
import { ArrowRight, Search, PencilRuler, Megaphone, Settings2, BarChart3, CheckCircle } from "lucide-react";

// ─── Tone tokens ─────────────────────────────────────────────────────────────

export type JornadaTone = "light" | "dark";

interface ToneTokens {
  // Cards
  cardBorder: string;
  cardBg: string;
  cardBorderPhase1: string;
  cardBgPhase1: string;
  cardBorderPhase2: string;
  cardBgPhase2: string;
  // Texto
  numberMuted: string;        // número 01..05 quando não-fase
  numberHighlight: string;    // número quando fase destacada
  iconDefault: string;
  titleHighlight: string;
  titleDefault: string;
  descColor: string;          // descrição da etapa (precisa ler AA)
  // Linha conectora
  connectorBase: string;      // bg da trilha
  // CTAs
  ctaPrimary: string;
  ctaSecondary: string;
  // Compacta
  compactaText: string;
  compactaArrow: string;
  // Mini
  miniCardBorder: string;
  miniCardBg: string;
  miniLabel: string;
  miniSub: string;
}

const TONE_LIGHT: ToneTokens = {
  cardBorder: "border-bewild-cream-200",
  cardBg: "bg-white",
  cardBorderPhase1: "border-bewild-gold/40",
  cardBgPhase1: "bg-bewild-gold/[0.06]",
  cardBorderPhase2: "border-bewild-blue/30",
  cardBgPhase2: "bg-bewild-blue/[0.04]",
  numberMuted: "text-bewild-ink/20",
  numberHighlight: "text-bewild-gold/55",
  iconDefault: "text-bewild-ink/45",
  titleHighlight: "text-bewild-ink",
  titleDefault: "text-bewild-ink/85",
  descColor: "text-bewild-text-body",
  connectorBase: "bg-bewild-ink/10",
  ctaPrimary: "text-bewild-gold-accessible hover:text-bewild-ink",
  ctaSecondary: "text-bewild-text-muted hover:text-bewild-ink",
  compactaText: "text-bewild-text-body",
  compactaArrow: "text-bewild-ink/35",
  miniCardBorder: "border-bewild-cream-200",
  miniCardBg: "bg-white",
  miniLabel: "text-bewild-ink",
  miniSub: "text-bewild-text-muted",
};

const TONE_DARK: ToneTokens = {
  cardBorder: "border-white/10",
  cardBg: "bg-white/[0.03]",
  cardBorderPhase1: "border-bewild-gold/30",
  cardBgPhase1: "bg-bewild-gold/5",
  cardBorderPhase2: "border-bewild-blue/20",
  cardBgPhase2: "bg-bewild-blue/[0.06]",
  numberMuted: "text-white/20",
  numberHighlight: "text-bewild-gold/40",
  iconDefault: "text-white/40",
  titleHighlight: "text-white",
  titleDefault: "text-white/85",
  descColor: "text-white/80",
  connectorBase: "bg-white/10",
  ctaPrimary: "text-bewild-gold hover:text-bewild-gold-accessible",
  ctaSecondary: "text-white/75 hover:text-white",
  compactaText: "text-white/80",
  compactaArrow: "text-white/40",
  miniCardBorder: "border-white/12",
  miniCardBg: "bg-white/[0.04]",
  miniLabel: "text-white",
  miniSub: "text-white/70",
};

const ToneCtx = createContext<ToneTokens>(TONE_LIGHT);
const useTone = () => useContext(ToneCtx);

// ─── Dados canônicos da jornada ──────────────────────────────────────────────

export interface EtapaDetalhe {
  n: string;
  title: string;
  fase?: "1" | "2";
  icon: React.ComponentType<{ className?: string }>;
  descricao: string;
  detalhe?: string[];
}

export const ETAPAS_JORNADA: EtapaDetalhe[] = [
  {
    n: "01",
    title: "Diagnóstico",
    icon: Search,
    descricao: "Entendemos imóvel, bairro, estágio, potencial e objetivo. A conversa é consultiva: não tentamos vender antes de entender se a BeWild faz sentido para o seu caso.",
    detalhe: [
      "Avaliação de metragem, localização e padrão do imóvel",
      "Identificação do estágio atual: cru, em reforma, pronto ou já alugando",
      "Objetivo do proprietário: preparar, operar ou jornada completa",
      "Indicação do caminho: BeWild Reformas, BeWild Host Care ou os dois",
    ],
  },
  {
    n: "02",
    title: "BeWild Reformas",
    fase: "1",
    icon: PencilRuler,
    descricao: "Projeto, obra, marcenaria, mobiliário, compras, decoração e setup em um fluxo único. Cada decisão é pensada para o uso real de temporada: foto, diária, limpeza e manutenção.",
    detalhe: [
      "Projeto de arquitetura personalizado para short stay",
      "Execução da obra com gestão técnica e relatórios de etapa",
      "Marcenaria, mobiliário, decoração e curadoria de itens",
      "Setup operacional: enxoval, fechadura digital e check-in remoto",
      "Entrega com documentação de escopo e fotos",
    ],
  },
  {
    n: "03",
    title: "Lançamento",
    icon: Megaphone,
    descricao: "Fotos profissionais, criação dos anúncios, cadastro nas plataformas e precificação inicial. O imóvel entra no mercado posicionado, não improvisado.",
    detalhe: [
      "Fotos profissionais pensadas para conversão no anúncio",
      "Criação e otimização do perfil no Airbnb, Booking e demais canais",
      "Definição de precificação inicial com base em mercado e sazonalidade",
      "30 dias de tráfego pago para ajudar na tração inicial",
    ],
  },
  {
    n: "04",
    title: "BeWild Host Care",
    fase: "2",
    icon: Settings2,
    descricao: "Gestão da operação do dia a dia: hóspedes, limpeza, manutenção, canais e repasse. O proprietário acompanha via relatório mensal — sem precisar operar.",
    detalhe: [
      "Atendimento 24h ao hóspede: check-in, suporte e check-out",
      "Limpeza profissional e troca de enxoval entre reservas",
      "Manutenção preventiva e emergencial",
      "Ajuste dinâmico de preços e canais",
      "Repasse mensal com demonstrativo detalhado",
    ],
  },
  {
    n: "05",
    title: "Aprendizado contínuo",
    icon: BarChart3,
    descricao: "Acompanhamos dados, avaliações de hóspedes, feedbacks e oportunidades de melhoria. O ativo melhora com o tempo — não fica estático após o lançamento.",
    detalhe: [
      "Relatório mensal com ocupação, receita e avaliações",
      "Identificação de oportunidades de ajuste de preço ou produto",
      "Feedbacks de hóspedes incorporados à operação",
      "Revisão periódica de performance do ativo",
    ],
  },
];

// ─── Variante: compacta ───────────────────────────────────────────────────────

function JornadaCompacta() {
  const t = useTone();
  const passos = ["Diagnóstico", "BeWild Reformas", "Lançamento", "BeWild Host Care", "Relatórios"];
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {passos.map((p, i) => (
        <span key={p} className="flex items-center gap-1.5">
          <span className={`text-sm font-medium ${t.compactaText}`}>{p}</span>
          {i < passos.length - 1 && (
            <span className={`text-sm ${t.compactaArrow}`}>→</span>
          )}
        </span>
      ))}
    </div>
  );
}

// ─── Variante: home ───────────────────────────────────────────────────────────

function JornadaHome({ showCtas = true }: { showCtas?: boolean }) {
  const t = useTone();
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(-1);

  useEffect(() => {
    const container = containerRef.current;
    const line = lineRef.current;
    if (!container || !line) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            let progress = 0;
            const tick = () => {
              progress = Math.min(progress + 2, 100);
              line.style.width = `${progress}%`;
              if (progress < 100) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);

            ETAPAS_JORNADA.forEach((_, i) => {
              setTimeout(() => setActiveIdx(i), i * 140);
            });
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef}>
      <div className="relative">
        <div className={`hidden lg:block absolute top-8 left-[8%] right-[8%] h-px pointer-events-none overflow-hidden rounded-full ${t.connectorBase}`}>
          <div
            ref={lineRef}
            className="h-full w-0 bg-gradient-to-r from-bewild-blue/30 via-bewild-gold/50 to-bewild-blue/30 transition-none rounded-full"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {ETAPAS_JORNADA.map((etapa, idx) => {
            const isPhase1 = etapa.fase === "1";
            const isPhase2 = etapa.fase === "2";
            const isHighlight = isPhase1 || isPhase2;
            const isActive = idx <= activeIdx;
            const cardCls = isPhase1
              ? `${t.cardBorderPhase1} ${t.cardBgPhase1}`
              : isPhase2
              ? `${t.cardBorderPhase2} ${t.cardBgPhase2}`
              : `${t.cardBorder} ${t.cardBg}`;
            return (
              <div
                key={etapa.n}
                className={`relative rounded-2xl border p-5 transition-all duration-500 ${
                  isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                } ${cardCls}`}
              >
                <p className={`mb-3 font-mono text-2xl font-bold ${isHighlight ? t.numberHighlight : t.numberMuted}`}>{etapa.n}</p>
                <etapa.icon
                  className={`mb-3 h-5 w-5 ${isPhase1 ? "text-bewild-gold" : isPhase2 ? "text-bewild-blue-400" : t.iconDefault}`}
                />
                <p className={`mb-1.5 text-sm font-semibold ${isHighlight ? t.titleHighlight : t.titleDefault}`}>
                  {etapa.title}
                </p>
                <p className={`text-xs leading-relaxed line-clamp-3 ${t.descColor}`}>{etapa.descricao}</p>
                {isPhase1 && (
                  <span className="mt-3 inline-block text-[0.55rem] font-mono uppercase tracking-widest text-bewild-gold-accessible border border-bewild-gold/35 rounded-full px-2 py-0.5">
                    Fase 1
                  </span>
                )}
                {isPhase2 && (
                  <span className="mt-3 inline-block text-[0.55rem] font-mono uppercase tracking-widest text-bewild-blue-400 border border-bewild-blue/25 rounded-full px-2 py-0.5">
                    Fase 2
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showCtas && (
        <div className="mt-8 flex flex-wrap items-center gap-6">
          <button
            onClick={() => navigate("/metodo-bwild")}
            className={`inline-flex items-center gap-1.5 text-sm transition-colors ${t.ctaPrimary}`}
          >
            Ver o método completo <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => navigate("/diagnostico")}
            className={`inline-flex items-center gap-1.5 text-sm transition-colors ${t.ctaSecondary}`}
          >
            Iniciar meu diagnóstico <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Variante: método ─────────────────────────────────────────────────────────

function JornadaMetodo({ etapas }: { etapas?: EtapaDetalhe[] }) {
  const t = useTone();
  const lista = etapas ?? ETAPAS_JORNADA;
  return (
    <div className="space-y-6">
      {lista.map((etapa) => {
        const isPhase1 = etapa.fase === "1";
        const isPhase2 = etapa.fase === "2";
        const isHighlight = isPhase1 || isPhase2;
        const cardCls = isHighlight
          ? `${t.cardBorderPhase2} ${t.cardBgPhase2}`
          : `${t.cardBorder} ${t.cardBg}`;
        return (
          <div
            key={etapa.n}
            className={`rounded-2xl border p-6 sm:p-8 ${cardCls}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
              <div className="flex items-center gap-4">
                <span className={`font-mono text-3xl font-bold ${isHighlight ? t.numberHighlight : t.numberMuted}`}>{etapa.n}</span>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <etapa.icon className={`h-4 w-4 ${isHighlight ? "text-bewild-blue-400" : t.iconDefault}`} />
                    <p className={`font-semibold ${isHighlight ? t.titleHighlight : t.titleDefault}`}>
                      {etapa.title}
                    </p>
                    {isHighlight && (
                      <span className="text-[0.55rem] font-mono uppercase tracking-widest text-bewild-blue-400 border border-bewild-blue/25 rounded-full px-2 py-0.5">
                        Fase {etapa.fase}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm leading-relaxed max-w-2xl ${t.descColor}`}>{etapa.descricao}</p>
                </div>
              </div>
            </div>

            {etapa.detalhe && etapa.detalhe.length > 0 && (
              <ul className="grid gap-2 sm:grid-cols-2 mt-2">
                {etapa.detalhe.map((d) => (
                  <li key={d} className={`flex gap-2.5 text-sm ${t.descColor}`}>
                    <CheckCircle className="h-4 w-4 text-bewild-blue-400 shrink-0 mt-0.5" />
                    {d}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Variante: mini ───────────────────────────────────────────────────────────

function JornadaMini() {
  const t = useTone();
  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        { label: "Diagnóstico", sub: "Avaliação gratuita", icon: Search },
        { label: "BeWild Reformas", sub: "Preparação do ativo", icon: PencilRuler },
        { label: "BeWild Host Care", sub: "Operação contínua", icon: Settings2 },
      ].map((item, i, arr) => (
        <div key={item.label} className="relative">
          <div className={`rounded-xl border p-4 text-center ${t.miniCardBorder} ${t.miniCardBg}`}>
            <item.icon className="h-5 w-5 text-bewild-blue-400 mx-auto mb-2" />
            <p className={`text-xs font-semibold ${t.miniLabel}`}>{item.label}</p>
            <p className={`text-[0.6rem] mt-0.5 ${t.miniSub}`}>{item.sub}</p>
          </div>
          {i < arr.length - 1 && (
            <span className="hidden sm:block absolute -right-1.5 top-1/2 -translate-y-1/2 text-bewild-blue/40 text-xs z-10">
              →
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Export principal ─────────────────────────────────────────────────────────

export type JornadaVariant = "home" | "metodo" | "compacta" | "mini";

interface JornadaBeWildProps {
  variant?: JornadaVariant;
  tone?: JornadaTone;
  showCtas?: boolean;
  etapas?: EtapaDetalhe[];
  className?: string;
}

export default function JornadaBeWild({
  variant = "home",
  tone = "light",
  showCtas = true,
  etapas,
  className = "",
}: JornadaBeWildProps) {
  const tokens = tone === "dark" ? TONE_DARK : TONE_LIGHT;
  return (
    <ToneCtx.Provider value={tokens}>
      <div className={className} data-component="jornada-be-wild" data-variant={variant} data-tone={tone}>
        {variant === "home" && <JornadaHome showCtas={showCtas} />}
        {variant === "metodo" && <JornadaMetodo etapas={etapas} />}
        {variant === "compacta" && <JornadaCompacta />}
        {variant === "mini" && <JornadaMini />}
      </div>
    </ToneCtx.Provider>
  );
}
