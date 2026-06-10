/**
 * MetodoBwildPage — /metodo-bwild
 * Redesign completo: hero escuro com mídia full-bleed, 5 etapas em scroll horizontal pinned,
 * seção do ciclo (claro), CTA final em areia, footer global.
 */
import { useEffect, useRef } from "react";
import { useSeo } from "../lib/useSeo";
import Header from "../components/landing/Header";
import { MobileBottomCTA } from "../components/landing/MobileBottomCTA";
import { StickyDiagnosticPanel } from "../components/landing/StickyDiagnosticPanel";
import Footer from "../components/landing/Footer";
import FloatingWhatsAppButton from "../components/landing/FloatingWhatsAppButton";
import { navigate } from "../lib/useHashRoute";
import { whatsappHref } from "../components/landing/content";
import JornadaPinnedTrack, { EtapaItem } from "../components/landing/JornadaPinnedTrack";
import "../styles/metodo.css";

const ETAPAS: EtapaItem[] = [
  {
    n: "01",
    title: "Diagnóstico",
    desc: "Analisamos metragem, planta, localização, padrão do prédio e objetivo de uso para entender o potencial do ativo.",
    list: [
      "Avaliação de bairro, metragem e estado",
      "Definição do caminho: Reformas, Host Care ou jornada completa",
      "Estimativa de faixa de potencial",
      "Gratuito e sem compromisso",
    ],
  },
  {
    n: "02",
    title: "Be Wild Reformas",
    fase: "1",
    sand: true,
    desc: "Projeto de arquitetura, obra turn-key, marcenaria, mobiliário e setup completo. Cada decisão pensada para foto, uso, limpeza e manutenção.",
    list: [
      "Projeto voltado para short stay",
      "Obra com gestão técnica e relatórios",
      "Marcenaria e mobiliário operacionais",
      "Entrega pronta para anunciar",
    ],
  },
  {
    n: "03",
    title: "Lançamento",
    desc: "Anúncio otimizado, foto profissional, textos e precificação calibrada para a demanda do bairro.",
    list: [
      "Foto profissional do imóvel",
      "Anúncio no Airbnb + Booking",
      "Precificação dinâmica desde o dia 1",
      "30 dias de tráfego pago grátis",
    ],
  },
  {
    n: "04",
    title: "BeWild Host Care",
    fase: "2",
    sand: true,
    desc: "Gestão da operação no dia a dia: hóspede, limpeza, manutenção, plataformas e relatórios, sem o proprietário integrar nada.",
    list: [
      "Atendimento 24h ao hóspede",
      "Limpeza e enxoval entre reservas",
      "Manutenção preventiva e emergencial",
      "Calendários sincronizados",
    ],
  },
  {
    n: "05",
    title: "Acompanhamento",
    desc: "Relatório mensal com dados reais de reservas, receita e ocupação, e repasse líquido até o dia 10.",
    list: [
      "Relatório mensal transparente",
      "Repasse com demonstrativo detalhado",
      "Sem fidelidade: aviso de 30 dias",
      "Dados reais, sem número fictício",
    ],
  },
];

const NODES = ["DIAGNÓSTICO", "REFORMA", "LANÇAMENTO", "OPERAÇÃO", "REPASSE"];

export default function MetodoBwildPage() {
  useSeo({
    title: "Método Be Wild — Do diagnóstico ao repasse | Be Wild",
    description:
      "Conheça o método Be Wild: diagnóstico, Be Wild Reformas, lançamento, BeWild Host Care e acompanhamento contínuo. Uma jornada para o investidor que não quer operar sozinho.",
    canonicalPath: "/metodo-bwild",
    ogType: "website",
  });

  const heroRef = useRef<HTMLElement>(null);

  // Hero: liga is-ready logo após mount
  useEffect(() => {
    const t = setTimeout(() => heroRef.current?.classList.add("is-ready"), 80);
    return () => clearTimeout(t);
  }, []);

  // Reveals padrão
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".metodo [data-reveal]");
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

  // Pills do ciclo: acender em sequência
  const cicloRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const wrap = cicloRef.current;
    if (!wrap) return;
    const pills = wrap.querySelectorAll<HTMLElement>(".nodes__pill");
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            pills.forEach((p, i) => setTimeout(() => p.classList.add("is-on"), i * 380));
            obs.disconnect();
          }
        });
      },
      { threshold: 0.4 }
    );
    obs.observe(wrap);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="metodo bwild-light min-h-screen antialiased">
      <Header />
      <main>
        {/* ─── HERO ─── */}
        <section ref={heroRef} className="hero" data-hero>
          <div className="hero__media">
            <img
              src="/images/lorena-alves-arquiteta-uberlandia-retrato-lg.jpg"
              alt="Time Be Wild visitando imóvel para diagnóstico"
              loading="eager"
            />
          </div>
          <div className="hero__overlay" />
          <div className="hero__grain" />

          <div className="hero__slot">SLOT · VÍDEO DO TIME</div>

          <div className="container hero__inner">
            <p className="eyebrow eyebrow--gold hero__eyebrow">JORNADA BE WILD</p>
            <h1 className="hero__title">
              <span className="hero__line"><span>Do diagnóstico ao repasse:</span></span>
              <span className="hero__line"><span className="italic">o método Be Wild.</span></span>
            </h1>
            <p className="hero__lead">
              O imóvel não vira renda quando a escritura sai. Ele vira renda quando está preparado,
              anunciado, precificado, limpo, mantido e operado. A Be Wild cuida de todo esse ciclo.
            </p>
            <div className="hero__cta">
              <button onClick={() => navigate("/diagnostico")} className="btn-primary">
                Iniciar diagnóstico <span className="arr">→</span>
              </button>
            </div>
          </div>

          <div className="hero__scroll">ROLE PARA DESCER</div>
        </section>

        {/* ─── ETAPAS ─── */}
        <section className="etapas">
          <div className="container etapas__head">
            <p className="eyebrow" data-reveal>AS 5 ETAPAS</p>
            <h2 data-reveal data-delay="120">
              Cada etapa conecta <span className="italic">com a próxima</span>.
            </h2>
            <p data-reveal data-delay="240">
              O que sai de uma etapa entra pronto na seguinte: decisão de projeto vira facilidade de
              operação, entrega vira anúncio, anúncio vira reserva.
            </p>
          </div>
          <JornadaPinnedTrack etapas={ETAPAS} />
        </section>

        {/* ─── CICLO ─── */}
        <section className="ciclo">
          <div className="container reading" ref={cicloRef}>
            <p className="eyebrow" data-reveal>POR QUE O CICLO INTEIRO IMPORTA</p>
            <h2 data-reveal data-delay="120">
              Não é reforma + gestão. É <span className="italic">continuidade</span> entre criação e operação do ativo.
            </h2>
            <p data-reveal data-delay="240">
              O problema de contratar tudo separado é que ninguém é dono do ciclo inteiro. O arquiteto
              entrega o projeto. O reformeiro entrega a obra. A gestora tenta operar o que recebeu. E o
              investidor fica no meio, costurando decisões, prazos, compras, ajustes, anúncios e hóspedes.
            </p>
            <p data-reveal data-delay="360">
              A Be Wild foi criada para reduzir essa fragmentação: o Be Wild Reformas prepara o imóvel
              pensando na operação; o BeWild Host Care assume a rotina sem o proprietário precisar
              integrar nada.
            </p>
            <div className="nodes" data-reveal data-delay="480">
              {NODES.map((n, i) => (
                <span key={n} style={{ display: "inline-flex", alignItems: "center", gap: ".35rem" }}>
                  <span className="nodes__pill">{n}</span>
                  {i < NODES.length - 1 && <span className="nodes__arrow">→</span>}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA FINAL ─── */}
        <section className="cta-final">
          <div className="container cta-final__inner">
            <h2 data-reveal>Descubra em qual etapa seu imóvel está.</h2>
            <p data-reveal data-delay="120">
              O diagnóstico Be Wild identifica o estágio do seu imóvel e indica o caminho certo:
              Be Wild Reformas, BeWild Host Care ou jornada completa.
            </p>
            <div className="cta-final__buttons" data-reveal data-delay="240">
              <button onClick={() => navigate("/diagnostico")} className="btn-primary">
                Diagnosticar meu imóvel <span className="arr">→</span>
              </button>
              <a
                href={whatsappHref("Olá, quero entender como o método Be Wild funciona para o meu imóvel.")}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost btn-ghost--dark"
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
