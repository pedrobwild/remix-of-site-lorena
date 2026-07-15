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
import "@/styles/bwh-tokens.css";
import "../styles/bw-diag.css";
import "@/styles/bwh-sol-fusion.css";

/* ============================================================
 * DiagnosticoPage — /diagnostico · DS bwh (claro editorial).
 * Mecânica preservada: lead -> notify-lead (Supabase) + WhatsApp + GA4.
 * CSS isolado em classes bwd-*.
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
      <main id="main" className="bwh bwd">
        <section className="bwd-hero" aria-label="Solicitar diagnóstico">
          <div className="bwh-wrap">
            <div className="bwd-grid">
              <div className="bwd-left">
                <DiagnosticoPitch />
                <TestimonialCard waUrl={waUrl} />
              </div>
              <DiagnosticoForm />
            </div>
          </div>
        </section>

        <SupportSections />
        <CtaFinal waUrl={waUrl} onForm={scrollToForm} />
      </main>
      <StickyMobileCTA
        href={waUrl}
        label="Solicitar diagnóstico"
        hideWhenVisibleSelector="footer, .bwd-form"
      />
      <SiteFooter />
    </>
  );
}

function DiagnosticoPitch() {
  return (
    <div className="bwd-pitch">
      <p className="bwh-mono bwd-eyebrow">Diagnóstico · sem compromisso</p>
      <h1 className="bwd-title">
        Seu studio pronto pra <em>render</em> começa aqui.
      </h1>
      <p className="bwd-sub">
        Você manda os dados do imóvel. A gente devolve uma leitura do potencial de renda, do escopo da reforma e dos próximos passos. Sem custo e sem compromisso.
      </p>
      <div className="bwd-recebe">
        <div className="bwh-mono bwd-rlabel">O que você recebe</div>
        {RECEBE.map((r, i) => (
          <div className="bwd-ritem" key={r.t}>
            <span className="rn">0{i + 1}</span>
            <span className="rt"><b>{r.t}</b>{r.rest}</span>
          </div>
        ))}
      </div>
      <div className="bwd-trust" role="note">
        <span className="bwd-trust-ic" aria-hidden="true"><IconCheck /></span>
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
    <form onSubmit={onSubmit} noValidate className="bwd-form" id="diag-formcard" aria-label="Formulário de diagnóstico">
      <div className="bwd-fhead">
        <span className="fl">Ficha do seu studio</span>
        <span className="fr">BW—002</span>
      </div>

      {success && (
        <div className="bwd-success" role="status">
          <strong>Recebemos seus dados.</strong>
          <span>Nosso time comercial vai falar com você no WhatsApp.</span>
        </div>
      )}

      {!success && (
        <>
          <div className="bwd-field">
            <label htmlFor="diag-nome">Nome <span className="bwd-req">*</span></label>
            <input id="diag-nome" type="text" placeholder="Como podemos te chamar"
              className={touched.nome && !nomeOk ? "bad" : ""}
              value={f.nome} onChange={(e) => set("nome", e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, nome: true }))}
              autoComplete="name" required maxLength={120} />
            {touched.nome && !nomeOk && <span className="bwd-error">Informe seu nome.</span>}
          </div>

          <div className="bwd-frow">
            <div className="bwd-field">
              <label htmlFor="diag-whats">WhatsApp <span className="bwd-req">*</span></label>
              <input id="diag-whats" type="tel" inputMode="tel" placeholder="(11) 99999-9999"
                className={touched.whats && !whatsOk ? "bad" : ""}
                value={f.whats} onChange={(e) => set("whats", maskPhone(e.target.value))}
                onBlur={() => setTouched((t) => ({ ...t, whats: true }))}
                autoComplete="tel" required />
              {touched.whats && !whatsOk && <span className="bwd-error">Informe um WhatsApp com DDD.</span>}
            </div>
            <div className="bwd-field">
              <label htmlFor="diag-email">E-mail <span className="bwd-opt">(opcional)</span></label>
              <input id="diag-email" type="email" placeholder="voce@email.com"
                className={touched.email && emailFilled && !emailOk ? "bad" : ""}
                value={f.email} onChange={(e) => set("email", e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                autoComplete="email" maxLength={255} />
              {touched.email && emailFilled && !emailOk && <span className="bwd-error">E-mail inválido.</span>}
            </div>
          </div>

          <div className="bwd-field">
            <label htmlFor="diag-local">Bairro do imóvel <span className="bwd-req">*</span></label>
            <input id="diag-local" type="text" placeholder="Ex: Pinheiros, Itaim, Butantã"
              className={touched.local && !localOk ? "bad" : ""}
              value={f.local} onChange={(e) => set("local", e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, local: true }))}
              maxLength={120} required />
            {touched.local && !localOk && <span className="bwd-error">Informe o bairro do imóvel.</span>}
          </div>

          <ChipsField label="Já tem as chaves do imóvel?" required options={CHAVES} value={f.chaves}
            onChange={(v) => { set("chaves", v); setTouched((t) => ({ ...t, chaves: true })); }}
            error={touched.chaves && !chavesOk ? "Selecione uma opção." : null} />

          <ChipsField label="Objetivo" required options={OBJETIVOS} value={f.objetivo}
            onChange={(v) => { set("objetivo", v); setTouched((t) => ({ ...t, objetivo: true })); }}
            error={touched.objetivo && !objetivoOk ? "Selecione o objetivo." : null} />

          <div className="bwd-field">
            <label htmlFor="diag-m2">Metragem (m²) <span className="bwd-opt">(opcional)</span></label>
            <input id="diag-m2" type="text" inputMode="numeric" placeholder="32"
              value={f.metragem}
              onChange={(e) => set("metragem", e.target.value.replace(/[^\d.,]/g, "").slice(0, 6))} />
          </div>

          <button type="button" className="bwd-more-toggle" aria-expanded={showMore} onClick={() => setShowMore((s) => !s)}>
            <IconPlus /> {showMore ? "Menos detalhes" : "Mais detalhes (opcional)"}
          </button>

          {showMore && (
            <div className="bwd-more">
              <ChipsField label="Tem planta do imóvel?" options={PLANTA} value={f.planta} onChange={(v) => set("planta", v)} />
              <div className="bwd-field">
                <label htmlFor="diag-msg">Mensagem</label>
                <textarea id="diag-msg" value={f.mensagem} onChange={(e) => set("mensagem", e.target.value)} maxLength={1000} />
              </div>
            </div>
          )}

          <button type="submit" className="bwd-submit" disabled={!canSubmit || submitting}>
            {submitting ? "Enviando…" : "Solicitar diagnóstico"}
            <IconArrow />
          </button>
          <p className="bwd-guarantee">Sem compromisso · a gente só te chama no WhatsApp</p>
        </>
      )}
    </form>
  );
}

function ChipsField({ label, options, value, onChange, required, error }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void; required?: boolean; error?: string | null;
}) {
  return (
    <fieldset className="bwd-field">
      <legend>{label} {required && <span className="bwd-req">*</span>}</legend>
      <div className="bwd-opts">
        {options.map((opt) => {
          const active = value === opt;
          return (
            <button key={opt} type="button" aria-pressed={active}
              onClick={() => onChange(active ? "" : opt)}
              className={`bwd-chip${active ? " sel" : ""}`}>
              {opt}
            </button>
          );
        })}
      </div>
      {error && <span className="bwd-error">{error}</span>}
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
      <aside className="bwd-testi" aria-label="Depoimento em vídeo de cliente">
        <button type="button" className="bwd-testithumb" onClick={handleOpen} aria-label="Assistir depoimento em vídeo de Vivian">
          <video src={depoimentoVideo.url} muted playsInline preload="metadata" tabIndex={-1} aria-hidden="true" />
          <span className="bwd-testiplay" aria-hidden="true"><IconPlay /></span>
        </button>
        <div className="bwd-testimeta">
          <p className="bwh-mono bwd-testieyb">Depoimento</p>
          <p className="bwd-testiname">Vivian</p>
          <p className="bwd-testirole">cliente Bewild · depoimento presencial</p>
          <a href={waUrl} target="_blank" rel="noopener noreferrer" className="bwd-testilink">
            <IconChat /> Prefiro falar com um especialista
          </a>
        </div>
      </aside>

      {open && (
        <div className="bwd-modal" role="dialog" aria-modal="true" aria-label="Depoimento em vídeo de Vivian"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="bwd-modal-inner">
            <button ref={closeBtnRef} type="button" className="bwd-modal-close" onClick={() => setOpen(false)} aria-label="Fechar vídeo">
              <IconClose />
            </button>
            <video ref={videoRef} src={depoimentoVideo.url} controls playsInline autoPlay className="bwd-modal-video" />
          </div>
        </div>
      )}
    </>
  );
}

function SupportSections() {
  return (
    <>
      <section className="bwh-sec" style={{ paddingBottom: 0 }}>
        <div className="bwh-wrap">
          <div className="bwh-srlabel"><span className="bwh-mono">Depois do envio · 01</span></div>
          <h2 className="bwh-h2">O que acontece quando você <em>manda a ficha.</em></h2>
          <p className="bwd-lead">Nada de mistério nem de fila. O processo é direto, e você decide cada passo seguinte.</p>
          <div className="bwd-steps">
            {PASSOS.map((p, i) => (
              <div className="bwd-cell" key={p.t}>
                <span className="cn">0{i + 1}</span>
                <div className="ct">{p.t}</div>
                <div className="cd">{p.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bwh-sec" style={{ paddingBottom: 0 }}>
        <div className="bwh-wrap">
          <div className="bwh-srlabel"><span className="bwh-mono">Escopo turn-key · 02</span></div>
          <h2 className="bwh-h2">Tudo num contrato só. Você <em>não toca em nada.</em></h2>
          <p className="bwd-lead">O diagnóstico é a porta de entrada pra um processo que entrega o studio pronto pra operar, do projeto à foto do anúncio.</p>
          <div className="bwd-scope">
            {ESCOPO.map((s, i) => (
              <div className="bwd-cell" key={s.t}>
                <span className="cn">0{i + 1}</span>
                <div className="ct">{s.t}</div>
                <div className="cd">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bwh-sec" style={{ paddingBottom: 0 }}>
        <div className="bwh-wrap">
          <div className="bwh-srlabel"><span className="bwh-mono">Por que a Bewild · 03</span></div>
          <h2 className="bwh-h2">Já fizemos isso 150 vezes. <em>O seu é o próximo.</em></h2>
          <div className="bwd-stats">
            {STATS.map((s) => (
              <div className="bwd-stat" key={s.num + s.suf}>
                <b>{s.num}<em>{s.suf}</em></b>
                <span>{s.small}</span>
              </div>
            ))}
          </div>
          <p className="bwd-fine bwh-mono">Referências sujeitas ao escopo · detalhes na proposta e no contrato</p>
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
    <section className="bwh-sec" id="faq" aria-labelledby="bw-diag-faq-title">
      <div className="bwh-wrap" style={{ maxWidth: 960 }}>
        <div className="bwh-srlabel"><span className="bwh-mono">Perguntas · 04</span></div>
        <h2 id="bw-diag-faq-title" className="bwh-h2">O que todo investidor <em>pergunta.</em></h2>
        <div className="bwh-faq" itemScope itemType="https://schema.org/FAQPage">
          {items.map((item) => (
            <details key={item.id} itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
              <summary itemProp="name">{item.question}</summary>
              <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                <p itemProp="text">{item.answer}</p>
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
    <section className="bwh-sec bwh-sec--dark" aria-label="Solicitar diagnóstico">
      <div className="bwh-wrap" style={{ maxWidth: 900, textAlign: "center" }}>
        <p className="bwh-mono" style={{ color: "var(--dink2)", margin: "0 0 24px" }}>Diagnóstico gratuito · sem compromisso</p>
        <h2 className="bwh-h2" style={{ margin: "0 auto 24px", color: "#fff" }}>Pronto pra ver seu<br />studio <em>rendendo?</em></h2>
        <p style={{ color: "var(--dink2)", fontSize: "clamp(16px,1.5vw,19px)", lineHeight: 1.55, maxWidth: 560, margin: "0 auto 32px" }}>Leva menos de dois minutos pra preencher a ficha. O resto do trabalho fica com a gente.</p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <button type="button" className="bwh-btn bwh-btn--invert" onClick={onForm}>Preencher a ficha <IconArrowUp /></button>
          <a className="bwh-btn bwh-btn--ghostdark" href={waUrl} target="_blank" rel="noopener noreferrer">Falar no WhatsApp <span className="bwh-ar">→</span></a>
        </div>
        <p className="bwh-mono" style={{ color: "var(--dink2)", marginTop: 24 }}>Atendimento de gente real · retorno rápido · 150+ studios entregues</p>
      </div>
    </section>
  );
}
