/**
 * LpObraPage — /o · página fantasma (destino do QR da placa de obra).
 * Fluxo: gate (nome + telefone + e-mail) -> troca de tela -> portal Bwild
 * Workflow (o mesmo do orçamento público) + CTA de contato. Portal limpo.
 *  - noindex, sem nav/footer global, acessível só por URL direta (QR).
 *  - Lead via notify-lead (mesmo pipeline da DiagnosticoPage).
 */
import { useEffect, useState } from "react";
import { useSeo } from "@/lib/useSeo";
import { CONTACT } from "@/components/landing/content";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/ga4";
import "@/styles/bw-lp.css";

const digits = (v: string) => v.replace(/\D/g, "");
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function maskPhone(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

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
    description: "Página da placa de obra Bewild. Veja o portal de acompanhamento do studio.",
    canonicalPath: "/o",
    noindex: true,
  });

  const utmDefaults = { source: "qr", medium: "placa", campaign: "obra-placa" };

  const [view, setView] = useState<"gate" | "portal">("gate");
  const [nome, setNome] = useState("");
  const [whats, setWhats] = useState("");
  const [email, setEmail] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onGateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nome.trim().length < 2 || digits(whats).length < 10 || !EMAIL_RE.test(email.trim())) {
      setErr("Preenche nome, telefone e e-mail pra ver o portal.");
      return;
    }
    setErr(null);
    setSubmitting(true);
    const utm = readUtm(utmDefaults);
    await sendLead({
      name: nome.trim(),
      whatsapp: digits(whats),
      email: email.trim() || null,
      location: bairro,
      area_m2: null,
      objetivo: null,
      chaves: null,
      planta: null,
      message: "Lead via QR da placa de obra",
      ...utm,
    });
    trackEvent("generate_lead", { method: "lp_obra_gate", location: bairro || undefined });
    setSubmitting(false);
    setView("portal");
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  // CTA quente dentro do portal
  const openWhats = () => {
    const utm = readUtm(utmDefaults);
    trackEvent("click_whatsapp", { category: "lp_obra_portal", label: utm.utm_campaign });
    const bairroTxt = bairro ? ` em ${bairro}` : "";
    const msg = `Olá! Vim pela placa da obra Bewild${bairroTxt}. Vi o portal de acompanhamento e quero um desses pro meu studio. (origem: ${utm.utm_campaign})`;
    const url = `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const [showSticky, setShowSticky] = useState(false);
  useEffect(() => {
    if (view !== "portal") {
      setShowSticky(false);
      return;
    }
    const onScroll = () => setShowSticky(window.scrollY > window.innerHeight * 0.5);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [view]);

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

      {view === "gate" && (
        <>
          <section className="hero is-gate" aria-label="Obra Bewild">
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
                na obra. Deixe seu contato pra abrir o portal que o cliente Bewild
                usa pra acompanhar cada etapa.
              </p>

              <form className="gate-card" onSubmit={onGateSubmit} noValidate>
                <div className="eye">Acesso ao portal de acompanhamento</div>
                <h3>Veja a obra por dentro</h3>
                <p>Preenche pra abrir o portal. Seu contato fica com a gente, sem ligação automática e sem spam.</p>
                <div className="fld">
                  <label htmlFor="g-nome">Nome <span className="req">*</span></label>
                  <input id="g-nome" type="text" autoComplete="name" value={nome} onChange={(e) => setNome(e.target.value)} required />
                </div>
                <div className="fld">
                  <label htmlFor="g-whats">Telefone / WhatsApp <span className="req">*</span></label>
                  <input id="g-whats" type="tel" inputMode="tel" placeholder="(11) 99999-9999" autoComplete="tel" value={whats} onChange={(e) => setWhats(maskPhone(e.target.value))} required />
                </div>
                <div className="fld">
                  <label htmlFor="g-email">E-mail <span className="req">*</span></label>
                  <input id="g-email" type="email" inputMode="email" placeholder="voce@email.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                {err && <p className="fld-err">{err}</p>}
                <button type="submit" className="btn btn-cyan submit" disabled={submitting}>
                  <span>{submitting ? "Abrindo…" : "Ver portal"}</span><span className="ar">→</span>
                </button>
              </form>
            </div>
          </section>

          <div className="marquee" aria-hidden="true">
            <div className="trk">
              <span>CONSTRUÍDO POR QUEM NÃO ACEITA O ÓBVIO <i>/</i> BUILT BY THE WILD ONES <i>/</i> </span>
              <span>CONSTRUÍDO POR QUEM NÃO ACEITA O ÓBVIO <i>/</i> BUILT BY THE WILD ONES <i>/</i> </span>
              <span>CONSTRUÍDO POR QUEM NÃO ACEITA O ÓBVIO <i>/</i> BUILT BY THE WILD ONES <i>/</i> </span>
            </div>
          </div>
        </>
      )}

      {view === "portal" && (
        <section className="sec sec-dark lp-portalview" aria-label="Portal de acompanhamento">
          <div className="sec-mark"><span className="n">01</span><span className="t">Portal de acompanhamento</span><span className="ln" /></div>
          <div className="sec-head">
            <h2>O portal que o cliente Bewild <i>acompanha.</i></h2>
            <p className="lead">
              Cronograma por etapa, fotos de evolução e relatório toda semana. A obra
              andando pelo celular, sem ir até lá nem cobrar no WhatsApp.
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

          <div className="lp-portal-cta">
            <div className="eye"><span className="mono tag">Gostou do que viu?</span></div>
            <h3>Quer um portal desses pro seu studio?</h3>
            <p>A gente reforma, mobília e entrega pronto pra render, com esse acompanhamento do primeiro dia à entrega.</p>
            <div className="act">
              <button className="btn btn-cyan" type="button" onClick={openWhats}>
                <span>Falar no WhatsApp</span><span className="ar">→</span>
              </button>
            </div>
            <p className="rea">Atendimento de gente real · retorno rápido · <b>150+ studios entregues</b></p>
          </div>
        </section>
      )}

      <footer className="lp-foot">
        BEWILD · GRUPO BWILD · SÃO PAULO · BR
        <span>Acompanhamento ilustrativo do portal Bwild Workflow</span>
      </footer>

      {view === "portal" && (
        <div className={`sticky${showSticky ? " show" : ""}`} aria-hidden={!showSticky}>
          <button
            className="btn btn-cyan"
            type="button"
            tabIndex={showSticky ? 0 : -1}
            onClick={openWhats}
          >
            <span>Falar no WhatsApp</span><span className="ar">→</span>
          </button>
        </div>
      )}
    </div>
  );
}
