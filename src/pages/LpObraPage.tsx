/**
 * LpObraPage — /o · página fantasma (destino do QR da placa de obra).
 * Fluxo (definido com o Rodrigo): gate (nome + telefone + e-mail) ->
 * salva o lead -> redireciona pro PORTAL NAVEGÁVEL real (Bwild Workflow),
 * o mesmo demo linkado no orçamento público, com o sufixo ?cta=placa pra
 * diferenciar do link usado nos orçamentos do Pedro (o CTA no portal é
 * renderizado no app do Workflow só quando esse flag está presente).
 *  - noindex, sem nav/footer global, acessível só por URL direta (QR).
 *  - Lead via notify-lead (mesmo pipeline da DiagnosticoPage).
 */
import { useState } from "react";
import { useSeo } from "@/lib/useSeo";
import { CONTACT } from "@/components/landing/content";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/ga4";
import { useVideoAutoplayInView } from "@/lib/useVideoAutoplayInView";
import "@/styles/bw-lp.css";

/**
 * Vitrine dedicada do portal (Bwild Workflow) — rota /vitrine/:projectId.
 * Marca a sessão como "vitrine da placa" (ativa o CTA comercial no portal) e
 * encaminha pro mesmo demo público. O link dos orçamentos do Pedro vai direto
 * pro /auth, sem vitrine, então lá o CTA não aparece.
 *
 * ⚠️ GO-LIVE: hoje aponta pro PREVIEW do Workflow (funciona sem publicar).
 * Antes de publicar o site em produção: (1) publique o app do Workflow e
 * (2) troque esta URL pela de produção abaixo.
 *   Produção: https://bwildworkflow.com/vitrine/ecf601c3-87f9-4824-9fb3-26a96d120761
 */
const WORKFLOW_DEMO_URL =
  "https://id-preview--c9754542-d1f4-4007-9ead-4212e17bb44e.lovable.app/vitrine/ecf601c3-87f9-4824-9fb3-26a96d120761";

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

function withTimeout<T>(p: Promise<T>, ms: number) {
  return Promise.race([p, new Promise((resolve) => setTimeout(resolve, ms))]);
}

export default function LpObraPage() {
  const params =
    typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const bairroRaw = params?.get("bairro")?.trim() || "";
  const bairro = bairroRaw || null;
  const bairroUp = bairro ? bairro.toUpperCase() : "";
  const videoArqRef = useVideoAutoplayInView();
  const videoObraRef = useVideoAutoplayInView();

  useSeo({
    title: "Obra Bewild · acompanhamento",
    description: "Página da placa de obra Bewild. Veja o portal de acompanhamento do studio.",
    canonicalPath: "/o",
    noindex: true,
  });

  const utmDefaults = { source: "qr", medium: "placa", campaign: "obra-placa" };

  const [stage, setStage] = useState<"form" | "opening">("form");
  const [nome, setNome] = useState("");
  const [whats, setWhats] = useState("");
  const [email, setEmail] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const goPortal = () => {
    window.location.href = WORKFLOW_DEMO_URL;
  };

  const onGateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nome.trim().length < 2 || digits(whats).length < 10 || !EMAIL_RE.test(email.trim())) {
      setErr("Preenche nome, telefone e e-mail pra ver o portal.");
      return;
    }
    setErr(null);
    setSubmitting(true);
    const utm = readUtm(utmDefaults);
    // Garante a gravação do lead antes de navegar (com teto de tempo).
    await withTimeout(
      sendLead({
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
      }),
      3500,
    );
    trackEvent("generate_lead", { method: "lp_obra_gate", location: bairro || undefined });
    trackEvent("open_portal_demo", { category: "lp_obra", label: utm.utm_campaign });
    setSubmitting(false);
    setStage("opening");
    goPortal();
  };

  const openWhats = () => {
    const utm = readUtm(utmDefaults);
    trackEvent("click_whatsapp", { category: "lp_obra_gate", label: utm.utm_campaign });
    const bairroTxt = bairro ? ` em ${bairro}` : "";
    const msg = `[PLACA DE OBRA] Olá! Vi a placa da obra da Bewild${bairroTxt} e quero saber como transformar meu studio em renda. (origem: ${utm.utm_campaign})`;
    window.open(`https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
  };

  const scrollToGate = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById("gate-card")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

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

      <section className="hero is-gate" aria-label="Obra Bewild">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-top">
          <img className="hero-logo" src="/brand/bewild-logo-branca.png" alt="Bewild · Grupo Bwild" />
          <div className="hero-eyebrow">
            <span className="mono tag">{eyebrowText}</span>
          </div>
          <h1>
            Você parou em frente a uma obra.
            <span className="lo">Veja como ela anda por dentro.</span>
          </h1>
          <p className="sub">
            Atrás dessa placa, um studio está virando renda, sem o dono entrar na
            obra. Deixe seu contato pra abrir o portal navegável que o cliente
            Bewild usa pra acompanhar a obra, do primeiro dia à entrega.
          </p>


          {stage === "form" ? (
            <form id="gate-card" className="gate-card" onSubmit={onGateSubmit} noValidate>
              <div className="eye">Acesso ao portal de acompanhamento</div>
              <h3>Veja a obra por dentro</h3>
              <p>Preenche pra abrir o portal navegável. Seu contato fica com a gente, sem ligação automática e sem spam.</p>
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
              <button type="button" className="skip" onClick={openWhats}>Prefiro falar no WhatsApp</button>
            </form>
          ) : (
            <div id="gate-card" className="gate-card">
              <div className="eye">Portal de acompanhamento</div>
              <h3>Abrindo o portal…</h3>
              <p>Você está sendo levado pro portal navegável da Bewild. Se não abrir em alguns segundos, use o botão abaixo.</p>
              <button type="button" className="btn btn-cyan submit" onClick={goPortal}>
                <span>Abrir o portal</span><span className="ar">→</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 01 — QUEM FAZ */}
      <section className="lp-quem" aria-label="Quem faz essa obra">
        <div className="sec-mark"><span className="n">01</span><span className="t">Quem faz essa obra</span><span className="ln" /></div>
        <div className="lp-quem-head">
          <h2>A Bewild constrói studios pra render. <i>Este é um deles.</i></h2>
          <p className="lead">Construtora do Grupo Bwild, especializada em reforma turnkey: projeto, obra, marcenaria, mobília e setup num contrato só.</p>
        </div>
        <div className="lp-quem-data">
          <div className="cell"><b>150+</b><span>studios entregues</span></div>
          <div className="cell"><b>60</b><span>dias úteis · a partir de</span></div>
          <div className="cell"><b>05</b><span>anos de garantia</span></div>
        </div>

        <div className="vblock">
          <div className="vtext">
            <p className="vtag">antes de qualquer parede</p>
            <h3>Quem projeta o seu studio mede ele <em>pessoalmente.</em></h3>
            <p>A arquiteta vai até o imóvel e decide ali o que muda na diária: circulação, ponto de luz, onde a cama rende foto.</p>
          </div>
          <div className="vframe">
            <video src="/videos/arquiteta-medicao.mp4" poster="/videos/arquiteta-medicao-poster.jpg" muted loop playsInline preload="metadata" aria-label="Arquiteta da Bewild fazendo a medição do imóvel" />
          </div>
        </div>

        <div className="vblock invertido">
          <div className="vframe">
            <video src="/videos/time-obra.mp4" poster="/videos/time-obra-poster.jpg" muted loop playsInline preload="metadata" aria-label="Time de obra da Bewild a caminho da reforma" />
          </div>
          <div className="vtext">
            <p className="vtag">e quem executa tem rosto</p>
            <h3>A obra que você não toca tem <em>time próprio.</em></h3>
            <p>Quem reforma trabalha na Bewild, não é um terceiro que aparece e some. O dono acompanha tudo à distância pelo portal.</p>
          </div>
        </div>

        <div className="lp-quem-cta">
          <a className="btn btn-cyan" href="#gate-card" onClick={scrollToGate}>
            <span>Ver esta obra por dentro</span><span className="ar">→</span>
          </a>
          <button type="button" className="btn btn-ghost" onClick={openWhats}>
            <span>Falar no WhatsApp</span>
          </button>
        </div>
      </section>

      <div className="marquee" aria-hidden="true">
        <div className="trk">
          <span>CONSTRUÍDO POR QUEM NÃO ACEITA O ÓBVIO <i>/</i> BUILT BY THE WILD ONES <i>/</i> </span>
          <span>CONSTRUÍDO POR QUEM NÃO ACEITA O ÓBVIO <i>/</i> BUILT BY THE WILD ONES <i>/</i> </span>
          <span>CONSTRUÍDO POR QUEM NÃO ACEITA O ÓBVIO <i>/</i> BUILT BY THE WILD ONES <i>/</i> </span>
        </div>
      </div>

      <footer className="lp-foot">
        BEWILD · GRUPO BWILD · SÃO PAULO · BR
        <span>Portal de acompanhamento · Bwild Workflow</span>
      </footer>
    </div>
  );
}
