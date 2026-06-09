/**
 * Home — Be Wild
 * Light mode editorial. Hero full-bleed (Tabas/Mynd).
 * Efeitos: slideIn hero (Guesty), marquee logos, cards com sombra, serif italic (Mynd).
 * Sprint A — Redesign completo
 */

import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle, MapPin, BarChart3, Wrench, Star } from "lucide-react";
import Header from "./components/landing/Header";
import Footer from "./components/landing/Footer";
import FloatingWhatsAppButton from "./components/landing/FloatingWhatsAppButton";
import { MobileBottomCTA } from "./components/landing/MobileBottomCTA";
import { StickyDiagnosticPanel } from "./components/landing/StickyDiagnosticPanel";
import JornadaBeWild from "./components/landing/JornadaBeWild";
import { ImagePlaceholder } from "./components/landing/ImagePlaceholder";
import { navigate } from "./lib/useHashRoute";
import { useInView } from "./lib/useBwMotion";

/* ─── Proof bar — métricas de credibilidade ─────────────── */
const METRICAS = [
  { value: "48+", label: "Imóveis preparados" },
  { value: "67%",  label: "Ocupação média alcançada" },
  { value: "R$3.8k", label: "Receita bruta/mês referência" },
  { value: "4.9★",  label: "Avaliação média (Airbnb)" },
];

/* ─── Counter animado (Mynd-style) ─────────────────────── */
function AnimatedStat({ value, label }: { value: string; label: string }) {
  const [ref, inView] = useInView<HTMLDivElement>(0.5);
  const [played, setPlayed] = useState(false);
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!inView || played) return;
    setPlayed(true);
    // Extrai número e sufixo
    const match = value.match(/^([R$\s]*)(\d+(?:[.,]\d+)?)([^0-9]*)$/);
    if (!match) { setDisplay(value); return; }
    const prefix = match[1];
    const num = parseFloat(match[2].replace(",", "."));
    const suffix = match[3];
    const dur = 900;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const cur = Math.round(eased * num * 10) / 10;
      setDisplay(`${prefix}${cur % 1 === 0 ? cur : cur.toFixed(1)}${suffix}`);
      if (t < 1) requestAnimationFrame(tick);
      else setDisplay(value);
    };
    requestAnimationFrame(tick);
  }, [inView, played, value]);

  return (
    <div ref={ref} className="text-center">
      <p className="bw-proof-number">{display}</p>
      <p className="bw-proof-label text-xs">{label}</p>
    </div>
  );
}

/* ─── Reveal ao scroll ──────────────────────────────────── */
function Reveal({ children, delay = 0, className = "" }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const [ref, inView] = useInView<HTMLDivElement>(0.15);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.48s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.48s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ─── Problema — cards de dor ───────────────────────────── */
const PROBLEMAS = [
  "Reforma entregue, imóvel parado sem gerar renda",
  "Sem tempo para gerenciar Airbnb e hóspedes",
  "Anúncio ativo, mas ocupação abaixo do esperado",
  "Imóvel \"bom\" que não converte nas fotos",
  "Gestora cobra caro e some quando há problema",
];

/* ─── Home ──────────────────────────────────────────────── */
export default function App() {
  // Hero reveal — slideIn estilo Guesty
  const [heroReady, setHeroReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setHeroReady(true), 80);
    return () => clearTimeout(t);
  }, []);

  const heroBase = "transition-all ease-out";

  return (
    <div className="bwild-light min-h-screen" style={{ fontFamily: "var(--bw-font-body)" }}>
      <Header />

      <main>
        {/* ── HERO — full-bleed (Tabas/Mynd) ─────────────────── */}
        <section className="bw-hero" style={{ minHeight: "92vh" }}>
          {/* Fundo — placeholder da foto P0 */}
          <div className="bw-hero-bg">
            <ImagePlaceholder
              assetId="hero-studio"
              className="w-full h-full"
              showReveal={false}
              overlay={false}
            />
          </div>
          {/* Overlay gradiente */}
          <div className="bw-hero-overlay" />

          {/* Conteúdo */}
          <div className="bw-hero-content w-full mx-auto max-w-[76rem] px-5 sm:px-8 py-32">
            <div className="max-w-2xl">
              {/* Eyebrow */}
              <p
                className={`${heroBase} duration-[480ms] delay-[0ms] mb-5 text-xs font-mono uppercase tracking-[0.14em] text-bewild-gold`}
                style={{ opacity: heroReady ? 1 : 0, transform: heroReady ? "none" : "translateY(12px)" }}
              >
                São Paulo · Short Stay
              </p>

              {/* H1 — Poppins bold (Tabas/Mynd) */}
              <h1
                className={`${heroBase} duration-[600ms] delay-[100ms] text-white font-bold leading-[1.08] mb-4`}
                style={{
                  fontSize: "clamp(2.5rem, 5.5vw, 4rem)",
                  letterSpacing: "-0.025em",
                  opacity: heroReady ? 1 : 0,
                  transform: heroReady ? "translateX(0)" : "translateX(50px)", // Guesty slideIn
                }}
              >
                Seu imóvel no short stay,<br />
                <em
                  className="not-italic"
                  style={{ fontFamily: "var(--bw-font-display)", fontStyle: "italic", fontWeight: 400, color: "#F7F4EF" }}
                >
                  da reforma à gestão.
                </em>
              </h1>

              {/* Subtítulo */}
              <p
                className={`${heroBase} duration-[500ms] delay-[220ms] text-white/75 mb-8 leading-relaxed`}
                style={{
                  fontSize: "clamp(1rem, 2vw, 1.125rem)",
                  opacity: heroReady ? 1 : 0,
                  transform: heroReady ? "none" : "translateY(16px)",
                }}
              >
                Você entra com o imóvel. A Be Wild entrega a operação pronta — reforma, lançamento, gestão e repasse.
              </p>

              {/* CTAs */}
              <div
                className={`${heroBase} duration-[480ms] delay-[360ms] flex flex-wrap gap-3`}
                style={{ opacity: heroReady ? 1 : 0, transform: heroReady ? "none" : "translateY(16px)" }}
              >
                <button
                  onClick={() => navigate("/diagnostico")}
                  className="bw-btn-dark inline-flex items-center gap-2"
                >
                  Diagnosticar meu imóvel <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => navigate("/cases")}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg border border-white/30 text-white text-sm font-semibold hover:bg-white/10 transition-colors duration-[260ms]"
                >
                  Ver cases reais <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              {/* Mini prova social no hero */}
              <div
                className={`${heroBase} duration-[480ms] delay-[500ms] mt-10 flex items-center gap-6 flex-wrap`}
                style={{ opacity: heroReady ? 1 : 0 }}
              >
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-bewild-gold text-bewild-gold" />
                    ))}
                  </div>
                  <span className="text-xs text-white/65">4.9 no Airbnb</span>
                </div>
                <span className="h-3 w-px bg-white/20" />
                <span className="text-xs text-white/65">48+ imóveis preparados em SP</span>
                <span className="h-3 w-px bg-white/20" />
                <span className="text-xs text-white/65">Pinheiros · Itaim · Vila Madalena</span>
              </div>
            </div>
          </div>

          {/* Seta scroll down */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce opacity-50">
            <div className="h-8 w-5 rounded-full border-2 border-white/40 flex items-start justify-center pt-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-white/70" />
            </div>
          </div>
        </section>

        {/* ── PROOF BAR — métricas Mynd-style ────────────────── */}
        <section className="bg-white border-y border-bewild-cream-200">
          <div className="mx-auto max-w-[76rem] px-5 sm:px-8 py-12 sm:py-16">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-4">
              {METRICAS.map((m) => (
                <AnimatedStat key={m.label} value={m.value} label={m.label} />
              ))}
            </div>
            <p className="text-center text-[10px] text-bewild-text-muted mt-6 font-mono uppercase tracking-widest">
              Referência de mercado SP 2025/2026 · Resultado passado não garante resultado futuro
            </p>
          </div>
        </section>

        {/* ── O PROBLEMA — cream com cards ───────────────────── */}
        <section className="py-20 sm:py-28" style={{ backgroundColor: "var(--bw-cream)" }}>
          <div className="mx-auto max-w-[76rem] px-5 sm:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <Reveal>
                <p className="bw-eyebrow mb-4">O problema</p>
                <h2 className="text-3xl sm:text-4xl font-bold text-bewild-ink leading-tight mb-4" style={{ letterSpacing: "-0.02em" }}>
                  Reformar é só o começo.{" "}
                  <span className="bw-serif" style={{ fontFamily: "var(--bw-font-display)", fontStyle: "italic", fontWeight: 400 }}>
                    A maioria dos imóveis para por aí.
                  </span>
                </h2>
                <p className="text-bewild-text-body leading-relaxed mb-8">
                  O ciclo completo — reforma com foco em short stay, lançamento profissional, gestão ativa e repasse mensal — é o que transforma um ativo parado em operação rodando.
                </p>
                <button
                  onClick={() => navigate("/diagnostico")}
                  className="bw-link-arrow"
                >
                  Ver como a Be Wild resolve <ArrowRight className="arrow h-4 w-4" />
                </button>
              </Reveal>

              <Reveal delay={80}>
                <div className="space-y-3">
                  {PROBLEMAS.map((p, i) => (
                    <div
                      key={i}
                      className="bw-card-cream flex items-center gap-3 px-4 py-3.5 text-sm"
                      style={{
                        transitionDelay: `${i * 40}ms`,
                      }}
                    >
                      <span className="flex-shrink-0 h-5 w-5 rounded-full bg-bewild-cream-200 flex items-center justify-center">
                        <span className="h-1.5 w-1.5 rounded-full bg-bewild-text-muted" />
                      </span>
                      <span className="text-bewild-text-body">{p}</span>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── PRODUTOS — cards brancos flutuantes ─────────────── */}
        <section className="py-20 sm:py-28 bg-white border-t border-bewild-cream-200">
          <div className="mx-auto max-w-[76rem] px-5 sm:px-8">
            <Reveal className="text-center mb-14">
              <p className="bw-eyebrow mb-3">O que fazemos</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-bewild-ink" style={{ letterSpacing: "-0.02em" }}>
                Dois produtos. Um ciclo completo.
              </h2>
            </Reveal>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Produto 1 — Be Wild Reformas */}
              <Reveal>
                <div className="bw-card p-8 h-full flex flex-col">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-xl bg-bewild-gold/10 flex items-center justify-center">
                      <Wrench className="h-5 w-5 text-bewild-gold" />
                    </div>
                    <div>
                      <p className="text-xs text-bewild-text-muted font-mono uppercase tracking-widest">Fase 1</p>
                      <p className="font-bold text-bewild-ink">Be Wild Reformas</p>
                    </div>
                  </div>
                  <p className="text-bewild-text-body leading-relaxed mb-6 flex-1">
                    Reforma, design, obra, mobiliário, decoração e setup completo para short stay. Cada decisão pensada para foto, operação e manutenção.
                  </p>
                  <ul className="space-y-2 mb-8">
                    {["Projeto voltado para short stay", "Material com durabilidade operacional", "Enxoval, eletros e fechadura digital", "Entrega pronta para hospedar"].map(item => (
                      <li key={item} className="flex items-center gap-2 text-sm text-bewild-text-body">
                        <CheckCircle className="h-4 w-4 text-bewild-gold flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => navigate("/be-wild")}
                    className="bw-link-arrow mt-auto"
                  >
                    Conhecer o processo <ArrowRight className="arrow h-4 w-4" />
                  </button>
                </div>
              </Reveal>

              {/* Produto 2 — BeWild Host Care */}
              <Reveal delay={80}>
                <div className="bw-card p-8 h-full flex flex-col" style={{ background: "var(--bw-ink)" }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-xl bg-bewild-gold/20 flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-bewild-gold" />
                    </div>
                    <div>
                      <p className="text-xs text-white/40 font-mono uppercase tracking-widest">Fase 2</p>
                      <p className="font-bold text-white">BeWild Host Care</p>
                    </div>
                  </div>
                  <p className="text-white/65 leading-relaxed mb-6 flex-1">
                    Gestão profissional completa: anúncio, precificação dinâmica, atendimento 24h, check-in/out, limpeza, manutenção e repasse mensal.
                  </p>
                  <ul className="space-y-2 mb-8">
                    {["Airbnb + Booking com calendário sincronizado", "Precificação dinâmica diária", "Operação 24h — você não precisa fazer nada", "Relatório e repasse até dia 10"].map(item => (
                      <li key={item} className="flex items-center gap-2 text-sm text-white/65">
                        <CheckCircle className="h-4 w-4 text-bewild-gold flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => navigate("/bewild-host-care")}
                    className="bw-link-arrow !text-bewild-gold mt-auto"
                  >
                    Ver a operação <ArrowRight className="arrow h-4 w-4" />
                  </button>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── JORNADA ─────────────────────────────────────────── */}
        <section className="py-20 sm:py-28 border-t border-bewild-cream-200" style={{ backgroundColor: "var(--bw-cream)" }}>
          <div className="mx-auto max-w-[76rem] px-5 sm:px-8">
            <Reveal className="mb-14">
              <p className="bw-eyebrow mb-3">Do zero ao repasse</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-bewild-ink" style={{ letterSpacing: "-0.02em" }}>
                A jornada Be Wild.
              </h2>
            </Reveal>
            <JornadaBeWild variant="home" />
          </div>
        </section>

        {/* ── BAIRROS — logos marquee (Guesty-style) ─────────── */}
        <section className="py-16 bg-white border-t border-bewild-cream-200 overflow-hidden">
          <div className="mx-auto max-w-[76rem] px-5 sm:px-8 mb-8">
            <p className="text-center bw-eyebrow">Bairros em operação · São Paulo</p>
          </div>
          <div className="relative overflow-hidden">
            <div
              className="flex gap-8 bw-marquee-track whitespace-nowrap"
              style={{ width: "max-content" }}
            >
              {[...Array(2)].map((_, rep) =>
                ["Pinheiros", "Itaim Bibi", "Vila Madalena", "Vila Olímpia", "Brooklin", "Consolação", "Vila Mariana", "Moema", "Perdizes", "Jardins"].map((b) => (
                  <span
                    key={`${rep}-${b}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-bewild-cream-200 bg-bewild-cream text-sm font-medium text-bewild-text-body"
                  >
                    <MapPin className="h-3.5 w-3.5 text-bewild-gold" />
                    {b}
                  </span>
                ))
              )}
            </div>
          </div>
        </section>

        {/* ── SIMULADOR CTA ───────────────────────────────────── */}
        <Reveal>
          <section className="py-20 sm:py-28 bg-white border-t border-bewild-cream-200">
            <div className="mx-auto max-w-[76rem] px-5 sm:px-8">
              <div className="rounded-2xl p-10 sm:p-16 text-center" style={{ backgroundColor: "var(--bw-cream)" }}>
                <p className="bw-eyebrow mb-4">Simulador</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-bewild-ink mb-4" style={{ letterSpacing: "-0.02em" }}>
                  Qual o potencial do seu imóvel?
                </h2>
                <p className="text-bewild-text-body mb-8 max-w-md mx-auto leading-relaxed">
                  Estimativa de faixa de receita por bairro e tipo — sem promessa de resultado.
                </p>
                <button
                  onClick={() => navigate("/simulador")}
                  className="bw-btn-primary inline-flex items-center gap-2"
                >
                  Simular agora <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>
        </Reveal>

        {/* ── DIAGNÓSTICO FINAL CTA ───────────────────────────── */}
        <section className="py-24 sm:py-32" style={{ backgroundColor: "var(--bw-ink)" }}>
          <div className="mx-auto max-w-[76rem] px-5 sm:px-8 text-center">
            <Reveal>
              <p className="text-xs font-mono uppercase tracking-[0.14em] text-bewild-gold mb-5">
                Próximo passo
              </p>
              <h2
                className="text-white font-bold mb-5"
                style={{ fontSize: "clamp(2rem, 4vw, 3rem)", letterSpacing: "-0.02em", lineHeight: 1.1 }}
              >
                Seu imóvel tem potencial?<br />
                <span className="bw-serif" style={{ fontFamily: "var(--bw-font-display)", fontStyle: "italic", fontWeight: 400, color: "rgba(247,244,239,0.7)" }}>
                  Vamos descobrir juntos.
                </span>
              </h2>
              <p className="text-white/55 mb-10 max-w-md mx-auto leading-relaxed">
                Diagnóstico gratuito. Sem compromisso. Avaliamos o seu ativo antes de qualquer recomendação.
              </p>
              <button
                onClick={() => navigate("/diagnostico")}
                className="bw-btn-dark inline-flex items-center gap-2"
                style={{ fontSize: "1rem", padding: "16px 36px" }}
              >
                Diagnosticar meu imóvel <ArrowRight className="h-5 w-5" />
              </button>
            </Reveal>
          </div>
        </section>
      </main>

      <Footer />
      <MobileBottomCTA />
      <StickyDiagnosticPanel />
      <FloatingWhatsAppButton />
    </div>
  );
}
