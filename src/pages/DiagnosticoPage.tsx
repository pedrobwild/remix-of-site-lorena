import { useEffect, useMemo, useRef, useState } from "react";
import { useSeo, breadcrumbJsonLd, organizationJsonLd } from "../lib/useSeo";
import { useSiteSettings } from "../lib/useSiteSettings";
import BewildSiteNav from "@/components/BewildSiteNav";
import SiteFooter from "@/components/SiteFooter";
import StickyMobileCTA from "@/components/StickyMobileCTA";
import { useFaq } from "@/lib/useFaq";
import { CONTACT } from "../components/landing/content";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/ga4";
import depoimentoVideo from "@/assets/testimonials/depoimento-cliente.mp4.asset.json";
import "../styles/bw-diag.css";

/* ============================================================
 * DiagnosticoPage — /diagnostico
 * "Prancha 02" do projeto: o investidor abre a ficha do próprio studio.
 * Linguagem de prancheta alinhada à home. Form é o herói.
 * Mecânica preservada: lead -> notify-lead (Supabase) + WhatsApp + GA4.
 * CSS isolado .bw-diag.
 * ============================================================ */

const RECEBE: { t: string; rest: string }[] = [
  { t: "Potencial de diária e ocupação", rest: " pro seu bairro" },
  { t: "Escopo da reforma", rest: " pra deixar o studio pronto pra operar" },
  { t: "Faixa de investimento e prazo", rest: " estimados pro seu caso" },
  { t: "Os próximos passos", rest: ", no seu tempo e sem compromisso" },
];

const PASSOS: { t: string; d: string }[] = [
  { t: "Análise", d: "A gente lê o potencial do seu imóvel pra short stay, considerando bairro, metragem e estado atual." },
  { t: "Retorno no WhatsApp", d: "Te chamamos com uma leitura inicial e tiramos suas dúvidas. Sem robô, gente de verdade." },
  { t: "Visita e projeto", d: "Se fizer sentido pra você, agendamos a visita técnica e começamos o projeto do studio." },
  { t: "Proposta fechada", d: "Escopo, prazo e orçamento definidos antes de começar. Sem surpresa no meio da obra." },
];

const ESCOPO: { t: string; d: string }[] = [
  { t: "Projeto de arquitetura", d: "Planta humanizada, desenhada pra aproveitar cada metro e render." },
  { t: "Obra completa", d: "Demolição a acabamento com time próprio. Você acompanha pelo portal." },
  { t: "Marcenaria sob medida", d: "Cada centímetro aproveitado pra valorizar o studio compacto." },
  { t: "Mobiliário e enxoval", d: "Mobília, eletro e enxoval instalados, prontos pra receber hóspede." },
  { t: "Styling e fotos", d: "Ambientação e fotos profissionais prontas pro anúncio no short stay." },
  { t: "Portal de acompanhamento", d: "Cronograma, decisões e evolução da obra na palma da mão." },
];

const STATS: { num: string; suf: string; small: string }[] = [
  { num: "150", suf: "+", small: "studios entregues em São Paulo" },
  { num: "60", suf: "dias úteis", small: "referência de prazo de obra, a partir de" },
  { num: "5", suf: "anos", small: "garantia de mão de obra" },
  { num: "100", suf: "% turn-key", small: "projeto, obra e operação num processo único" },
];

const OBJETIVOS = ["Short stay", "Locação tradicional", "Uso misto", "Moradia", "Ainda avaliando"];
const CHAVES = ["Sim", "Ainda não", "Estou comprando"];
const PLANTA = ["Sim", "Não", "Não sei"];

function maskPhone(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
const digits = (v: string) => v.replace(/\D/g, "");
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Form = {
  nome: string; whats: string; email: string; local: string;
  metragem: string; objetivo: string; chaves: string; planta: string; mensagem: string;
};
const EMPTY_FORM: Form = {
  nome: "", whats: "", email: "", local: "", metragem: "", objetivo: "", chaves: "", planta: "", mensagem: "",
};

/* ============= Ícones ============= */
function IconChat({ className = "ic" }: { className?: string }) {
  return (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>);
}
function IconArrow({ className = "ar" }: { className?: string }) {
  return (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>);
}
function IconArrowUp({ className = "ar" }: { className?: string }) {
  return (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" /></svg>);
}
function IconCheck({ className = "ic" }: { className?: string }) {
  return (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>);
}
function IconPlus({ className = "" }: { className?: string }) {
  return (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>);
}
function IconPlay({ className = "" }: { className?: string }) {
  return (<svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.14v13.72a1 1 0 0 0 1.52.86l11.14-6.86a1 1 0 0 0 0-1.72L9.52 4.28A1 1 0 0 0 8 5.14z" /></svg>);
}
function IconClose({ className = "" }: { className?: string }) {
  return (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>);
}

export default function DiagnosticoPage() {
  const { settings } = useSiteSettings();

  useSeo({
    title: "Diagnóstico Bewild · Análise inicial do seu studio",
    description:
      "Envie os dados do seu imóvel e receba uma análise inicial de escopo, projeto e próximos passos para a reforma turn-key do seu studio em São Paulo.",
    canonicalPath: "/diagnostico",
    ogType: "website",
    jsonLd: settings
      ? [
          organizationJsonLd(settings),
          breadcrumbJsonLd(settings, [
            { name: "Início", path: "/" },
            { name: "Diagnóstico", path: "/diagnostico" },
          ]),
        ]
      : undefined,
  });

  const waUrl = `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(
    "Olá, prefiro falar com um especialista sobre o diagnóstico."
  )}`;

  const scrollToForm = () => {
    document.getElementById("diag-formcard")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <>
      <BewildSiteNav />
      <main id="main" className="bw-diag">
        <div className="bw-diag__frame" aria-hidden="true">
          <i className="tk tl" /><i className="tk tr" /><i className="tk bl" /><i className="tk br" />
        </div>
        <div className="bw-diag__titleblock" aria-hidden="true">BEWILD · GRUPO BWILD<br /><b>BW—002 / DIAGNÓSTICO</b><br />SÃO PAULO · BR</div>
        <div className="bw-diag__sheetno" aria-hidden="true">SHEET 02 / FICHA DO IMÓVEL</div>

        <section className="bw-diag__hero" aria-label="Solicitar diagnóstico">
          <div className="bw-diag__wrap">
            <div className="bw-diag__hgrid">
              <DiagnosticoPitch />
              <DiagnosticoForm />
              <TestimonialCard waUrl={waUrl} />
            </div>
          </div>
        </section>

        <SupportSections />
        <CtaFinal waUrl={waUrl} onForm={scrollToForm} />
      </main>
      <StickyMobileCTA
        href={waUrl}
        label="Solicitar diagnóstico"
        hideWhenVisibleSelector="footer, .bw-diag__formcard"
      />
      <SiteFooter />
    </>
  );
}

function DiagnosticoPitch() {
  return (
    <div className="bw-diag__pitch">
      <p className="bw-diag__eyebrow">Diagnóstico · sem compromisso</p>
      <h1 className="bw-diag__title">
        Seu studio pronto pra <span className="accent">render</span> começa aqui.
      </h1>
      <p className="bw-diag__sub">
        Você manda os dados do imóvel. A gente devolve uma leitura do potencial de renda, do escopo da reforma e dos próximos passos. Sem custo e sem compromisso.
      </p>
      <div className="bw-diag__recebe">
        <div className="bw-diag__rlabel">O que você recebe</div>
        {RECEBE.map((r, i) => (
          <div className="bw-diag__ritem" key={r.t}>
            <span className="rn">0{i + 1}</span>
            <span className="rt"><b>{r.t}</b>{r.rest}</span>
          </div>
        ))}
      </div>
      <div className="bw-diag__trustband" role="note">
        <span className="bw-diag__trustband-icon" aria-hidden="true"><IconCheck /></span>
        <span><strong>+150</strong> studios entregues em São Paulo</span>
      </div>
    </div>
  );
}

function DiagnosticoForm() {
  const [f, setF] = useState<Form>(EMPTY_FORM);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));

  const nomeOk = f.nome.trim().length >= 2;
  const whatsOk = digits(f.whats).length >= 10;
  const emailFilled = f.email.trim().length > 0;
  const emailOk = EMAIL_RE.test(f.email.trim());
  const emailValid = !emailFilled || emailOk;
  const localOk = f.local.trim().length >= 2;
  const chavesOk = f.chaves.length > 0;
  const objetivoOk = f.objetivo.length > 0;
  const canSubmit = nomeOk && whatsOk && localOk && chavesOk && objetivoOk && emailValid;

  const messageText = useMemo(() => {
    const lines: string[] = ["Olá! Quero um diagnóstico do meu studio."];
    const add = (label: string, val: string) => {
      const v = val.trim();
      if (v) lines.push(`${label}: ${v}`);
    };
    add("Nome", f.nome);
    add("WhatsApp", f.whats);
    add("E-mail", f.email);
    add("Bairro", f.local);
    add("Chaves", f.chaves);
    add("Objetivo", f.objetivo);
    add("Metragem (m²)", f.metragem);
    add("Planta", f.planta);
    add("Mensagem", f.mensagem);
    return lines.join("\n");
  }, [f]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting) {
      setTouched({ nome: true, whats: true, email: true, local: true, chaves: true, objetivo: true });
      return;
    }
    setSubmitting(true);

    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const areaDigits = f.metragem ? digits(f.metragem) : "";
    const areaNum = areaDigits ? Number(areaDigits) : null;
    const leadPayload = {
      name: f.nome.trim(),
      whatsapp: digits(f.whats),
      email: f.email.trim() || null,
      location: f.local.trim() || null,
      area_m2: Number.isFinite(areaNum as number) ? (areaNum as number) : null,
      objetivo: f.objetivo || null,
      chaves: f.chaves || null,
      planta: f.planta || null,
      message: f.mensagem.trim() || null,
      utm_source: params?.get("utm_source") ?? null,
      utm_medium: params?.get("utm_medium") ?? null,
      utm_campaign: params?.get("utm_campaign") ?? null,
      referrer: typeof document !== "undefined" ? document.referrer || null : null,
      landing_path: typeof window !== "undefined" ? window.location.pathname : null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    };

    void supabase.functions
      .invoke("notify-lead", { body: leadPayload })
      .catch((err) => {
        console.error("[notify-lead] invoke failed", err);
      });

    trackEvent("generate_lead", {
      method: "diagnostico_form",
      objetivo: f.objetivo || undefined,
      chaves: f.chaves || undefined,
      planta: f.planta || undefined,
      location: f.local || undefined,
    });

    const url = `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(messageText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setF(EMPTY_FORM);
    setTouched({});
    setShowMore(false);
    setSuccess(true);
    setSubmitting(false);
  }

  return (
    <form onSubmit={onSubmit} noValidate className="bw-diag__formcard" id="diag-formcard" aria-label="Formulário de diagnóstico">
      <i className="tk tl" /><i className="tk tr" /><i className="tk bl" /><i className="tk br" />
      <div className="bw-diag__fc-head">
        <span className="fl">Ficha do seu studio</span>
        <span className="fr">BW—002</span>
      </div>

      {success && (
        <div className="bw-diag__success" role="status">
          <strong>Recebemos seus dados.</strong>
          <span>Nosso time comercial vai falar com você no WhatsApp.</span>
        </div>
      )}

      {!success && (
        <>
          <div className="bw-diag__field">
            <label htmlFor="diag-nome">Nome <span className="bw-diag__req">*</span></label>
            <input id="diag-nome" type="text" placeholder="Como podemos te chamar"
              className={touched.nome && !nomeOk ? "bad" : ""}
              value={f.nome} onChange={(e) => set("nome", e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, nome: true }))}
              autoComplete="name" required maxLength={120} />
            {touched.nome && !nomeOk && <span className="bw-diag__error">Informe seu nome.</span>}
          </div>

          <div className="bw-diag__frow">
            <div className="bw-diag__field">
              <label htmlFor="diag-whats">WhatsApp <span className="bw-diag__req">*</span></label>
              <input id="diag-whats" type="tel" inputMode="tel" placeholder="(11) 99999-9999"
                className={touched.whats && !whatsOk ? "bad" : ""}
                value={f.whats} onChange={(e) => set("whats", maskPhone(e.target.value))}
                onBlur={() => setTouched((t) => ({ ...t, whats: true }))}
                autoComplete="tel" required />
              {touched.whats && !whatsOk && <span className="bw-diag__error">Informe um WhatsApp com DDD.</span>}
            </div>
            <div className="bw-diag__field">
              <label htmlFor="diag-email">E-mail <span className="bw-diag__optional">(opcional)</span></label>
              <input id="diag-email" type="email" placeholder="voce@email.com"
                className={touched.email && emailFilled && !emailOk ? "bad" : ""}
                value={f.email} onChange={(e) => set("email", e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                autoComplete="email" maxLength={255} />
              {touched.email && emailFilled && !emailOk && <span className="bw-diag__error">E-mail inválido.</span>}
            </div>
          </div>

          <div className="bw-diag__field">
            <label htmlFor="diag-local">Bairro do imóvel <span className="bw-diag__req">*</span></label>
            <input id="diag-local" type="text" placeholder="Ex: Pinheiros, Itaim, Butantã"
              className={touched.local && !localOk ? "bad" : ""}
              value={f.local} onChange={(e) => set("local", e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, local: true }))}
              maxLength={120} required />
            {touched.local && !localOk && <span className="bw-diag__error">Informe o bairro do imóvel.</span>}
          </div>

          <ChipsField label="Já tem as chaves do imóvel?" required options={CHAVES} value={f.chaves}
            onChange={(v) => { set("chaves", v); setTouched((t) => ({ ...t, chaves: true })); }}
            error={touched.chaves && !chavesOk ? "Selecione uma opção." : null} />

          <ChipsField label="Objetivo" required options={OBJETIVOS} value={f.objetivo}
            onChange={(v) => { set("objetivo", v); setTouched((t) => ({ ...t, objetivo: true })); }}
            error={touched.objetivo && !objetivoOk ? "Selecione o objetivo." : null} />

          <div className="bw-diag__field">
            <label htmlFor="diag-m2">Metragem (m²) <span className="bw-diag__optional">(opcional)</span></label>
            <input id="diag-m2" type="text" inputMode="numeric" placeholder="32"
              value={f.metragem}
              onChange={(e) => set("metragem", e.target.value.replace(/[^\d.,]/g, "").slice(0, 6))} />
          </div>

          <button type="button" className="bw-diag__more-toggle" aria-expanded={showMore} onClick={() => setShowMore((s) => !s)}>
            <IconPlus /> {showMore ? "Menos detalhes" : "Mais detalhes (opcional)"}
          </button>

          {showMore && (
            <div className="bw-diag__more">
              <ChipsField label="Tem planta do imóvel?" options={PLANTA} value={f.planta} onChange={(v) => set("planta", v)} />
              <div className="bw-diag__field">
                <label htmlFor="diag-msg">Mensagem</label>
                <textarea id="diag-msg" value={f.mensagem} onChange={(e) => set("mensagem", e.target.value)} maxLength={1000} />
              </div>
            </div>
          )}

          <button type="submit" className="bw-diag__submit" disabled={!canSubmit || submitting}>
            {submitting ? "Enviando…" : "Solicitar diagnóstico"}
            <IconArrow />
          </button>
          <p className="bw-diag__guarantee">Sem compromisso · a gente só te chama no WhatsApp</p>
        </>
      )}
    </form>
  );
}

function ChipsField({ label, options, value, onChange, required, error }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void; required?: boolean; error?: string | null;
}) {
  return (
    <fieldset className="bw-diag__field">
      <legend>{label} {required && <span className="bw-diag__req">*</span>}</legend>
      <div className="bw-diag__opts">
        {options.map((opt) => {
          const active = value === opt;
          return (
            <button key={opt} type="button" aria-pressed={active}
              onClick={() => onChange(active ? "" : opt)}
              className={`bw-diag__opt${active ? " sel" : ""}`}>
              {opt}
            </button>
          );
        })}
      </div>
      {error && <span className="bw-diag__error">{error}</span>}
    </fieldset>
  );
}

function TestimonialCard({ waUrl }: { waUrl: string }) {
  const [open, setOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  function handleOpen() {
    trackEvent("play_depoimento", { page: "diagnostico", cliente: "vivian" });
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => {
      closeBtnRef.current?.focus();
      videoRef.current?.play().catch(() => {});
    }, 0);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, [open]);

  return (
    <>
      <aside className="bw-diag__testicard" aria-label="Depoimento em vídeo de cliente">
        <i className="tk tl" /><i className="tk tr" /><i className="tk bl" /><i className="tk br" />
        <button type="button" className="bw-diag__testithumb" onClick={handleOpen} aria-label="Assistir depoimento em vídeo de Vivian">
          <video src={depoimentoVideo.url} muted playsInline preload="metadata" tabIndex={-1} aria-hidden="true" />
          <span className="bw-diag__testiplay" aria-hidden="true"><IconPlay /></span>
        </button>
        <div className="bw-diag__testimeta">
          <p className="bw-diag__testieyebrow">Depoimento</p>
          <p className="bw-diag__testiname">Vivian</p>
          <p className="bw-diag__testirole">cliente Bewild · depoimento presencial</p>
          <a href={waUrl} target="_blank" rel="noopener noreferrer" className="bw-diag__testilink">
            <IconChat /> Prefiro falar com um especialista
          </a>
        </div>
      </aside>

      {open && (
        <div className="bw-diag__modal" role="dialog" aria-modal="true" aria-label="Depoimento em vídeo de Vivian"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="bw-diag__modal-inner">
            <button ref={closeBtnRef} type="button" className="bw-diag__modal-close" onClick={() => setOpen(false)} aria-label="Fechar vídeo">
              <IconClose />
            </button>
            <video ref={videoRef} src={depoimentoVideo.url} controls playsInline autoPlay className="bw-diag__modal-video" />
          </div>
        </div>
      )}
    </>
  );
}

function SupportSections() {
  return (
    <>
      <section className="bw-diag__paper">
        <div className="bw-diag__psec">
          <div className="bw-diag__secmark"><span className="n">01</span><span className="t">Depois do envio</span><span className="ln" /></div>
          <div className="bw-diag__phead">
            <h2>O que acontece quando você <span className="accent">manda a ficha.</span></h2>
            <p className="lead">Nada de mistério nem de fila. O processo é direto, e você decide cada passo seguinte.</p>
          </div>
          <div className="bw-diag__steps">
            {PASSOS.map((p, i) => (
              <div className="bw-diag__step" key={p.t}>
                <div className="sn">0{i + 1}</div>
                <div className="st">{p.t}</div>
                <div className="sd">{p.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bw-diag__paper">
        <div className="bw-diag__psec">
          <div className="bw-diag__secmark"><span className="n">02</span><span className="t">Escopo turn-key</span><span className="ln" /></div>
          <div className="bw-diag__phead">
            <h2>Tudo num contrato só. Você <span className="accent">não toca em nada.</span></h2>
            <p className="lead">O diagnóstico é a porta de entrada pra um processo que entrega o studio pronto pra operar, do projeto à foto do anúncio.</p>
          </div>
          <div className="bw-diag__scope">
            {ESCOPO.map((s, i) => (
              <div className="bw-diag__scell" key={s.t}>
                <span className="sc-n">0{i + 1}</span>
                <div className="sc-t">{s.t}</div>
                <div className="sc-d">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bw-diag__paper">
        <div className="bw-diag__psec">
          <div className="bw-diag__secmark"><span className="n">03</span><span className="t">Por que a Bewild</span><span className="ln" /></div>
          <div className="bw-diag__phead">
            <h2>Já fizemos isso 150 vezes. <span className="accent">O seu é o próximo.</span></h2>
          </div>
          <div className="bw-diag__proof">
            {STATS.map((s) => (
              <div className="bw-diag__pstat" key={s.num + s.suf}>
                <b>{s.num}<em>{s.suf}</em></b>
                <span>{s.small}</span>
              </div>
            ))}
          </div>
          <p className="bw-diag__pfine">Referências sujeitas ao escopo · detalhes na proposta e no contrato</p>
        </div>
      </section>

      <DiagFaq />
    </>
  );
}

function DiagFaq() {
  const { items } = useFaq();
  if (items.length === 0) return null;
  return (
    <section className="bw-diag__paper" id="faq" aria-labelledby="bw-diag-faq-title">
      <div className="bw-diag__psec">
        <div className="bw-diag__secmark"><span className="n">04</span><span className="t">Perguntas</span><span className="ln" /></div>
        <div className="bw-diag__phead"><h2 id="bw-diag-faq-title">O que todo investidor <span className="accent">pergunta.</span></h2></div>
        <div className="bw-diag__faqlist" itemScope itemType="https://schema.org/FAQPage">
          {items.map((item) => (
            <details key={item.id} className="bw-diag__qi" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
              <summary className="bw-diag__qq">
                <span itemProp="name">{item.question}</span>
                <span className="pm" aria-hidden="true">＋</span>
              </summary>
              <div className="bw-diag__qa" itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                <span itemProp="text">{item.answer}</span>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaFinal({ waUrl, onForm }: { waUrl: string; onForm: () => void }) {
  return (
    <section className="bw-diag__ctafinal" aria-label="Solicitar diagnóstico">
      <div className="gridbg" aria-hidden="true" />
      <div className="inner">
        <p className="bw-diag__eyebrow center">Diagnóstico gratuito · sem compromisso</p>
        <h2>Pronto pra ver seu<br />studio <span className="accent">rendendo?</span></h2>
        <p className="ct-sub">Leva menos de dois minutos pra preencher a ficha. O resto do trabalho fica com a gente.</p>
        <div className="ct-act">
          <button type="button" className="bw-diag__btn cyan" onClick={onForm}>Preencher a ficha <IconArrowUp /></button>
          <a className="bw-diag__btn ghost" href={waUrl} target="_blank" rel="noopener noreferrer">Falar no WhatsApp</a>
        </div>
        <div className="ct-rea">Atendimento de gente real · retorno rápido · 150+ studios entregues</div>
      </div>
    </section>
  );
}
