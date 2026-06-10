/**
 * BeWildPage — /be-wild
 * Redesign completo: re-skin total no sistema visual da Home, ordem das seções mantida.
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
import MaterialLaminas, { MaterialLaminasArrows, LaminaItem } from "../components/landing/MaterialLaminas";
import { gsap } from "../lib/gsap";
import { Layers, Wrench, Lightbulb, ShieldCheck, ArrowRight } from "lucide-react";
import "../styles/be-wild.css";

const METODO = [
  { n: "01", title: "Diagnóstico do imóvel", text: "Analisamos metragem, planta, localização, padrão do prédio e objetivo de uso para entender o potencial do ativo." },
  { n: "02", title: "Projeto de arquitetura", text: "Layout, marcenaria, iluminação, acabamentos e soluções pensadas para foto, uso, limpeza e manutenção, não apenas para a entrega." },
  { n: "03", title: "Obra e execução", text: "Cronograma, fornecedores, controle de etapas, fotos e relatórios. A obra avança com gestão técnica e comunicação centralizada." },
  { n: "04", title: "Mobiliário e compras", text: "Curadoria de móveis, eletros, decoração, enxoval e itens operacionais para o imóvel sair pronto para anúncio e operação." },
  { n: "05", title: "Setup e entrega", text: "Finalização, limpeza, montagem, ajustes finais e imóvel fotografável, funcional e pronto para entrar no mercado." },
];

const DECISOES = [
  { icon: Layers, title: "Layout funcional", text: "Facilita limpeza, circulação, foto e experiência do hóspede desde o projeto." },
  { icon: Wrench, title: "Materiais duráveis", text: "Escolha que considera resistência, limpeza, reposição e custo total, não só estética." },
  { icon: Lightbulb, title: "Iluminação estratégica", text: "A luz certa melhora a foto, a percepção de qualidade e a experiência do hóspede." },
  { icon: ShieldCheck, title: "Compatível com operação", text: "Fechadura digital, check-in remoto, documentação de escopo e fácil manutenção já previstos no projeto." },
];

const LAMINAS: LaminaItem[] = [
  { cat: "PISO", title: "Porcelanato matte, prioridade sobre acetinado",
    desc: "Acetinado parece bonito na foto, mas ranha e marca com o uso. Matte ou vinílico de alta resistência: durável, fotogênico e com reposição parcial barata.",
    slot: "SLOT · PISO INSTALADO" },
  { cat: "ILUMINAÇÃO", title: "Faixa de LED no forro, no lugar do ponto central",
    desc: "O ponto único no teto é o erro mais comum. A luz indireta embutida custa menos e muda a foto do anúncio.",
    slot: "SLOT · LUZ INDIRETA" },
  { cat: "JANELAS", title: "Persiana blackout, no lugar de cortina de tecido",
    desc: "Cada lavagem de cortina é uma hora de operação. Persiana de rolo em tecido técnico custa mais na compra e economiza por anos.",
    slot: "SLOT · PERSIANA" },
  { cat: "ENXOVAL", title: "Qualidade de hotel, reposição planejada",
    desc: "É o item mais citado em avaliações 5 estrelas. Conforto da cama pesa mais na nota do que acabamento de luxo em área sem foto.",
    slot: "SLOT · CAMA" },
  { cat: "ENERGIA", title: "Tomadas: 2 por lado da cama + bancada + entrada",
    desc: "Hóspede que viaja a trabalho, perfil dominante nos bairros corporativos de SP, pontua mal imóveis sem pontos de energia suficientes.",
    slot: "SLOT · TOMADAS" },
  { cat: "CLIMATIZAÇÃO", title: "Posicionamento estratégico no layout",
    desc: "Conforto térmico sem aparecer na foto principal e sem soprar na cama: decisão de projeto, não de instalação.",
    slot: "SLOT · AR-CONDICIONADO" },
];

const ACAB_SLOTS = [
  "SLOT · MARCENARIA + LED",
  "SLOT · BANCADA · LUZ QUENTE",
  "SLOT · MACRO ACABAMENTO",
];

const NODES = ["DIAGNÓSTICO", "BE WILD REFORMAS", "BEWILD HOST CARE"];

const FAQS = [
  { q: "Qual a diferença entre reformar para morar e preparar para short stay?",
    a: "Uma reforma para moradia prioriza o gosto do proprietário. A preparação para short stay considera foto, diária, experiência do hóspede, limpeza rápida, manutenção preventiva e durabilidade de uso intenso. São decisões de projeto diferentes desde o início." },
  { q: "O que está incluso no Be Wild?",
    a: "Projeto de arquitetura, obra civil, marcenaria sob medida, compra de mobiliário, decoração, enxoval e setup operacional. Tudo coordenado em um único processo." },
  { q: "Quanto tempo leva o projeto e a obra?",
    a: "Depende do estado atual e da metragem do imóvel. Em média, studios compactos ficam prontos em 45 a 90 dias. Detalhamos o cronograma no diagnóstico." },
  { q: "O imóvel já sai pronto para entrar no BeWild Host Care?",
    a: "Sim. Cada decisão do Be Wild considera a operação que vem depois: foto, anúncio, limpeza, manutenção e experiência do hóspede. Quando a obra acaba, o BeWild Host Care já pode colocar o ativo para rodar." },
  { q: "Como funciona o acompanhamento durante a obra?",
    a: "Você recebe fotos, relatórios de etapas e cronograma atualizado. A gestão técnica é feita pela Be Wild, sem você precisar ir ao imóvel para saber o que está acontecendo." },
  { q: "Vocês atendem imóveis fora de São Paulo?",
    a: "No momento atuamos em São Paulo. Entre em contato para verificar a viabilidade da sua região." },
];

export default function BeWildPage() {
  useSeo({
    title: "Be Wild Reformas — Preparação do ativo para short stay | Be Wild",
    description:
      "Projeto, obra, mobiliário e setup integrados para transformar seu imóvel em um espaço pronto para competir no short stay. Cada decisão pensada para foto, uso, limpeza e operação.",
    canonicalPath: "/be-wild",
    ogType: "website",
  });

  const heroRef = useRef<HTMLElement>(null);
  const metodoLineRef = useRef<HTMLDivElement>(null);
  const metodoSecRef = useRef<HTMLDivElement>(null);
  const cicloRef = useRef<HTMLDivElement>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Hero is-ready
  useEffect(() => {
    const t = setTimeout(() => heroRef.current?.classList.add("is-ready"), 80);
    return () => clearTimeout(t);
  }, []);

  // Reveals
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".bewild-reformas [data-reveal]");
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

  // Linha do método em gold, scrub
  useEffect(() => {
    const sec = metodoSecRef.current;
    const fill = metodoLineRef.current;
    if (!sec || !fill) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      fill.style.width = "100%"; return;
    }
    const ctx = gsap.context(() => {
      gsap.to(fill, {
        width: "100%", ease: "none",
        scrollTrigger: { trigger: sec, start: "top 70%", end: "bottom 60%", scrub: 0.6 },
      });
    }, sec);
    return () => ctx.revert();
  }, []);

  // Ciclo pills
  useEffect(() => {
    const wrap = cicloRef.current;
    if (!wrap) return;
    const pills = wrap.querySelectorAll<HTMLElement>(".nodes__pill");
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          pills.forEach((p, i) => setTimeout(() => p.classList.add("is-on"), i * 380));
          obs.disconnect();
        }
      }),
      { threshold: 0.4 }
    );
    obs.observe(wrap);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="bewild-reformas bwild-light min-h-screen antialiased">
      <Header />
      <main>
        {/* ─── HERO ─── */}
        <section ref={heroRef} className="hero" data-hero>
          <div className="hero__media">
            <img
              src="/images/casa-jequitiba-interior-contemporaneo-brasileiro-lg.jpg"
              alt="Imóvel em preparação para short stay pela Be Wild"
              loading="eager"
            />
          </div>
          <div className="hero__overlay" />
          <div className="hero__grain" />
          <div className="hero__slot">SLOT · OBRA EM ANDAMENTO</div>

          <div className="container hero__inner">
            <p className="eyebrow eyebrow--gold hero__eyebrow">BE WILD REFORMAS · PREPARAÇÃO DO ATIVO</p>
            <h1 className="hero__title">
              <span className="hero__line"><span>Prepare seu imóvel para</span></span>
              <span className="hero__line"><span className="italic">competir no short stay.</span></span>
            </h1>
            <p className="hero__lead">
              Projeto, obra, marcenaria, mobiliário, compras, decoração e setup em um fluxo único.
              Cada decisão pensada para foto, uso, limpeza, manutenção e experiência do hóspede,
              não apenas para a entrega.
            </p>
            <div className="hero__ctas">
              <button onClick={() => navigate("/diagnostico")} className="btn-primary">
                Preparar meu imóvel <span className="arr">→</span>
              </button>
              <a
                href={whatsappHref("Olá, quero saber mais sobre o Be Wild Reformas para meu imóvel.")}
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
              <p className="eyebrow" data-reveal>O PROBLEMA</p>
              <h2 data-reveal data-delay="120">
                Reformar para morar é diferente <span className="italic">de preparar para a diária</span>.
              </h2>
              <p data-reveal data-delay="240">
                Uma obra comum prioriza o gosto do proprietário. A preparação de um ativo para short
                stay exige decisões diferentes desde o projeto: materiais para uso intenso, layout
                que facilita limpeza, iluminação fotografável e setup compatível com operação remota.
                Sem essa visão, o imóvel fica bonito, mas pouco competitivo.
              </p>
            </div>
            <div className="card-destaque" data-reveal data-delay="240">
              <p className="card-destaque__title">
                Não é sobre deixar bonito. É sobre preparar o ativo para operar melhor.
              </p>
              <ul className="arrow-list">
                <li>Projeto pensado para diária, foto, limpeza e manutenção</li>
                <li>Obra, marcenaria, mobiliário e compras integradas</li>
                <li>Materiais para uso intensivo, não apenas estética</li>
                <li>Entrega pronta para anunciar e operar</li>
                <li>Ideal para studios recém-entregues, imóveis vazios ou mal aproveitados</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ─── MÉTODO ─── */}
        <section className="metodo-sec" ref={metodoSecRef}>
          <div className="container">
            <div className="metodo-sec__head">
              <p className="eyebrow" data-reveal>MÉTODO BE WILD</p>
              <h2 data-reveal data-delay="120">
                Do diagnóstico à entrega <span className="italic">pronta para operar</span>.
              </h2>
            </div>
            <div className="metodo-grid">
              <div className="metodo-line" aria-hidden>
                <div ref={metodoLineRef} className="metodo-line__fill" />
              </div>
              {METODO.map((s, i) => (
                <article
                  key={s.n}
                  className="metodo-card"
                  data-reveal
                  data-delay={String(i * 120)}
                >
                  <span className="metodo-card__n">{s.n}</span>
                  <h3 className="metodo-card__title">{s.title}</h3>
                  <p className="metodo-card__text">{s.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ─── DECISÕES ─── */}
        <section className="decisoes">
          <div className="container">
            <div className="decisoes__head">
              <p className="eyebrow" data-reveal>DECISÕES QUE VENDEM OPERAÇÃO DEPOIS</p>
              <h2 data-reveal data-delay="120">
                Cada escolha de projeto pensa <span className="italic">na gestão que vem depois</span>.
              </h2>
            </div>
            <div className="decisoes-grid">
              {DECISOES.map((d, i) => (
                <article key={d.title} className="decisao-card" data-reveal data-delay={String(i * 120)}>
                  <d.icon className="decisao-card__icon" strokeWidth={1.4} />
                  <h3 className="decisao-card__title">{d.title}</h3>
                  <p className="decisao-card__text">{d.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ─── MATERIAL BOARD ─── */}
        <section className="mboard">
          <div className="container">
            <div className="mboard__top">
              <div className="mboard__head">
                <p className="eyebrow" data-reveal>MATERIAL BOARD</p>
                <h2 data-reveal data-delay="120">
                  Decisões de projeto <span className="italic">com justificativa comercial</span>.
                </h2>
                <p data-reveal data-delay="240">
                  O que escolhemos, o que evitamos e por que isso aparece na diária, na foto e no
                  custo de operação.
                </p>
              </div>
              <div data-reveal data-delay="240"><MaterialLaminasArrows /></div>
            </div>
            <div data-reveal data-delay="360">
              <MaterialLaminas laminas={LAMINAS} />
            </div>
          </div>
        </section>

        {/* ─── ACABAMENTO ─── */}
        <section className="acab">
          <div className="container">
            <div className="acab__head">
              <p className="eyebrow" data-reveal>ACABAMENTO</p>
              <h2 data-reveal data-delay="120">
                Detalhes que fazem diferença <span className="italic">na foto e na operação</span>.
              </h2>
            </div>
            <div className="acab__grid">
              {ACAB_SLOTS.map((slot, i) => (
                <div key={slot} className="acab__frame" data-reveal data-delay={String(i * 120)}>
                  <img
                    src="/images/detalhe-materiais-madeira-concreto-arquitetura-brasileira-md.jpg"
                    alt={`Detalhe de acabamento ${i + 1}`}
                    loading="lazy"
                  />
                  <span className="acab__slot">{slot}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── JORNADA CONTINUA ─── */}
        <section className="jornada">
          <div className="container reading" ref={cicloRef}>
            <p className="eyebrow" data-reveal>A JORNADA CONTINUA</p>
            <h2 data-reveal data-delay="120">
              A entrega da obra não é o fim. <span className="italic">É o início da operação</span>.
            </h2>
            <p data-reveal data-delay="240">
              A maioria das obras termina na entrega das chaves. A nossa termina com o imóvel pronto
              para entrar no mercado. Por isso, cada decisão do Be Wild considera a operação que vem
              depois: foto, diária, limpeza, manutenção, check-in e experiência do hóspede. Quando a
              reforma acaba, o BeWild Host Care já sabe como colocar o ativo para rodar.
            </p>
            <div className="nodes" data-reveal data-delay="360">
              {NODES.map((n, i) => (
                <span key={n} style={{ display: "inline-flex", alignItems: "center", gap: ".35rem" }}>
                  <span className="nodes__pill">{n}</span>
                  {i < NODES.length - 1 && <span className="nodes__arrow">→</span>}
                </span>
              ))}
            </div>
            <button onClick={() => navigate("/bewild-host-care")} className="link-arrow" data-reveal data-delay="480">
              Conhecer o BeWild Host Care <ArrowRight size={16} />
            </button>
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section className="faq">
          <div className="container">
            <div className="faq__head">
              <p className="eyebrow" data-reveal>PERGUNTAS FREQUENTES</p>
              <h2 data-reveal data-delay="120">FAQ Be Wild</h2>
            </div>
            <div className="faq__grid">
              {FAQS.map((f, i) => (
                <div key={f.q} className={`acc${openFaq === i ? " is-open" : ""}`} data-reveal data-delay={String((i % 2) * 120)}>
                  <button
                    type="button"
                    className="acc__btn"
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
            <h2 data-reveal>Pronto para preparar seu imóvel?</h2>
            <p data-reveal data-delay="120">
              Conte para a Be Wild em que estágio está seu imóvel. A gente mostra qual caminho faz sentido.
            </p>
            <div className="cta-final__buttons" data-reveal data-delay="240">
              <button onClick={() => navigate("/diagnostico")} className="btn-primary">
                Diagnosticar meu imóvel <span className="arr">→</span>
              </button>
              <button onClick={() => navigate("/diagnostico")} className="btn-ghost btn-ghost--ink">
                Receber diagnóstico Be Wild
              </button>
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
