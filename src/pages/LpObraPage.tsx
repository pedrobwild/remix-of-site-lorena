/**
 * LpObraPage — /o · página fantasma (destino do QR da placa de obra).
 *
 * Requisitos críticos:
 *  - noindex (robots), sem nav global, sem footer global.
 *  - Acessível apenas via URL direta (QR).
 *  - Reaproveita pipeline de lead da DiagnosticoPage (notify-lead).
 */
import { useEffect, useState } from "react";
import { useSeo } from "@/lib/useSeo";
import { CONTACT } from "@/components/landing/content";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/ga4";
import "@/styles/bw-lp.css";

const digits = (v: string) => v.replace(/\D/g, "");

type LeadPayload = {
  name: string;
  whatsapp: string;
  email: string | null;
  location: string | null;
  area_m2: number | null;
  objetivo: string | null;
  chaves: string | null;
  planta: string | null;
  message: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer: string | null;
  landing_path: string | null;
  user_agent: string | null;
};

function readUtm(defaults: { source: string; medium: string; campaign: string }) {
  const params =
    typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  return {
    utm_source: params?.get("utm_source") || defaults.source,
    utm_medium: params?.get("utm_medium") || defaults.medium,
    utm_campaign: params?.get("utm_campaign") || defaults.campaign,
    referrer: typeof document !== "undefined" ? document.referrer || null : null,
    landing_path: typeof window !== "undefined" ? window.location.pathname : null,
    user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
  };
}

async function sendLead(payload: LeadPayload) {
  try {
    await supabase.functions.invoke("notify-lead", { body: payload });
  } catch (err) {
    console.error("[notify-lead] invoke failed", err);
  }
}

export default function LpObraPage() {
  const params =
    typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const bairroRaw = params?.get("bairro")?.trim() || "";
  const bairro = bairroRaw || null;
  const bairroUp = bairro ? bairro.toUpperCase() : "";

  useSeo({
    title: "Obra Bewild · acompanhamento",
    description: "Página da placa de obra Bewild. Veja o acompanhamento do studio.",
    canonicalPath: "/o",
    noindex: true,
  });

  const utmDefaults = { source: "qr", medium: "placa", campaign: "obra-placa" };

  // Gate
  const [gateName, setGateName] = useState("");
  const [gateWhats, setGateWhats] = useState("");
  const [gateDone, setGateDone] = useState(false);
  const [gateErr, setGateErr] = useState<string | null>(null);

  const onGateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (digits(gateWhats).length < 10 || gateName.trim().length < 2) {
      setGateErr("Informe nome e WhatsApp com DDD.");
      return;
    }
    setGateErr(null);
    const utm = readUtm(utmDefaults);
    await sendLead({
      name: gateName.trim(),
      whatsapp: digits(gateWhats),
      email: null,
      location: bairro,
      area_m2: null,
      objetivo: null,
      chaves: null,
      planta: null,
      message: null,
      ...utm,
    });
    trackEvent("generate_lead", { method: "lp_gate", location: bairro || undefined });
    setGateDone(true);
    setTimeout(() => {
      document.getElementById("portal")?.scrollIntoView({ behavior: "smooth" });
    }, 80);
  };

  const onGateSkip = () => {
    trackEvent("portal_skip", { category: "lp_obra" });
    setGateDone(true);
    setTimeout(() => {
      document.getElementById("portal")?.scrollIntoView({ behavior: "smooth" });
    }, 80);
  };

  const scrollTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  // CTA WhatsApp do CTA final + sticky
  const openWhats = async (origemCampaign: string) => {
    const utm = readUtm(utmDefaults);
    // grava lead leve quando temos nome/whats já capturados no gate
    if (gateName && digits(gateWhats).length >= 10) {
      await sendLead({
        name: gateName.trim(),
        whatsapp: digits(gateWhats),
        email: null,
        location: bairro,
        area_m2: null,
        objetivo: null,
        chaves: null,
        planta: null,
        message: "Clique no CTA WhatsApp (placa de obra)",
        ...utm,
        utm_campaign: utm.utm_campaign || origemCampaign,
      });
    }
    trackEvent("click_whatsapp", {
      category: "lp_obra",
      label: utm.utm_campaign || origemCampaign,
    });
    const bairroTxt = bairro ? ` em ${bairro}` : "";
    const msg = `Olá! Vim pela placa da obra Bewild${bairroTxt}. Quero avaliar o potencial do meu studio pra render no short-stay. (origem: ${utm.utm_campaign || origemCampaign})`;
    const url = `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Sticky CTA visibility
  const [showSticky, setShowSticky] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const vh = window.innerHeight;
      setShowSticky(window.scrollY > vh * 0.7);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const eyebrowText = bairro ? `Obra Bewild · ${bairro}` : "Obra Bewild · São Paulo";
  const sheetNo = bairro ? `SHEET · OBRA ${bairroUp}` : "SHEET · OBRA";

  return (
    <div className="bw-lp">
      <div className="bw-grain" aria-hidden="true" />
      <div className="bw-frame" aria-hidden="true">
        <i className="tk tl" /><i className="tk tr" /><i className="tk bl" /><i className="tk br" />
      </div>
      <div className="bw-titleblock" aria-hidden="true">
        BEWILD · GRUPO BWILD<br /><b>BW—OBRA / PLACA</b><br />SÃO PAULO · BR
      </div>
      <div className="bw-sheetno" aria-hidden="true">{sheetNo}</div>

      {/* HERO */}
      <section className="hero" aria-label="Obra Bewild">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-top">
          <div className="hero-eyebrow">
            <span className="mono tag">{eyebrowText}</span>
          </div>
          <h1>
            Você parou em frente a uma obra.
            <span className="lo">Veja como ela anda por dentro.</span>
          </h1>
          <p className="sub">
            Atrás dessa placa, um studio está virando renda, sem o dono entrar
            na obra. Veja como a gente mostra cada etapa pro cliente: cronograma,
            fotos e relatório, sem ele precisar ir lá.
          </p>
          <div className="cta">
            <a className="btn btn-cyan" href="#acompanhamento" onClick={scrollTo("acompanhamento")}>
              <span>Ver o acompanhamento</span><span className="ar">→</span>
            </a>
            <a className="btn btn-ghost" href="#cta" onClick={scrollTo("cta")}>
              <span>Quero um igual</span>
            </a>
          </div>
        </div>

        <div className="hero-data">
          <div className="cell"><b>150+</b><span>studios entregues</span></div>
          <div className="cell"><b>60</b><span>dias úteis · a partir de</span></div>
          <div className="cell"><b>05</b><span>anos de garantia</span></div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="marquee" aria-hidden="true">
        <div className="trk">
          <span>CONSTRUÍDO POR QUEM NÃO ACEITA O ÓBVIO <i>/</i> BUILT BY THE WILD ONES <i>/</i> </span>
          <span>CONSTRUÍDO POR QUEM NÃO ACEITA O ÓBVIO <i>/</i> BUILT BY THE WILD ONES <i>/</i> </span>
          <span>CONSTRUÍDO POR QUEM NÃO ACEITA O ÓBVIO <i>/</i> BUILT BY THE WILD ONES <i>/</i> </span>
        </div>
      </div>

      {/* 01 — ACOMPANHAMENTO (gate) */}
      <section className="paper" id="acompanhamento" aria-label="Acompanhamento">
        <div className="sec-mark"><span className="n">01</span><span className="t">Acompanhamento</span><span className="ln" /></div>
        <div className="sec-head">
          <h2>A obra que você vê aqui é uma <i>demonstração.</i></h2>
          <p className="lead">
            É a mesma tela que o cliente Bewild abre pra acompanhar a dele. Deixe
            seu contato pra ver por dentro, e se quiser a gente avalia o seu studio
            depois.
          </p>
        </div>

        <div className={`gate-card${gateDone ? " done" : ""}`}>
          <div className="eye">Acesso à demonstração</div>
          <form className="gate-form" onSubmit={onGateSubmit} noValidate>
            <h3>Ver o portal de acompanhamento</h3>
            <p>Seu contato fica salvo com a gente. Sem ligação automática, sem spam.</p>
            <div className="fld">
              <label htmlFor="gate-name">Nome <span className="req">*</span></label>
              <input id="gate-name" type="text" autoComplete="name" value={gateName} onChange={(e) => setGateName(e.target.value)} required />
            </div>
            <div className="fld">
              <label htmlFor="gate-whats">WhatsApp <span className="req">*</span></label>
              <input id="gate-whats" type="tel" inputMode="tel" placeholder="(11) 99999-9999" autoComplete="tel" value={gateWhats} onChange={(e) => setGateWhats(e.target.value)} required />
            </div>
            {gateErr && <p style={{ color: "#c0392b", fontSize: 13, marginBottom: 10 }}>{gateErr}</p>}
            <button type="submit" className="btn btn-cyan submit">
              <span>Ver o portal</span><span className="ar">→</span>
            </button>
            <button type="button" className="skip" onClick={onGateSkip}>Ver sem deixar contato</button>
          </form>
          <div className="gate-done">
            <div className="ok" aria-hidden="true">✓</div>
            <h3 style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 19, color: "#0e2742" }}>Pronto</h3>
            <p style={{ fontSize: 14, color: "#5a6772", marginTop: 6 }}>Role pra ver o acompanhamento da obra.</p>
          </div>
        </div>
      </section>

      {/* 02 — PORTAL */}
      <section className="sec sec-dark" id="portal" aria-label="Portal de acompanhamento">
        <div className="sec-mark"><span className="n">02</span><span className="t">Portal</span><span className="ln" /></div>
        <div className="sec-head">
          <h2>Obra com visibilidade. <i>Sem caixa-preta.</i></h2>
          <p className="lead">
            Cronograma por etapa, fotos de evolução e relatório toda semana. O
            cliente vê a obra andar pelo celular, sem ir até lá nem cobrar no
            WhatsApp.
          </p>
        </div>

        <div className="pf-app" role="img" aria-label="Tela ilustrativa do Bwild Workflow">
          <div className="pf-chrome">
            <div className="pf-brand"><span className="pf-bdot" /><span className="pf-bname">Bwild Workflow</span></div>
            <div className="pf-period">Jun 2026</div>
          </div>
          <div className="pf-tabs">
            <span className="pf-tab act">Curva S</span>
            <span className="pf-tab">Relatórios</span>
            <span className="pf-tab">Atividade</span>
          </div>
          <div className="pf-body">
            <div>
              <div className="pf-hrow">
                <b className="pf-title">Studio Urban Flex · 22 m²</b>
                <span className="pf-pill pf-pill-info">Em obra</span>
              </div>
              <div className="pf-cap">Semana 6 de 10</div>
            </div>
            <div className="pf-kpis">
              <div className="pf-kpi"><span className="pf-klab">Concluído</span><span className="pf-kval">52%</span></div>
              <div className="pf-kpi"><span className="pf-klab">Status</span><span className="pf-kval"><span className="pf-sdot" />No prazo</span></div>
              <div className="pf-kpi"><span className="pf-klab">Cronograma</span><span className="pf-kval">Sem 6/10</span></div>
            </div>
            <div className="pf-chart">
              <div className="pf-legend">
                <span className="pf-leg"><span className="pf-lline pf-lreal" />Real</span>
                <span className="pf-leg"><span className="pf-lline pf-lplan" />Planejado</span>
              </div>
              <svg viewBox="0 0 320 150" className="pf-svg" aria-hidden="true">
                <defs>
                  <linearGradient id="pfa-o" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(204 100% 25%)" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="hsl(204 100% 25%)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <line x1="34" y1="16" x2="312" y2="16" stroke="hsl(220 16% 92%)" />
                <line x1="34" y1="42" x2="312" y2="42" stroke="hsl(220 16% 92%)" />
                <line x1="34" y1="68" x2="312" y2="68" stroke="hsl(220 16% 92%)" />
                <line x1="34" y1="94" x2="312" y2="94" stroke="hsl(220 16% 92%)" />
                <line x1="34" y1="120" x2="312" y2="120" stroke="hsl(220 16% 92%)" />
                <text x="26" y="20" textAnchor="end" className="pf-axis">100</text>
                <text x="26" y="72" textAnchor="end" className="pf-axis">50</text>
                <text x="26" y="124" textAnchor="end" className="pf-axis">0</text>
                <path d="M34 120 C 110 118, 150 70, 180 56 S 270 22, 312 16" fill="none" stroke="hsl(220 12% 55%)" strokeWidth="1.5" strokeDasharray="4 4" strokeLinecap="round" />
                <path d="M34 120 C 90 119, 130 96, 160 82 S 195 70, 200 66 L200 120 L34 120 Z" fill="url(#pfa-o)" />
                <path d="M34 120 C 90 119, 130 96, 160 82 S 195 70, 200 66" fill="none" stroke="hsl(204 100% 25%)" strokeWidth="2" strokeLinecap="round" />
                <circle cx="200" cy="66" r="5" fill="hsl(204 100% 25%)" stroke="#fff" strokeWidth="2" />
                <text x="34" y="142" className="pf-axis">Início</text>
                <text x="200" y="142" textAnchor="middle" className="pf-axis">Sem 6</text>
                <text x="312" y="142" textAnchor="end" className="pf-axis">Entrega</text>
              </svg>
            </div>
            <ul className="pf-stages">
              <li className="pf-stage"><span className="pf-sic pf-sic-ok">✓</span><span className="pf-slab">Demolição e remoção</span><span className="pf-sst ok">Concluída</span></li>
              <li className="pf-stage"><span className="pf-sic pf-sic-ok">✓</span><span className="pf-slab">Elétrica e hidráulica</span><span className="pf-sst ok">Concluída</span></li>
              <li className="pf-stage"><span className="pf-sic pf-sic-warn">◐</span><span className="pf-slab">Marcenaria sob medida</span><span className="pf-smeta"><span className="pf-pill pf-pill-warn">em andamento</span><span className="pf-spct">60%</span></span></li>
              <li className="pf-stage"><span className="pf-sic pf-sic-todo">○</span><span className="pf-slab mut">Montagem e enxoval</span><span className="pf-sst mut">A iniciar</span></li>
            </ul>
          </div>
          <div className="pf-foot">Atualizado hoje. Relatório semanal #6: marcenaria instalada, elétrica revisada.</div>
        </div>

        <p className="portal-note">Interface ilustrativa · não representa o andamento de uma unidade específica</p>
      </section>

      {/* 03 — RESULTADO REAL */}
      <section className="paper" aria-label="Resultado real Rafael">
        <div className="sec-mark"><span className="n">03</span><span className="t">Resultado real</span><span className="ln" /></div>
        <figure className="raf-quote">
          <blockquote>“Esses studios serão um negócio pra mim. Renda vitalícia.”</blockquote>
          <figcaption>Rafael · cliente Bewild · studio no Butantã · 70% de ocupação em novembro</figcaption>
        </figure>
        <p className="raf-note">Resultado de um cliente real. Ocupação e diária variam conforme imóvel, região e operação.</p>
      </section>

      {/* CTA FINAL */}
      <section className="cta-final" id="cta" aria-label="Diagnóstico Bewild">
        <div className="inner">
          <div className="eye"><span className="mono tag">Diagnóstico gratuito · sem compromisso</span></div>
          <h2>Tem um studio pra <i>render?</i></h2>
          <p>Manda os dados da unidade no WhatsApp. A gente avalia o potencial de renda e mostra como ficaria o projeto.</p>
          <div className="act">
            <button className="btn btn-cyan" type="button" onClick={() => openWhats("obra-placa")}>
              <span>Falar no WhatsApp</span><span className="ar">→</span>
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => openWhats("obra-placa")}>
              <span>Solicitar diagnóstico</span>
            </button>
          </div>
          <p className="rea">Atendimento de gente real · retorno rápido · <b>150+ studios entregues</b></p>
        </div>
      </section>

      {/* FOOTER MÍNIMO */}
      <footer className="lp-foot">
        BEWILD · GRUPO BWILD · SÃO PAULO · BR
        <span>Acompanhamento ilustrativo do portal Bwild Workflow</span>
      </footer>

      {/* STICKY MOBILE */}
      <div className={`sticky${showSticky ? " show" : ""}`} aria-hidden={!showSticky}>
        <button
          className="btn btn-cyan"
          type="button"
          tabIndex={showSticky ? 0 : -1}
          onClick={() => openWhats("obra-placa")}
        >
          <span>Avaliar meu studio no WhatsApp</span><span className="ar">→</span>
        </button>
      </div>
    </div>
  );
}
