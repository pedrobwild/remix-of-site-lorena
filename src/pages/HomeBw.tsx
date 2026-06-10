/**
 * HomeBw — Home BeWild (reference 1:1).
 * Porting do HTML/CSS de referência. Inclui nav + footer próprios.
 */
import { useEffect, useRef, useState } from "react";
import { navigate } from "../lib/useHashRoute";
import { gsap, ScrollTrigger } from "../lib/gsap";
import "../styles/bw-home.css";

const NAV_LINKS = [
  { label: "Jornada Be Wild", href: "/metodo-bwild" },
  { label: "BeWild Reformas", href: "/be-wild" },
  { label: "BeWild Host Care", href: "/bewild-host-care" },
  { label: "Cases", href: "/cases" },
  { label: "Conteúdos", href: "/conteudos" },
];

const MENU_ITEMS = [
  { idx: "01", label: "Jornada Be Wild", href: "/metodo-bwild" },
  { idx: "02", label: "BeWild Reformas", href: "/be-wild" },
  { idx: "03", label: "BeWild Host Care", href: "/bewild-host-care" },
  { idx: "04", label: "Cases", href: "/cases" },
  { idx: "05", label: "Conteúdos", href: "/conteudos" },
  { idx: "06", label: "Simulador", href: "/simulador" },
];

const SLATS = [
  { id: "s1", tag: "BeWild Reformas", name: "Reforma turn-key para short stay", desc: "Projeto, obra, marcenaria, mobiliário, compras, decoração e setup em um fluxo único, com entrega pronta para anunciar.", img: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1400&auto=format&fit=crop" },
  { id: "s2", tag: "Especialidade", name: "Studios compactos", desc: "Foco em studios de 25–45m² nos bairros de maior demanda de SP, onde cada metro quadrado precisa performar.", img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1400&auto=format&fit=crop" },
  { id: "s3", tag: "Detalhes", name: "Marcenaria sob medida", desc: "Armazenamento inteligente e acabamento que aparece na foto e resiste ao uso intenso da temporada.", img: "https://images.unsplash.com/photo-1556912173-3bb406ef7e77?q=80&w=1400&auto=format&fit=crop" },
  { id: "s4", tag: "Setup", name: "Mobiliário, eletros e enxoval", desc: "Curadoria de móveis, eletros, enxoval e itens operacionais para o imóvel sair pronto para anúncio e operação.", img: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=1400&auto=format&fit=crop" },
  { id: "s5", tag: "BeWild Host Care", name: "Airbnb + Booking + mais", desc: "Anúncio otimizado, calendário sincronizado e precificação dinâmica nos principais canais de temporada.", img: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=1400&auto=format&fit=crop" },
  { id: "s6", tag: "Operação", name: "Gestão profissional", desc: "Atendimento 24h ao hóspede, limpeza, manutenção, relatórios mensais e repasse com demonstrativo detalhado.", img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1400&auto=format&fit=crop" },
];

const TABS = [
  { id: 0, label: "Distribuição", title: "Visível onde o hóspede procura.", p: "Criação, otimização e gestão do anúncio nos principais canais, com calendário sincronizado e posicionamento para maximizar visibilidade.", items: ["Airbnb + Booking + demais plataformas", "Calendário sincronizado", "Fotos, textos e posicionamento otimizados", "30 dias de tráfego pago grátis no lançamento"], tv: "tv-1", phLabel: "distribuição", phNote: "Slot · screenshot do anúncio no Airbnb/Booking" },
  { id: 1, label: "Precificação", title: "Preço certo, todos os dias.", p: "Ajuste diário de tarifas conforme demanda, sazonalidade, eventos e concorrência. Gestão ativa de receita, sem cadastro passivo.", items: ["Precificação dinâmica diária", "Calibração por bairro e perfil de hóspede", "Resposta a eventos e sazonalidade", "Receita acompanhada no relatório mensal"], tv: "tv-2", phLabel: "precificação", phNote: "Slot · gráfico de tarifas/ocupação redigido" },
  { id: 2, label: "Gestão", title: "O hóspede fala com a gente, não com você.", p: "Atendimento 24h, check-in e check-out, limpeza entre reservas e troca de enxoval. Você não vira central de atendimento.", items: ["Suporte 24h ao hóspede", "Check-in e check-out remotos", "Limpeza profissional entre reservas", "Vistoria de condição a cada saída"], tv: "tv-3", phLabel: "gestão", phNote: "Slot · foto real de check-in/limpeza" },
  { id: 3, label: "Manutenção", title: "Imóvel sempre em condições.", p: "Vistorias periódicas, reparos preventivos e atendimento de emergência. Seu ativo se valoriza com o tempo.", items: ["Vistoria entre reservas", "Reparos preventivos", "Acionamento de emergência", "Registro fotográfico"], tv: "tv-4", phLabel: "manutenção", phNote: "Slot · registro fotográfico de vistoria" },
  { id: 4, label: "Confiança", title: "Sem amarras. Com resultado verificável.", p: "Sem fidelidade: saída com aviso de 30 dias. Relatório mensal com dados reais de reservas, receita e ocupação, e repasse até o dia 10.", items: ["Sem contrato de longo prazo", "Relatórios mensais com dados reais", "Repasse líquido com demonstrativo", "Operação transparente, sem número fictício"], tv: "tv-5", phLabel: "confiança", phNote: "Slot · relatório mensal com dados mascarados" },
];

const BAIRROS = ["Pinheiros", "Itaim Bibi", "Vila Madalena", "Vila Olímpia", "Brooklin", "Consolação", "Vila Mariana", "Moema", "Perdizes", "Butantã"];

function go(href: string, e?: React.MouseEvent) {
  e?.preventDefault();
  navigate(href);
}

export default function HomeBw() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSlat, setActiveSlat] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const interactedRef = useRef(false);

  // Nav scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Body class para menu aberto
  useEffect(() => {
    document.body.classList.toggle("bw-menu-open", menuOpen);
    return () => document.body.classList.remove("bw-menu-open");
  }, [menuOpen]);

  // Auto-advance galeria (4.8s, para na 1ª interação)
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const t = setInterval(() => {
      if (interactedRef.current) return;
      setActiveSlat((i) => (i + 1) % SLATS.length);
    }, 4800);
    return () => clearInterval(t);
  }, []);

  // Counters
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const counted = new WeakSet<Element>();
    const els = document.querySelectorAll<HTMLElement>(".bw-home-page [data-count]");
    const countUp = (el: HTMLElement) => {
      const target = parseFloat(el.dataset.count || "0");
      const dec = !!el.dataset.decimal;
      const dur = 1400, t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min((t - t0) / dur, 1);
        const e = 1 - Math.pow(1 - p, 3);
        const v = target * e;
        el.textContent = dec ? (v / 10).toFixed(1).replace(".", ",") : String(Math.round(v));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !counted.has(e.target)) {
          counted.add(e.target);
          const el = e.target as HTMLElement;
          if (reduce) {
            el.textContent = el.dataset.decimal
              ? (parseFloat(el.dataset.count || "0") / 10).toFixed(1).replace(".", ",")
              : el.dataset.count || "0";
          } else countUp(el);
        }
      });
    }, { threshold: 0.6 });
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // Reveals
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -6% 0px" });
    document.querySelectorAll(".bw-home-page .rv, .bw-home-page .rv-scale").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // GSAP — hero entrada + pin + stack scrub + jornada + footer name
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      document.querySelectorAll<HTMLElement>(".bw-home-page .h-line>span").forEach((s) => (s.style.transform = "none"));
      return;
    }
    const ctx = gsap.context(() => {
      gsap.set(".h-line>span", { yPercent: 110 });
      gsap.set(".hero .eyebrow, .hero .lead, .hero-ctas, .hero-proof, .scroll-cue", { y: 24, opacity: 0 });
      gsap.set("#bwHeroMedia", { scale: 1.08 });

      gsap.timeline({ defaults: { ease: "power3.out" } })
        .to("#bwHeroMedia", { scale: 1, duration: 1.8, ease: "power2.out" }, 0)
        .to(".hero .eyebrow", { y: 0, opacity: 1, duration: 0.8 }, 0.3)
        .to(".h-line>span", { yPercent: 0, duration: 1.1, stagger: 0.14, ease: "power4.out" }, 0.4)
        .to(".hero .lead", { y: 0, opacity: 1, duration: 0.9 }, 0.95)
        .to(".hero-ctas", { y: 0, opacity: 1, duration: 0.9 }, 1.1)
        .to(".hero-proof", { y: 0, opacity: 1, duration: 0.9 }, 1.25)
        .to(".scroll-cue", { y: 0, opacity: 1, duration: 0.9 }, 1.4);

      ScrollTrigger.matchMedia({
        "(min-width: 861px)": function () {
          gsap.timeline({
            scrollTrigger: { trigger: "#bwHero", start: "top top", end: "+=70%", scrub: 0.8, pin: true, anticipatePin: 1 },
          })
            .to("#bwHeroMedia", { scale: 1.12, y: -40, ease: "none" }, 0)
            .to("#bwHeroInner", { y: -90, opacity: 0.25, ease: "none" }, 0)
            .to("#bwHeroDim", { opacity: 0.55, ease: "none" }, 0)
            .to(".scroll-cue", { opacity: 0, ease: "none" }, 0);

          const cards = gsap.utils.toArray<HTMLElement>(".stack-card");
          cards.forEach((card, i) => {
            if (i === cards.length - 1) return;
            const next = cards[i + 1];
            const st = { trigger: next, start: "top bottom", end: "top top", scrub: true };
            gsap.to(card, { scale: 0.94, y: -14, ease: "none", scrollTrigger: st });
            gsap.to(card.querySelector(".card-dim"), { opacity: 0.45, ease: "none", scrollTrigger: st });
          });
        },
      });

      gsap.to("#bwTlFill", {
        width: "94%", ease: "none",
        scrollTrigger: { trigger: ".tl", start: "top 80%", end: "bottom 55%", scrub: 0.6 },
      });

      gsap.from(".foot-name", {
        yPercent: 40, opacity: 0.2, ease: "power2.out",
        scrollTrigger: { trigger: "footer.bw-foot", start: "top 80%", end: "bottom bottom", scrub: 0.8 },
      });
    });

    return () => ctx.revert();
  }, []);

  const onSlatInteract = (i: number) => {
    interactedRef.current = true;
    setActiveSlat(i);
  };

  return (
    <div className="bw-home-page">
      {/* ===== NAV ===== */}
      <nav className={`nav${scrolled ? " scrolled" : ""}`}>
        <div className="nav-inner">
          <a className="logo" href="/" onClick={(e) => go("/", e)}>Be <em>Wild</em></a>
          <div className="nav-links">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={(e) => go(l.href, e)}>{l.label}</a>
            ))}
            <a
              href="https://wa.me/5500000000000"
              target="_blank"
              rel="noopener noreferrer"
            >Falar no WhatsApp</a>
            <a href="/diagnostico" onClick={(e) => go("/diagnostico", e)} className="btn btn-primary">
              Diagnosticar meu imóvel <span className="arrow">→</span>
            </a>
          </div>
          <button
            className={`burger${menuOpen ? " open" : ""}`}
            aria-label="Abrir menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span></span><span></span><span></span>
          </button>
        </div>
      </nav>

      {/* ===== MENU OVERLAY ===== */}
      <div className={`menu${menuOpen ? " open" : ""}`}>
        <nav>
          {MENU_ITEMS.map((m) => (
            <a key={m.href} href={m.href} onClick={(e) => { setMenuOpen(false); go(m.href, e); }}>
              <span className="idx">{m.idx}</span>{m.label}
            </a>
          ))}
        </nav>
        <div className="menu-foot">
          <a href="/diagnostico" onClick={(e) => { setMenuOpen(false); go("/diagnostico", e); }} className="btn btn-primary">
            Diagnosticar meu imóvel <span className="arrow">→</span>
          </a>
          <a
            href="https://wa.me/5500000000000"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost"
          >Falar no WhatsApp</a>
        </div>
      </div>

      {/* ===== HERO ===== */}
      <section className="hero on-dark" id="bwHero">
        <div className="hero-media" id="bwHeroMedia">
          <img
            src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2400&auto=format&fit=crop"
            alt=""
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        </div>
        <div className="hero-overlay"></div>
        <div className="hero-grain"></div>
        <div className="hero-dim" id="bwHeroDim"></div>

        <div className="hero-inner" id="bwHeroInner">
          
          <h1>
            <span className="h-line"><span>Seu imóvel no short stay,</span></span>
            <span className="h-line"><span><em className="g">da reforma à gestão.</em></span></span>
          </h1>
          <p className="lead">Você entra com o imóvel. A BeWild entrega a operação pronta: reforma, lançamento, gestão e repasse.</p>
          <div className="hero-ctas">
            <a href="/diagnostico" onClick={(e) => go("/diagnostico", e)} className="btn btn-primary">
              Diagnosticar meu imóvel <span className="arrow">→</span>
            </a>
            <a href="/cases" onClick={(e) => go("/cases", e)} className="btn btn-ghost">
              Ver cases reais <span className="arrow">→</span>
            </a>
          </div>
          <div className="hero-proof">
            <span><span className="star">★★★★★</span>&nbsp; 4.9 no Airbnb</span>
            <span className="sep"></span>
            <span>48+ imóveis preparados em SP</span>
            <span className="sep"></span>
            <span>Pinheiros · Itaim · Vila Madalena</span>
          </div>
        </div>
        <div className="scroll-cue">Role para descer</div>
      </section>

      {/* ===== STATS ===== */}
      <section className="bw-light on-light stats">
        <div className="wrap">
          <div className="stats-grid">
            <div className="stat rv"><div className="num"><span data-count="48">0</span><span className="sup">+</span></div><div className="cap">Imóveis preparados</div></div>
            <div className="stat rv rv-d1"><div className="num"><span data-count="67">0</span>%</div><div className="cap">Ocupação média alcançada</div></div>
            <div className="stat rv rv-d2"><div className="num">R$<span data-count="38" data-decimal="1">0</span>k</div><div className="cap">Receita bruta/mês referência</div></div>
            <div className="stat rv rv-d3"><div className="num">4.9<span className="sup">★</span></div><div className="cap">Avaliação média (Airbnb)</div></div>
          </div>
          <span className="mono-note rv rv-d4">Referência de mercado SP 2025/2026 · resultado passado não garante resultado futuro</span>
        </div>
      </section>

      {/* ===== O PROBLEMA ===== */}
      <section className="frio on-light pad">
        <div className="wrap split">
          <div>
            <span className="eyebrow rv">O problema</span>
            <h2 className="rv rv-d1" style={{ marginTop: "1rem" }}>
              Reformar é só o começo. <em className="g">A maioria dos imóveis para por aí.</em>
            </h2>
            <p className="lead rv rv-d2" style={{ marginTop: "1.4rem" }}>
              O ciclo completo — reforma com foco em short stay, lançamento profissional, gestão ativa e repasse mensal — é o que transforma um ativo parado em operação rodando.
            </p>
            <p style={{ marginTop: "1.6rem" }} className="rv rv-d3">
              <a href="/diagnostico" onClick={(e) => go("/diagnostico", e)} className="link-arrow">
                Ver como a BeWild resolve <span className="arrow">→</span>
              </a>
            </p>
          </div>
          <div className="risk-list">
            {[
              "Reforma entregue, imóvel parado sem gerar renda",
              "Sem tempo para gerenciar Airbnb e hóspedes",
              "Anúncio ativo, mas ocupação abaixo do esperado",
              'Imóvel "bom" que não converte nas fotos',
              "Gestora cobra caro e some quando há problema",
            ].map((t, i) => (
              <div key={i} className={`risk rv${i ? ` rv-d${i}` : ""}`}><i></i>{t}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== STACK FASE 1 → FASE 2 → TESE ===== */}
      <section className="stack-zone">
        <div className="stack">
          {/* FASE 1 */}
          <article className="stack-card sc-areia on-light">
            <div className="card-dim"></div>
            <div className="wrap split">
              <div>
                <span className="selo">Fase 1</span>
                <h2 style={{ marginTop: "1rem" }}>BeWild Reformas</h2>
                <span className="sub-it" style={{ display: "block", marginTop: ".6rem" }}>Da planta crua ao studio pronto para hospedar.</span>
                <p className="lead" style={{ marginTop: "1.2rem" }}>
                  Projeto de arquitetura personalizado, obra turn-key, marcenaria, mobiliário e setup completo. Cada decisão pensada para foto, operação e manutenção.
                </p>
                <ul className="check-list">
                  <li><span className="tick">✓</span> Projeto voltado para short stay</li>
                  <li><span className="tick">✓</span> Material com durabilidade operacional</li>
                  <li><span className="tick">✓</span> Enxoval, eletros e fechadura digital</li>
                  <li><span className="tick">✓</span> Entrega pronta para hospedar</li>
                </ul>
                <a href="/be-wild" onClick={(e) => go("/be-wild", e)} className="link-arrow">
                  Conhecer o processo <span className="arrow">→</span>
                </a>
              </div>
              <div className="visual-card vc-fallback-light">
                <img
                  src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1600&auto=format&fit=crop"
                  alt=""
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
                <span className="visual-note">Slot · foto real do studio entregue</span>
              </div>
            </div>
            <div className="card-dots"><span className="on"></span><span></span><span></span></div>
          </article>

          {/* FASE 2 */}
          <article className="stack-card sc-dark on-dark">
            <div className="card-dim"></div>
            <div className="wrap split">
              <div>
                <span className="selo">Fase 2</span>
                <h2 style={{ marginTop: "1rem" }}>BeWild Host Care</h2>
                <span className="sub-it" style={{ display: "block", marginTop: ".6rem", color: "rgba(255,255,255,.8)" }}>
                  Seu imóvel operando. Você não precisa fazer nada.
                </span>
                <p className="lead" style={{ marginTop: "1.2rem" }}>
                  Gestão profissional completa: anúncio, precificação dinâmica, atendimento 24h, check-in/out, limpeza, manutenção e repasse mensal.
                </p>
                <ul className="check-list">
                  <li><span className="tick">✓</span> Airbnb + Booking com calendário sincronizado</li>
                  <li><span className="tick">✓</span> Precificação dinâmica diária</li>
                  <li><span className="tick">✓</span> Operação 24h — total tranquilidade</li>
                  <li><span className="tick">✓</span> Relatório e repasse até dia 10</li>
                </ul>
                <a href="/bewild-host-care" onClick={(e) => go("/bewild-host-care", e)} className="link-arrow">
                  Ver a operação <span className="arrow">→</span>
                </a>
              </div>
              <div className="visual-card vc-fallback-dark">
                <img
                  src="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1600&auto=format&fit=crop"
                  alt=""
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
                <span className="visual-note">Slot · foto real da operação entre reservas</span>
              </div>
            </div>
            <div className="card-dots"><span></span><span className="on"></span><span></span></div>
          </article>

          {/* TESE */}
          <article className="stack-card sc-tese on-dark">
            <div className="card-dim"></div>
            <div className="wrap tese-wrap">
              <span className="eyebrow">A tese</span>
              <h2>O fim da reforma é <em className="g">o início da gestão.</em></h2>
              <span className="sub-it">Um ciclo completo. Um só parceiro.</span>
              <p className="lead">
                Da decisão de reformar até o repasse mensal: a BeWild é o único parceiro que cobre os dois lados do investimento em short stay.
              </p>
              <ul className="check-list">
                <li><span className="tick">✓</span> Continuidade entre reforma e operação</li>
                <li><span className="tick">✓</span> Menos interlocutores, mais clareza</li>
                <li><span className="tick">✓</span> Decisões de projeto já pensadas para a gestão</li>
                <li><span className="tick">✓</span> Diagnóstico gratuito antes de qualquer compromisso</li>
              </ul>
              <a href="/diagnostico" onClick={(e) => go("/diagnostico", e)} className="btn btn-primary">
                Diagnosticar meu imóvel <span className="arrow">→</span>
              </a>
            </div>
            <div className="card-dots"><span></span><span></span><span className="on"></span></div>
          </article>
        </div>
      </section>

      {/* ===== O QUE FAZEMOS ===== */}
      <section className="bw-light on-light pad">
        <div className="wrap">
          <div className="gal-head">
            <div>
              <span className="eyebrow rv">O que fazemos</span>
              <h2 className="rv rv-d1" style={{ marginTop: "1rem" }}>Dois produtos. <em className="g">Um ciclo completo.</em></h2>
              <span className="sub-it rv rv-d2" style={{ display: "block", marginTop: ".5rem" }}>Reforma e gestão sob o mesmo teto.</span>
            </div>
            <div className="gal-nav rv rv-d2">
              <button className="gal-btn" aria-label="Anterior" onClick={() => onSlatInteract((activeSlat - 1 + SLATS.length) % SLATS.length)}>←</button>
              <button className="gal-btn" aria-label="Próximo" onClick={() => onSlatInteract((activeSlat + 1) % SLATS.length)}>→</button>
            </div>
          </div>

          <div className="gal">
            {SLATS.map((s, i) => (
              <article
                key={s.id}
                className={`slat ${s.id}${i === activeSlat ? " active" : ""}`}
                onClick={() => onSlatInteract(i)}
                onMouseEnter={() => {
                  if (window.matchMedia("(hover: hover)").matches) onSlatInteract(i);
                }}
              >
                <div className="slat-bg">
                  <img src={s.img} alt="" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                </div>
                <div className="slat-shade"></div>
                <span className="slat-tag"><span className="selo">{s.tag}</span></span>
                <p className="slat-desc">{s.desc}</p>
                <h3 className="slat-name">{s.name}</h3>
              </article>
            ))}
          </div>
          <div className="gal-dots">
            {SLATS.map((_, i) => (
              <span key={i} className={`gal-dot${i === activeSlat ? " on" : ""}`}></span>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOST CARE TABS ===== */}
      <section className="frio on-light pad">
        <div className="wrap">
          <span className="eyebrow rv">BeWild Host Care</span>
          <h2 className="rv rv-d1" style={{ marginTop: "1rem" }}>Tudo que seu imóvel precisa <em className="g">para operar.</em></h2>

          <div className="tabs rv rv-d2">
            {TABS.map((t) => (
              <button key={t.id} className={`tab${activeTab === t.id ? " on" : ""}`} onClick={() => setActiveTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="tab-stage">
            {TABS.map((t) => (
              <div key={t.id} className={`tab-panel${activeTab === t.id ? " on" : ""}`}>
                <div className={`tab-visual ${t.tv}`}>
                  <div className="ph"><b>{t.phLabel}</b><span>{t.phNote}</span></div>
                </div>
                <div className="tab-body">
                  <h3>{t.title}</h3>
                  <p>{t.p}</p>
                  <ul className="dot-list">
                    {t.items.map((it) => <li key={it}>{it}</li>)}
                  </ul>
                  <a href="/diagnostico" onClick={(e) => go("/diagnostico", e)} className="btn btn-primary">
                    Diagnosticar meu imóvel
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== JORNADA ===== */}
      <section className="bw-light on-light pad">
        <div className="wrap">
          <span className="eyebrow rv">Do zero ao repasse</span>
          <h2 className="rv rv-d1" style={{ marginTop: "1rem" }}>A jornada Be Wild.</h2>

          <div className="tl">
            <div className="tl-fill" id="bwTlFill"></div>
            <div className="tl-step rv"><span className="n">01</span><h4>Diagnóstico</h4><p>Bairro, metragem, estado e objetivo do ativo antes de qualquer recomendação.</p></div>
            <div className="tl-step rv rv-d1"><span className="n">02</span><h4>BeWild Reformas <span className="selo">Fase 1</span></h4><p>Projeto, obra, marcenaria, mobiliário e setup em um fluxo único.</p></div>
            <div className="tl-step rv rv-d2"><span className="n">03</span><h4>Lançamento</h4><p>Anúncio otimizado, foto profissional e precificação calibrada.</p></div>
            <div className="tl-step rv rv-d3"><span className="n">04</span><h4>BeWild Host Care <span className="selo">Fase 2</span></h4><p>Hóspede, limpeza, manutenção e plataformas sem você integrar nada.</p></div>
            <div className="tl-step rv rv-d4"><span className="n">05</span><h4>Acompanhamento</h4><p>Relatório mensal com dados reais e repasse líquido até o dia 10.</p></div>
          </div>
          <p style={{ marginTop: "2.4rem" }} className="rv">
            <a href="/metodo-bwild" onClick={(e) => go("/metodo-bwild", e)} className="link-arrow">
              Ver o método completo <span className="arrow">→</span>
            </a>
          </p>
        </div>
      </section>

      {/* ===== BAIRROS ===== */}
      <section className="bw-light on-light bairros">
        <span className="eyebrow">Bairros em operação · São Paulo</span>
        <div className="marquee">
          {[...BAIRROS, ...BAIRROS].map((b, i) => (
            <span key={i} className="b-chip"><i>◆</i>{b}</span>
          ))}
        </div>
      </section>

      {/* ===== SIMULADOR ===== */}
      <section className="frio on-light pad">
        <div className="wrap">
          <div className="sim-card rv-scale">
            <span className="eyebrow">Simulador</span>
            <h2>Qual o potencial do <em className="g">seu imóvel?</em></h2>
            <p className="lead">Estimativa de faixa de receita por bairro e tipo — sem promessa de resultado.</p>
            <a href="/simulador" onClick={(e) => go("/simulador", e)} className="btn btn-primary">
              Simular agora <span className="arrow">→</span>
            </a>
          </div>
        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section className="bw-dark on-dark pad cta-final">
        <div className="wrap">
          <span className="eyebrow rv">Próximo passo</span>
          <h2 className="rv rv-d1">Vamos descobrir juntos.</h2>
          <p className="lead rv rv-d2" style={{ margin: "0 auto 2.2rem" }}>
            Diagnóstico gratuito. Sem compromisso. Avaliamos o seu ativo antes de qualquer recomendação.
          </p>
          <a href="/diagnostico" onClick={(e) => go("/diagnostico", e)} className="btn btn-primary rv rv-d3">
            Diagnosticar meu imóvel <span className="arrow">→</span>
          </a>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="on-dark bw-foot">
        <div className="wrap">
          <div className="foot-grid">
            <div>
              <a className="logo" href="/" onClick={(e) => go("/", e)}>Be <em>Wild</em></a>
              <p style={{ marginTop: "1rem" }}>
                Preparação e gestão de imóveis para short stay em São Paulo. BeWild Reformas prepara o ativo. BeWild Host Care opera o ativo. A BeWild conecta o ciclo inteiro.
              </p>
              <p style={{ marginTop: ".8rem" }}>São Paulo, Brasil</p>
            </div>
            <div>
              <h5>Jornada Be Wild</h5>
              <ul>
                <li><a href="/metodo-bwild" onClick={(e) => go("/metodo-bwild", e)}>Jornada Be Wild</a></li>
                <li><a href="/be-wild" onClick={(e) => go("/be-wild", e)}>BeWild — Preparação do ativo</a></li>
                <li><a href="/bewild-host-care" onClick={(e) => go("/bewild-host-care", e)}>BeWild Host Care — Gestão de temporada</a></li>
                <li><a href="/simulador" onClick={(e) => go("/simulador", e)}>Simulador de potencial</a></li>
                <li><a href="/sobre" onClick={(e) => go("/sobre", e)}>Sobre a BeWild</a></li>
                <li><a href="/cases" onClick={(e) => go("/cases", e)}>Cases</a></li>
                <li><a href="/conteudos" onClick={(e) => go("/conteudos", e)}>Conteúdos</a></li>
                <li><a href="/diagnostico" onClick={(e) => go("/diagnostico", e)}>Diagnóstico do imóvel</a></li>
              </ul>
            </div>
            <div>
              <h5>Contato</h5>
              <ul>
                <li><a href="https://wa.me/5500000000000" target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
                <li><a href="https://instagram.com/" target="_blank" rel="noopener noreferrer">Instagram</a></li>
                <li><a href="https://www.linkedin.com/" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
                <li><a href="mailto:contato@bewild.com.br">contato@bewild.com.br</a></li>
                <li><a href="/privacidade" onClick={(e) => go("/privacidade", e)}>Política de privacidade</a></li>
              </ul>
            </div>
          </div>
          <div className="foot-bar">
            <span>BeWild — Da obra à diária: preparação e gestão de imóveis para short stay.</span>
            <span>© 2026 BeWild. BeWild Reformas prepara. BeWild Host Care opera. Todos os direitos reservados.</span>
          </div>
        </div>
        <div className="foot-name">Be <em>Wild</em></div>
      </footer>
    </div>
  );
}
