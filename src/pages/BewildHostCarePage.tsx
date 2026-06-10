/**
 * BewildHostCarePage — /bewild-host-care
 * Redesign completo: re-skin total no sistema visual da Home, ordem mantida.
 * Escuro só em hero, Painel do Proprietário e footer.
 */
import { useEffect, useRef, useState } from "react";
import { useSeo } from "../lib/useSeo";
import Header from "../components/landing/Header";
import Footer from "../components/landing/Footer";
import FloatingWhatsAppButton from "../components/landing/FloatingWhatsAppButton";
import { MobileBottomCTA } from "../components/landing/MobileBottomCTA";
import { StickyDiagnosticPanel } from "../components/landing/StickyDiagnosticPanel";
import { navigate } from "../lib/useHashRoute";
import { whatsappHref } from "../components/landing/content";
import { gsap } from "../lib/gsap";
import {
  Megaphone, SlidersHorizontal, Users, Sparkles, Wrench, BarChart3, Wallet,
  ShieldOff, Rocket, Clock, FileCheck, ArrowRight,
} from "lucide-react";
import "../styles/host-care.css";

const INCLUSO = [
  { icon: Megaphone, title: "Anúncio e canais", text: "Criação, otimização e gestão do imóvel no Airbnb, Booking e demais plataformas. Fotos, textos e posicionamento para maximizar visibilidade." },
  { icon: SlidersHorizontal, title: "Precificação dinâmica", text: "Ajuste de tarifas conforme demanda, eventos e concorrência. Gestão ativa de receita, não cadastro passivo." },
  { icon: Users, title: "Atendimento 24h ao hóspede", text: "Check-in, check-out, suporte durante a estadia e resolução de imprevistos. Você não vira central de atendimento." },
  { icon: Sparkles, title: "Limpeza e enxoval", text: "Limpeza profissional entre reservas, troca de enxoval e vistoria de condição a cada saída." },
  { icon: Wrench, title: "Manutenção preventiva e emergencial", text: "Acompanhamento do estado do imóvel, reparos preventivos e atendimento de emergências sem o proprietário precisar acionar ninguém." },
  { icon: BarChart3, title: "Relatórios mensais", text: "Dashboard com reservas, receita, ocupação, avaliações e repasse. Transparência total sem você pedir atualização." },
  { icon: Wallet, title: "Repasse mensal", text: "Repasse líquido do período com demonstrativo detalhado. Você acompanha o resultado sem precisar acessar as plataformas." },
];

const DIFERENCIAIS = [
  { icon: ShieldOff, title: "Sem fidelidade", text: "Saia com aviso de 30 dias. Você não fica preso em contrato longo." },
  { icon: Rocket, title: "30 dias de tráfego pago grátis", text: "A Be Wild investe nos primeiros 30 dias para ajudar o imóvel a tracionar nas plataformas." },
  { icon: Clock, title: "Suporte 24h ao hóspede", text: "O proprietário não precisa responder mensagens às 2h da manhã." },
  { icon: FileCheck, title: "Operação verificável", text: "Relatório mensal com dados reais, reservas, receita e ocupação." },
];

const FAQS = [
  { q: "O que a Be Wild faz na gestão?", a: "Cuidamos de tudo: criação e otimização do anúncio, gestão de plataformas, precificação dinâmica, atendimento ao hóspede 24h, limpeza, enxoval, vistoria, manutenção preventiva e emergencial, relatórios mensais e repasse." },
  { q: "Como funcionam as taxas?", a: "Cobramos taxa de adesão para entrada na operação e percentual sobre as reservas realizadas. O modelo detalhado é apresentado na proposta comercial após o diagnóstico do imóvel." },
  { q: "Existe fidelidade?", a: "Não. Você pode sair com aviso de 30 dias. Não existe multa ou contrato de longo prazo. Acreditamos que a continuidade da parceria deve vir do resultado, não de cláusula contratual." },
  { q: "Como funciona o suporte ao hóspede?", a: "Nossa equipe atende os hóspedes 24 horas por dia, 7 dias por semana, desde o check-in até questões durante a estadia e o check-out. Você não recebe mensagem de hóspede." },
  { q: "Quem cuida da limpeza e do enxoval?", a: "A Be Wild coordena equipe especializada em limpeza de imóveis de temporada. O enxoval é gerido e reposto conforme necessidade operacional." },
  { q: "Como funciona a manutenção?", a: "Fazemos vistorias regulares para identificar desgastes e reparos preventivos. Em caso de emergência, acionamos técnicos sem o proprietário precisar resolver nada." },
  { q: "A Be Wild garante faturamento?", a: "Não garantimos faturamento mínimo. Short stay tem sazonalidade e variáveis de mercado. Nossa promessa é gestão profissional, operação transparente e dados reais, não número fictício." },
  { q: "Meu imóvel precisa ter sido reformado pela Be Wild para entrar no BeWild Host Care?", a: "Não necessariamente. Fazemos uma vistoria para avaliar se o imóvel está pronto para operar. Se precisar de ajustes, indicamos o Be Wild Reformas. Se já estiver pronto, podemos começar diretamente." },
];

// Calendário ilustrativo: ocupação típica de junho (20 noites)
// índices 0..29 (dia 1..30). dia "hoje" = 12.
const BOOKED = new Set([2,3,4,5,8,9,10,12,13,14,15,18,19,20,21,24,25,26,27,28]);
const TODAY = 12; // dia 12

function AnimatedNumber({ value, prefix = "", suffix = "", decimals = 0, start }: { value: number; prefix?: string; suffix?: string; decimals?: number; start: boolean }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!start) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setN(value); return; }
    const dur = 1400, t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(eased * value);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, value]);
  const formatted = decimals > 0
    ? n.toFixed(decimals).replace(".", ",")
    : Math.round(n).toLocaleString("pt-BR");
  return <>{prefix}{formatted}{suffix}</>;
}

export default function BewildHostCarePage() {
  useSeo({
    title: "BeWild Host Care — Gestão de short stay sem você virar anfitrião | Be Wild",
    description:
      "Anúncio, canais, precificação, suporte 24h, limpeza, manutenção, relatórios e repasse. Sua operação de short stay em um painel claro e sem fidelidade.",
    canonicalPath: "/bewild-host-care",
    ogType: "website",
  });

  const heroRef = useRef<HTMLElement>(null);
  const painelRef = useRef<HTMLDivElement>(null);
  const [kpisStart, setKpisStart] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Hero is-ready
  useEffect(() => {
    const t = setTimeout(() => heroRef.current?.classList.add("is-ready"), 80);
    return () => clearTimeout(t);
  }, []);

  // Reveals
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".bewild-host [data-reveal]");
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const delay = parseInt(e.target.getAttribute("data-delay") || "0", 10);
            setTimeout(() => e.target.classList.add("is-in"), delay);
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.16 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // Painel: scrub de elevação + start dos KPIs a 60% da viewport
  useEffect(() => {
    const el = painelRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.opacity = "1"; el.style.transform = "none"; setKpisStart(true); return;
    }
    const ctx = gsap.context(() => {
      gsap.to(el, {
        opacity: 1, y: 0, scale: 1, ease: "none",
        scrollTrigger: {
          trigger: el, start: "top 85%", end: "top 45%", scrub: 0.6,
          onUpdate: (self) => { if (self.progress > 0.6) setKpisStart(true); },
        },
      });
    }, el);
    return () => ctx.revert();
  }, []);

  // Studio: parallax suave
  const studioRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const sec = studioRef.current;
    if (!sec) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      sec.querySelectorAll<HTMLElement>("[data-parallax]").forEach((frame) => {
        const amt = Number(frame.dataset.parallax) || -16;
        gsap.fromTo(frame, { y: -amt }, {
          y: amt, ease: "none",
          scrollTrigger: { trigger: frame, start: "top bottom", end: "bottom top", scrub: 1.2 },
        });
      });
    }, sec);
    return () => ctx.revert();
  }, []);

  return (
    <div className="bewild-host bwild-light min-h-screen antialiased">
      <Header />
      <main>
        {/* ─── HERO ─── */}
        <section ref={heroRef} className="hero" data-hero>
          <div className="hero__media">
            <img
              src="/images/apartamento-higienopolis-design-interiores-walnut-lg.jpg"
              alt="Studio Be Wild em operação para short stay"
              loading="eager"
            />
          </div>
          <div className="hero__overlay" />
          <div className="hero__grain" />
          <div className="hero__slot">SLOT · STUDIO EM OPERAÇÃO</div>

          <div className="container hero__inner">
            <p className="eyebrow eyebrow--gold hero__eyebrow">BEWILD HOST CARE · GESTÃO DE TEMPORADA</p>
            <h1 className="hero__title">
              <span className="hero__line"><span>Seu imóvel em operação,</span></span>
              <span className="hero__line"><span className="italic">sem você virar anfitrião.</span></span>
            </h1>
            <p className="hero__lead">
              Cuidamos do anúncio, canais, precificação, atendimento 24h ao hóspede, limpeza, enxoval,
              manutenção, relatórios e repasse. Você acompanha a performance sem precisar operar o
              dia a dia.
            </p>
            <div className="hero__badges">
              <span className="hero__badge">SEM FIDELIDADE</span>
              <span className="hero__badge">SUPORTE 24H</span>
              <span className="hero__badge">30 DIAS DE TRÁFEGO GRÁTIS</span>
            </div>
            <div className="hero__ctas">
              <button onClick={() => navigate("/diagnostico")} className="btn-primary">
                Operar meu imóvel <span className="arr">→</span>
              </button>
              <a
                href={whatsappHref("Olá, quero saber sobre o BeWild Host Care para meu imóvel.")}
                target="_blank" rel="noopener noreferrer"
                className="btn-ghost btn-ghost--white"
              >
                Falar no WhatsApp
              </a>
            </div>
          </div>
        </section>

        {/* ─── PROBLEMA ─── */}
        <section className="problema">
          <div className="container problema__grid">
            <div>
              <p className="eyebrow" data-reveal>O PROBLEMA INVISÍVEL</p>
              <h2 data-reveal data-delay="120">
                Short stay exige operação diária, <span className="italic">e você não deveria fazer isso sozinho</span>.
              </h2>
              <p data-reveal data-delay="240">
                Anúncio, precificação, resposta a hóspedes, limpeza, lavanderia, manutenção, vistoria,
                repasse, plataformas, avaliações. O que parece renda passiva vira operação ativa quando
                o proprietário assume tudo. O BeWild Host Care existe para eliminar essa fricção.
              </p>
            </div>
            <div className="card-destaque" data-reveal data-delay="240">
              <p className="card-destaque__title">Tarefas invisíveis do short stay:</p>
              <ul className="arrow-list">
                <li>Atualizar disponibilidade e preços nas plataformas</li>
                <li>Responder dúvidas de hóspedes antes e durante a estadia</li>
                <li>Coordenar limpeza entre reservas</li>
                <li>Repor enxoval e itens de boas-vindas</li>
                <li>Resolver manutenção de emergência</li>
                <li>Lidar com avaliações e reclamações</li>
                <li>Calcular repasse e declarar receita</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ─── PAINEL ─── */}
        <section className="painel-sec">
          <div className="container">
            <div className="painel-sec__head">
              <p className="eyebrow" data-reveal>PAINEL DO PROPRIETÁRIO</p>
              <h2 data-reveal data-delay="120">
                Você acompanha tudo, <span className="italic">sem precisar gerenciar nada</span>.
              </h2>
              <p data-reveal data-delay="240">
                Reservas, limpeza, manutenção e repasse em um painel claro. Dados ilustrativos: resultado
                real varia por imóvel e período.
              </p>
            </div>

            <div ref={painelRef} className="painel" role="img" aria-label="Painel ilustrativo do proprietário">
              <div className="painel__bar">
                <div className="painel__dots"><span /><span /><span /></div>
                <div className="painel__brand">PAINEL DO PROPRIETÁRIO · BEWILD HOST CARE</div>
                <div className="painel__live">AO VIVO</div>
              </div>

              <div className="painel__tabs">
                <span className="painel__tab is-active">VISÃO GERAL</span>
                <span className="painel__tab">RESERVAS</span>
                <span className="painel__tab">LIMPEZA</span>
                <span className="painel__tab">MANUTENÇÃO</span>
                <span className="painel__tab">REPASSE</span>
              </div>

              <div className="painel__kpis">
                <div className="kpi">
                  <div className="kpi__label">RECEITA BRUTA · JUN</div>
                  <div className="kpi__value">R$ <AnimatedNumber value={4060} start={kpisStart} /></div>
                  <div className="kpi__delta kpi__delta--up">+12% vs. mai</div>
                </div>
                <div className="kpi">
                  <div className="kpi__label">OCUPAÇÃO</div>
                  <div className="kpi__value"><AnimatedNumber value={67} start={kpisStart} suffix="%" /></div>
                  <div className="kpi__delta">20 noites</div>
                </div>
                <div className="kpi">
                  <div className="kpi__label">DIÁRIA MÉDIA</div>
                  <div className="kpi__value">R$ <AnimatedNumber value={299} start={kpisStart} /></div>
                  <div className="kpi__delta">ADR junho</div>
                </div>
                <div className="kpi">
                  <div className="kpi__label">AVALIAÇÃO</div>
                  <div className="kpi__value">
                    <AnimatedNumber value={4.9} start={kpisStart} decimals={1} /> <span className="kpi__star">★</span>
                  </div>
                  <div className="kpi__delta kpi__delta--gold">23 reviews</div>
                </div>
              </div>

              <div className="painel__cal">
                <div className="painel__cal-label">CALENDÁRIO JUNHO · OCUPAÇÃO</div>
                <div className="painel__cal-grid" aria-hidden>
                  {Array.from({ length: 30 }, (_, i) => {
                    const day = i + 1;
                    const cls = day === TODAY ? "is-today" : BOOKED.has(i) ? "is-booked" : "";
                    return <div key={i} className={`painel__cal-cell ${cls}`} />;
                  })}
                </div>
                <div className="painel__cal-legend">
                  <span><i style={{ background: "rgba(255,255,255,.07)" }} /> Disponível</span>
                  <span><i style={{ background: "#004C7F" }} /> Reservado</span>
                  <span><i style={{ background: "#C9A24B" }} /> Hoje</span>
                </div>
              </div>

              <div className="painel__next">
                <div>
                  <div className="painel__next-main">M. Ferreira · 12–15 jun · Airbnb</div>
                  <div className="painel__next-sub">4 noites · R$ 1.160 receita bruta</div>
                </div>
                <div className="painel__next-check">✓</div>
              </div>

              <div className="painel__foot">
                DADOS ILUSTRATIVOS · RESULTADO REAL VARIA POR IMÓVEL, BAIRRO E PERÍODO ·
                RESULTADO PASSADO NÃO GARANTE RESULTADO FUTURO
              </div>
            </div>
          </div>
        </section>

        {/* ─── STUDIO EM OPERAÇÃO ─── */}
        <section className="studio" ref={studioRef}>
          <div className="container">
            <div className="studio__grid">
              <div className="studio__block" data-reveal>
                <div className="studio__label">STUDIO EM OPERAÇÃO</div>
                <h3 className="studio__title">O imóvel trabalha. O proprietário descansa.</h3>
                <div className="studio__frame studio__frame--tall" data-parallax="-24">
                  <img src="/images/casa-pau-brasil-residencia-praia-cantilever-lg.jpg" alt="Studio pronto para hóspede" loading="lazy" />
                  <span className="studio__slot">SLOT · STUDIO PRONTO</span>
                </div>
              </div>
              <div className="studio__right">
                <div className="studio__block" data-reveal data-delay="120">
                  <div className="studio__label">OPERAÇÃO ENTRE RESERVAS</div>
                  <div className="studio__frame studio__frame--wide" data-parallax="-16">
                    <img src="/images/corredor-iluminacao-natural-arquitetura-residencial-md.jpg" alt="Limpeza entre reservas" loading="lazy" />
                    <span className="studio__slot">SLOT · LIMPEZA + ENXOVAL</span>
                  </div>
                </div>
                <div className="studio__block" data-reveal data-delay="240">
                  <div className="studio__label">TRANSPARÊNCIA FINANCEIRA</div>
                  <div className="studio__frame studio__frame--wide" data-parallax="-16">
                    <img src="/images/escada-escultorica-madeira-macica-design-interiores-md.jpg" alt="Relatório de repasse" loading="lazy" />
                    <span className="studio__slot">SLOT · RELATÓRIO MENSAL</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── O QUE ESTÁ INCLUSO ─── */}
        <section className="cards-sec cards-sec--cold">
          <div className="container">
            <div className="cards-sec__head">
              <p className="eyebrow" data-reveal>O QUE ESTÁ INCLUSO</p>
              <h2 data-reveal data-delay="120">
                Da criação do anúncio <span className="italic">ao repasse mensal</span>.
              </h2>
            </div>
            <div className="cards-grid cards-grid--auto">
              {INCLUSO.map((c, i) => (
                <article key={c.title} className="card-item" data-reveal data-delay={String((i % 4) * 120)}>
                  <c.icon className="card-item__icon" strokeWidth={1.4} />
                  <h3 className="card-item__title">{c.title}</h3>
                  <p className="card-item__text">{c.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ─── POR QUE É DIFERENTE ─── */}
        <section className="cards-sec cards-sec--cream">
          <div className="container">
            <div className="cards-sec__head">
              <p className="eyebrow" data-reveal>POR QUE O BEWILD HOST CARE É DIFERENTE</p>
              <h2 data-reveal data-delay="120">
                Sem amarras. <span className="italic">Com resultado verificável</span>.
              </h2>
            </div>
            <div className="cards-grid">
              {DIFERENCIAIS.map((c, i) => (
                <article key={c.title} className="card-item" data-reveal data-delay={String(i * 120)}>
                  <c.icon className="card-item__icon" strokeWidth={1.4} />
                  <h3 className="card-item__title">{c.title}</h3>
                  <p className="card-item__text">{c.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ─── IMÓVEL AINDA NÃO ESTÁ PRONTO ─── */}
        <section className="bridge">
          <div className="container reading">
            <p className="eyebrow" data-reveal>IMÓVEL AINDA NÃO ESTÁ PRONTO?</p>
            <h2 data-reveal data-delay="120">
              Gestão boa não salva <span className="italic">produto ruim</span>.
            </h2>
            <p data-reveal data-delay="240">
              Se o imóvel ainda não está preparado para competir no short stay (foto, funcionalidade,
              manutenção, setup), a gestão começa em desvantagem. O Be Wild Reformas prepara o ativo
              para o BeWild Host Care poder operar no nível certo.
            </p>
            <button onClick={() => navigate("/be-wild")} className="link-arrow" data-reveal data-delay="360">
              Conhecer o Be Wild Reformas <ArrowRight size={16} />
            </button>
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section className="faq">
          <div className="container">
            <div className="faq__head">
              <p className="eyebrow" data-reveal>PERGUNTAS FREQUENTES</p>
              <h2 data-reveal data-delay="120">FAQ BeWild Host Care</h2>
            </div>
            <div className="faq__grid">
              {FAQS.map((f, i) => (
                <div key={f.q} className={`acc${openFaq === i ? " is-open" : ""}`} data-reveal data-delay={String((i % 2) * 120)}>
                  <button
                    type="button" className="acc__btn"
                    aria-expanded={openFaq === i}
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span>{f.q}</span>
                    <span className="acc__plus" aria-hidden>+</span>
                  </button>
                  <div className="acc__panel">
                    <div className="acc__panel-inner">
                      <p className="acc__answer">{f.a}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA FINAL ─── */}
        <section className="cta-final">
          <div className="container cta-final__inner">
            <h2 data-reveal>Coloque seu imóvel para rodar.</h2>
            <p data-reveal data-delay="120">
              Conte em que estágio está seu imóvel. A gente indica o caminho: Be Wild Reformas,
              BeWild Host Care ou jornada completa.
            </p>
            <div className="cta-final__buttons" data-reveal data-delay="240">
              <button onClick={() => navigate("/diagnostico")} className="btn-primary">
                Diagnosticar meu imóvel <span className="arr">→</span>
              </button>
              <a
                href={whatsappHref("Olá, quero falar com um especialista do BeWild Host Care.")}
                target="_blank" rel="noopener noreferrer"
                className="btn-ghost btn-ghost--ink"
              >
                Falar com especialista
              </a>
            </div>
          </div>
        </section>
      </main>
      <MobileBottomCTA />
      <StickyDiagnosticPanel />
      <Footer />
      <FloatingWhatsAppButton />
    </div>
  );
}
