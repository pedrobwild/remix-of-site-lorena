/**
 * JornadaBeWild — Componente proprietário de jornada.
 *
 * Ativo distintivo central da marca Be Wild:
 * "Diagnóstico → Be Wild Reformas → Lançamento → BeWild Host Care → Relatórios"
 *
 * Variantes:
 *   "home"     — cards em grid com linha conectora, destaques Fase 1 / Fase 2, dois CTAs
 *   "metodo"   — cards expandidos com lista de detalhes por etapa
 *   "compacta" — linha horizontal em texto, sem cards, ideal para hero e bloco de contexto
 *
 * Uso:
 *   <JornadaBeWild variant="home" />
 *   <JornadaBeWild variant="metodo" etapas={ETAPAS_COM_DETALHE} />
 *   <JornadaBeWild variant="compacta" />
 */

import { useEffect, useRef, useState } from "react";
import { navigate } from "../../lib/useHashRoute";
import { ArrowRight, Search, PencilRuler, Megaphone, Settings2, BarChart3, CheckCircle } from "lucide-react";

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
    descricao: "Entendemos imóvel, bairro, estágio, potencial e objetivo. A conversa é consultiva: não tentamos vender antes de entender se a Be Wild faz sentido para o seu caso.",
    detalhe: [
      "Avaliação de metragem, localização e padrão do imóvel",
      "Identificação do estágio atual: cru, em reforma, pronto ou já alugando",
      "Objetivo do proprietário: preparar, operar ou jornada completa",
      "Indicação do caminho: Be Wild Reformas, BeWild Host Care ou os dois",
    ],
  },
  {
    n: "02",
    title: "Be Wild Reformas",
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
  const passos = ["Diagnóstico", "Be Wild Reformas", "Lançamento", "BeWild Host Care", "Relatórios"];
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {passos.map((p, i) => (
        <span key={p} className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-white/70">{p}</span>
          {i < passos.length - 1 && (
            <span className="text-bewild-blue/50 text-sm">→</span>
          )}
        </span>
      ))}
    </div>
  );
}

// ─── Variante: home ───────────────────────────────────────────────────────────

function JornadaHome({ showCtas = true }: { showCtas?: boolean }) {
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
            // Anima a linha gradualmente ao entrar na viewport
            let progress = 0;
            const tick = () => {
              progress = Math.min(progress + 2, 100);
              line.style.width = `${progress}%`;
              if (progress < 100) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);

            // Ativa os cards em sequência
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
      {/* Linha conectora desktop animada */}
      <div className="relative">
        <div className="hidden lg:block absolute top-8 left-[8%] right-[8%] h-px bg-white/5 pointer-events-none overflow-hidden rounded-full">
          <div
            ref={lineRef}
            className="h-full w-0 bg-gradient-to-r from-bewild-blue/20 via-bewild-gold/40 to-bewild-blue/20 transition-none rounded-full"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {ETAPAS_JORNADA.map((etapa, idx) => {
            const isPhase1 = etapa.fase === "1";
            const isPhase2 = etapa.fase === "2";
            const isHighlight = isPhase1 || isPhase2;
            const isActive = idx <= activeIdx;
            return (
              <div
                key={etapa.n}
                className={`relative rounded-2xl border p-5 transition-all duration-500 ${
                  isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                } ${
                  isPhase1
                    ? "border-bewild-gold/30 bg-bewild-gold/5"
                    : isPhase2
                    ? "border-bewild-blue/20 bg-bewild-blue/4"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <p className={`mb-3 font-mono text-2xl font-bold ${isHighlight ? "text-bewild-gold/30" : "text-bewild-blue/20"}`}>{etapa.n}</p>
                <etapa.icon
                  className={`mb-3 h-5 w-5 ${isPhase1 ? "text-bewild-gold" : isPhase2 ? "text-bewild-blue-400" : "text-white/30"}`}
                />
                <p className={`mb-1.5 text-sm font-semibold ${isHighlight ? "text-white" : "text-white/65"}`}>
                  {etapa.title}
                </p>
                <p className="text-xs text-white/40 leading-relaxed line-clamp-3">{etapa.descricao}</p>
                {isPhase1 && (
                  <span className="mt-3 inline-block text-[0.55rem] font-mono uppercase tracking-widest text-bewild-gold-accessible border border-bewild-gold/25 rounded-full px-2 py-0.5">
                    Fase 1
                  </span>
                )}
                {isPhase2 && (
                  <span className="mt-3 inline-block text-[0.55rem] font-mono uppercase tracking-widest text-bewild-blue-400 border border-bewild-blue/20 rounded-full px-2 py-0.5">
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
            className="inline-flex items-center gap-1.5 text-sm text-bewild-gold/70 hover:text-bewild-gold transition-colors"
          >
            Ver o método completo <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => navigate("/diagnostico")}
            className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors"
          >
            Iniciar meu diagnóstico <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Variante: método (expansível, com detalhe por etapa) ─────────────────────

function JornadaMetodo({ etapas }: { etapas?: EtapaDetalhe[] }) {
  const lista = etapas ?? ETAPAS_JORNADA;
  return (
    <div className="space-y-6">
      {lista.map((etapa) => {
        const isPhase1 = etapa.fase === "1";
        const isPhase2 = etapa.fase === "2";
        const isHighlight = isPhase1 || isPhase2;
        return (
          <div
            key={etapa.n}
            className={`rounded-2xl border p-6 sm:p-8 ${
              isHighlight
                ? "border-bewild-blue/30 bg-bewild-blue/5"
                : "border-white/10 bg-white/[0.03]"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
              <div className="flex items-center gap-4">
                <span className="font-mono text-3xl font-bold text-bewild-blue/25">{etapa.n}</span>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <etapa.icon className={`h-4 w-4 ${isHighlight ? "text-bewild-blue-400" : "text-white/35"}`} />
                    <p className={`font-semibold ${isHighlight ? "text-white" : "text-white/80"}`}>
                      {etapa.title}
                    </p>
                    {isHighlight && (
                      <span className="text-[0.55rem] font-mono uppercase tracking-widest text-bewild-blue-400 border border-bewild-blue/20 rounded-full px-2 py-0.5">
                        Fase {etapa.fase}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-white/55 leading-relaxed max-w-2xl">{etapa.descricao}</p>
                </div>
              </div>
            </div>

            {etapa.detalhe && etapa.detalhe.length > 0 && (
              <ul className="grid gap-2 sm:grid-cols-2 mt-2">
                {etapa.detalhe.map((d) => (
                  <li key={d} className="flex gap-2.5 text-sm text-white/55">
                    <CheckCircle className="h-4 w-4 text-bewild-blue-400/70 shrink-0 mt-0.5" />
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

// ─── Variante: mini (inline horizontal, 3 passos chave) ───────────────────────

function JornadaMini() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        { label: "Diagnóstico", sub: "Avaliação gratuita", icon: Search },
        { label: "Be Wild Reformas", sub: "Preparação do ativo", icon: PencilRuler },
        { label: "BeWild Host Care", sub: "Operação contínua", icon: Settings2 },
      ].map((item, i, arr) => (
        <div key={item.label} className="relative">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
            <item.icon className="h-5 w-5 text-bewild-blue-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-white">{item.label}</p>
            <p className="text-[0.6rem] text-white/40 mt-0.5">{item.sub}</p>
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
  showCtas?: boolean;
  etapas?: EtapaDetalhe[];
  className?: string;
}

export default function JornadaBeWild({
  variant = "home",
  showCtas = true,
  etapas,
  className = "",
}: JornadaBeWildProps) {
  return (
    <div className={className} data-component="jornada-be-wild" data-variant={variant}>
      {variant === "home" && <JornadaHome showCtas={showCtas} />}
      {variant === "metodo" && <JornadaMetodo etapas={etapas} />}
      {variant === "compacta" && <JornadaCompacta />}
      {variant === "mini" && <JornadaMini />}
    </div>
  );
}
