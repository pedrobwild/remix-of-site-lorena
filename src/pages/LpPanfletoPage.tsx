/**
 * LpPanfletoPage — /p · página fantasma (destino do QR do panfleto).
 *
 * Requisitos críticos:
 *  - noindex (robots), sem nav global, sem footer global.
 *  - Acessível apenas via URL direta (QR).
 *  - Reaproveita pipeline de lead da DiagnosticoPage (notify-lead).
 */
import { useEffect, useMemo, useState } from "react";
import { useSeo } from "@/lib/useSeo";
import { CONTACT } from "@/components/landing/content";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/ga4";
import { useVideoAutoplayInView } from "@/lib/useVideoAutoplayInView";
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

const OBJETIVOS = ["Short stay", "Locação tradicional", "Uso misto", "Moradia", "Ainda avaliando"];
const CHAVES = ["Sim", "Ainda não", "Estou comprando"];

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

export default function LpPanfletoPage() {
  const params =
    typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const bairroRaw = params?.get("bairro")?.trim() || "";
  const bairro = bairroRaw || null;
  const bairroUp = bairro ? bairro.toUpperCase() : "";
  const videoArqRef = useVideoAutoplayInView();
  const videoObraRef = useVideoAutoplayInView();

  useSeo({
    title: "Bewild · diagnóstico do seu studio",
    description: "Página do panfleto Bewild. Solicite o diagnóstico do seu studio.",
    canonicalPath: "/p",
    noindex: true,
  });

  const utmDefaults = { source: "qr", medium: "panfleto", campaign: "panfleto" };

  // Form
  const [nome, setNome] = useState("");
  const [whats, setWhats] = useState("");
  const [email, setEmail] = useState("");
  const [local, setLocal] = useState(bairro || "");
  const [chaves, setChaves] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [metragem, setMetragem] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const nomeOk = nome.trim().length >= 2;
  const whatsOk = digits(whats).length >= 10;
  const emailOk = EMAIL_RE.test(email.trim());
  const localOk = local.trim().length >= 2;
  const chavesOk = chaves.length > 0;
  const objetivoOk = objetivo.length > 0;
  const metragemOk = digits(metragem).length > 0;
  const canSubmit = nomeOk && whatsOk && emailOk && localOk && chavesOk && objetivoOk && metragemOk;

  const messageText = useMemo(() => {
    const lines: string[] = ["[PANFLETO] Olá! Quero o diagnóstico do meu studio."];
    const add = (l: string, v: string) => { const x = v.trim(); if (x) lines.push(`${l}: ${x}`); };
    add("Nome", nome); add("WhatsApp", whats); add("E-mail", email);
    add("Bairro", local); add("Chaves", chaves); add("Objetivo", objetivo);
    add("Metragem (m²)", metragem);
    return lines.join("\n");
  }, [nome, whats, email, local, chaves, objetivo, metragem]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || submitting) {
      setTouched({ nome: true, whats: true, email: true, local: true, chaves: true, objetivo: true, metragem: true });
      return;
    }
    setSubmitting(true);
    const utm = readUtm(utmDefaults);
    const areaNum = digits(metragem) ? Number(digits(metragem)) : null;
    await sendLead({
      name: nome.trim(),
      whatsapp: digits(whats),
      email: email.trim() || null,
      location: local.trim() || null,
      area_m2: Number.isFinite(areaNum as number) ? (areaNum as number) : null,
      objetivo: objetivo || null,
      chaves: chaves || null,
      planta: null,
      message: null,
      ...utm,
    });
    trackEvent("generate_lead", {
      method: "diagnostico_form",
      objetivo: objetivo || undefined,
      chaves: chaves || undefined,
      location: local || undefined,
    });
    const url = `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(
      `${messageText}\n(origem: ${utm.utm_campaign})`,
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setDone(true);
    setSubmitting(false);
  };

  const openWhatsRaw = () => {
    const utm = readUtm(utmDefaults);
    trackEvent("click_whatsapp", { category: "lp_panfleto", label: utm.utm_campaign });
    const bairroTxt = bairro ? ` no bairro ${bairro}` : "";
    const msg = `[PANFLETO] Olá! Recebi o panfleto da Bewild e quero o diagnóstico do meu studio${bairroTxt}. (origem: ${utm.utm_campaign})`;
    const url = `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const scrollToForm = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById("diagnostico")?.scrollIntoView({ behavior: "smooth" });
  };

  const [showSticky, setShowSticky] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowSticky(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const sheetNo = bairro ? `SHEET · PANFLETO ${bairroUp}` : "SHEET · PANFLETO";

  return (
    <div className="bw-lp">
      <div className="bw-grain" aria-hidden="true" />
      <div className="bw-frame" aria-hidden="true">
        <i className="tk tl" /><i className="tk tr" /><i className="tk bl" /><i className="tk br" />
      </div>
      <div className="bw-titleblock" aria-hidden="true">
        BEWILD · GRUPO BWILD<br /><b>BW-PANFLETO</b><br />SÃO PAULO · BR
      </div>
      <div className="bw-sheetno" aria-hidden="true">{sheetNo}</div>

      {/* HERO */}
      <section className="hero" aria-label="Reforma turn-key Bewild">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-top">
          <img className="hero-logo" src="/brand/bewild-logo-cropped.png" alt="Bewild · Grupo Bwild" />
          <div className="hero-eyebrow">
            <span className="mono tag">Reforma turn-key de studios · São Paulo</span>
          </div>
          <h1>
            Seu studio pronto pra render.
            <span className="lo">Sem você virar gerente de obra.</span>
          </h1>
          <p className="sub">
            Projeto, obra, marcenaria, mobília e decoração em um único contrato.
            Você acompanha tudo pelo portal. O trabalho fica com a gente.
          </p>
          <div className="cta">
            <a className="btn btn-cyan" href="#diagnostico" onClick={scrollToForm}>
              <span>Solicitar diagnóstico</span><span className="ar">→</span>
            </a>
            <button className="btn btn-ghost" type="button" onClick={openWhatsRaw}>
              <span>Falar no WhatsApp</span>
            </button>
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

      {/* 01 — DIAGNÓSTICO */}
      <section className="paper" id="diagnostico" aria-label="Diagnóstico do studio">
        <div className="sec-mark"><span className="n">01</span><span className="t">Diagnóstico</span><span className="ln" /></div>

        <div className="form-wrap">
          <div className="pitch">
            <h2>Começa com um <i>diagnóstico.</i></h2>
            <p>
              Você manda os dados do imóvel. A gente devolve uma leitura de escopo,
              projeto e próximos passos. Sem compromisso.
            </p>
            <div className="trust"><b>✓</b> +150 studios entregues em São Paulo</div>
          </div>

          <form className={`formcard${done ? " done" : ""}`} onSubmit={onSubmit} noValidate>
            <div className="eye">Diagnóstico Bewild</div>
            <div className="form-body">
              <div className="fld">
                <label htmlFor="p-nome">Nome <span className="req">*</span></label>
                <input id="p-nome" type="text" autoComplete="name" value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, nome: true }))} required />
              </div>
              <div className="frow">
                <div className="fld">
                  <label htmlFor="p-whats">WhatsApp <span className="req">*</span></label>
                  <input id="p-whats" type="tel" inputMode="tel" placeholder="(11) 99999-9999"
                    autoComplete="tel" value={whats}
                    onChange={(e) => setWhats(maskPhone(e.target.value))}
                    onBlur={() => setTouched((t) => ({ ...t, whats: true }))} required />
                </div>
                <div className="fld">
                  <label htmlFor="p-email">E-mail <span className="req">*</span></label>
                  <input id="p-email" type="email" autoComplete="email" placeholder="voce@email.com"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, email: true }))} required />
                </div>
              </div>
              <div className="fld">
                <label htmlFor="p-local">Bairro do imóvel <span className="req">*</span></label>
                <input id="p-local" type="text" placeholder="Ex: Pinheiros, Itaim, Butantã"
                  value={local} onChange={(e) => setLocal(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, local: true }))} required />
              </div>

              <fieldset className="chips">
                <legend>Já tem as chaves do imóvel? <span className="req">*</span></legend>
                <div className="opts">
                  {CHAVES.map((opt) => (
                    <button key={opt} type="button" aria-pressed={chaves === opt}
                      className={`opt${chaves === opt ? " sel" : ""}`}
                      onClick={() => setChaves(chaves === opt ? "" : opt)}>{opt}</button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="chips">
                <legend>Objetivo <span className="req">*</span></legend>
                <div className="opts">
                  {OBJETIVOS.map((opt) => (
                    <button key={opt} type="button" aria-pressed={objetivo === opt}
                      className={`opt${objetivo === opt ? " sel" : ""}`}
                      onClick={() => setObjetivo(objetivo === opt ? "" : opt)}>{opt}</button>
                  ))}
                </div>
              </fieldset>

              <div className="fld">
                <label htmlFor="p-m2">Metragem (m²) <span className="req">*</span></label>
                <input id="p-m2" type="text" inputMode="numeric" placeholder="32"
                  value={metragem}
                  onChange={(e) => setMetragem(e.target.value.replace(/[^\d.,]/g, "").slice(0, 6))}
                  onBlur={() => setTouched((t) => ({ ...t, metragem: true }))} required />
              </div>

              <button type="submit" className="btn btn-cyan submit" disabled={!canSubmit || submitting}>
                <span>{submitting ? "Enviando…" : "Solicitar diagnóstico"}</span><span className="ar">→</span>
              </button>
              <p className="guarantee">Sem compromisso · a gente só liga se você pedir</p>

              <div className="or"><span>ou</span></div>

              <button type="button" className="btn btn-line" onClick={openWhatsRaw}>
                <span>Prefiro falar no WhatsApp</span>
              </button>

              {/* feedback de validação acessível */}
              {Object.keys(touched).length > 0 && !canSubmit && (
                <p style={{ color: "#c0392b", fontSize: 12, marginTop: 10 }}>
                  Preencha todos os campos obrigatórios.
                </p>
              )}
            </div>
            <div className="success" role="status">
              <div className="ok" aria-hidden="true">✓</div>
              <h3>Recebemos seus dados.</h3>
              <p>Nosso time comercial vai falar com você no WhatsApp.</p>
            </div>
          </form>
        </div>
      </section>

      {/* 02 — RESULTADO REAL */}
      <section className="sec sec-dark" aria-label="Resultado real Rafael">
        <div className="sec-mark"><span className="n">02</span><span className="t">Resultado real</span><span className="ln" /></div>
        <figure className="raf-quote">
          <blockquote>“Esses studios serão um negócio pra mim. Renda vitalícia.”</blockquote>
          <figcaption>Rafael · cliente Bewild · studio no Butantã · 70% de ocupação em novembro</figcaption>
        </figure>
        <p className="raf-note">Resultado de um cliente real. Ocupação e diária variam conforme imóvel, região e operação.</p>
      </section>

      {/* 03 — QUEM FAZ */}
      <section className="lp-quem" aria-label="Quem faz">
        <div className="sec-mark"><span className="n">03</span><span className="t">Quem faz</span><span className="ln" /></div>

        <div className="vblock">
          <div className="vtext">
            <p className="vtag">antes de qualquer parede</p>
            <h3>Quem projeta o seu studio mede ele <em>pessoalmente.</em></h3>
            <p>A arquiteta vai até o imóvel e decide ali o que muda na diária: circulação, ponto de luz, onde a cama rende foto.</p>
          </div>
          <div className="vframe">
            <video ref={videoArqRef} src="/videos/arquiteta-medicao.mp4" poster="/videos/arquiteta-medicao-poster.jpg" muted loop playsInline preload="metadata" aria-label="Arquiteta da Bewild fazendo a medição do imóvel" />
          </div>
        </div>

        <div className="vblock invertido">
          <div className="vframe">
            <video ref={videoObraRef} src="/videos/time-obra.mp4" poster="/videos/time-obra-poster.jpg" muted loop playsInline preload="metadata" aria-label="Time de obra da Bewild a caminho da reforma" />
          </div>
          <div className="vtext">
            <p className="vtag">e quem executa tem rosto</p>
            <h3>A obra que você não toca tem <em>time próprio.</em></h3>
            <p>Quem reforma trabalha na Bewild, não é um terceiro que aparece e some. O dono acompanha tudo à distância pelo portal.</p>
          </div>
        </div>

        <div className="lp-quem-cta">
          <a className="btn btn-cyan" href="#diagnostico" onClick={scrollToForm}>
            <span>Solicitar diagnóstico</span><span className="ar">→</span>
          </a>
        </div>
      </section>



      {/* FOOTER MÍNIMO */}
      <footer className="lp-foot">
        BEWILD · GRUPO BWILD · SÃO PAULO · BR
      </footer>

      {/* STICKY MOBILE */}
      <div className={`sticky${showSticky ? " show" : ""}`} aria-hidden={!showSticky}>
        <a
          className="btn btn-cyan"
          href="#diagnostico"
          tabIndex={showSticky ? 0 : -1}
          onClick={scrollToForm}
        >
          <span>Solicitar diagnóstico</span><span className="ar">→</span>
        </a>
      </div>
    </div>
  );
}
