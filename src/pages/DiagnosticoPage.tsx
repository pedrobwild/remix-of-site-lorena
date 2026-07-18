import { useEffect, useMemo, useRef, useState } from "react";
import { useSeo, breadcrumbJsonLd, organizationJsonLd } from "../lib/useSeo";
import { useSiteSettings } from "../lib/useSiteSettings";
import BwaSharedChrome from "@/components/BwaSharedChrome";
import { useFaq } from "@/lib/useFaq";
import { CONTACT } from "../components/landing/content";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/ga4";
import depoimentoVideo from "@/assets/testimonials/depoimento-cliente.mp4.asset.json";

/* ============================================================
 * DiagnosticoPage — /diagnostico redesenhada no sistema .bwa.
 * Camada visual: BwaSharedChrome (nav + footer + home-bwa.css +
 * bwa-internal.css). Copy e lógica do formulário PRESERVADAS
 * byte a byte (names/ids/types, validação, notify-lead, GA4,
 * WhatsApp) — apenas a apresentação muda.
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

export default function DiagnosticoPage() {
  const { settings } = useSiteSettings();

  useSeo({
    title: "Diagnóstico | Bewild",
    description:
      "Envie os dados do seu studio e receba a análise inicial de escopo, projeto e próximos passos para a reforma turn-key com a Bewild.",
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
    <BwaSharedChrome>
      {/* Hero + formulário */}
      <section className="bwa-section" aria-label="Solicitar diagnóstico">
        <div className="bwa-shell">
          <div className="bwa-diag-grid">
            <div className="bwa-diag-left">
              <p className="bwa-label">001 · Diagnóstico · sem compromisso</p>
              <h1 className="bwa-title">
                Seu studio pronto pra render começa aqui.
              </h1>
              <p className="bwa-lead">
                Você manda os dados do imóvel. A gente devolve uma leitura do potencial de renda, do escopo da reforma e dos próximos passos. Sem custo e sem compromisso.
              </p>

              <div className="bwa-diag-recebe">
                <p className="bwa-label">O que você recebe</p>
                <ol>
                  {RECEBE.map((r, i) => (
                    <li key={r.t}>
                      <span className="bwa-mono">0{i + 1}</span>
                      <span><strong>{r.t}</strong>{r.rest}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <p className="bwa-diag-trust bwa-mono">
                +150 studios entregues em São Paulo
              </p>

              <TestimonialCard waUrl={waUrl} />
            </div>

            <div className="bwa-diag-right">
              <DiagnosticoForm />
            </div>
          </div>
        </div>
      </section>

      {/* Depois do envio */}
      <section className="bwa-section">
        <div className="bwa-shell">
          <p className="bwa-label">002 · Depois do envio</p>
          <h2 className="bwa-title">O que acontece quando você manda a ficha.</h2>
          <p className="bwa-lead">Nada de mistério nem de fila. O processo é direto, e você decide cada passo seguinte.</p>
          <div className="bwa-diag-steps">
            {PASSOS.map((p, i) => (
              <div className="bwa-diag-cell" key={p.t}>
                <span className="bwa-mono">0{i + 1}</span>
                <h3>{p.t}</h3>
                <p>{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Escopo turn-key */}
      <section className="bwa-section">
        <div className="bwa-shell">
          <p className="bwa-label">003 · Escopo turn-key</p>
          <h2 className="bwa-title">Tudo num contrato só. Você não toca em nada.</h2>
          <p className="bwa-lead">O diagnóstico é a porta de entrada pra um processo que entrega o studio pronto pra operar, do projeto à foto do anúncio.</p>
          <div className="bwa-diag-steps">
            {ESCOPO.map((s, i) => (
              <div className="bwa-diag-cell" key={s.t}>
                <span className="bwa-mono">0{i + 1}</span>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Prova numérica */}
      <section className="bwa-section">
        <div className="bwa-shell">
          <p className="bwa-label">004 · Por que a Bewild</p>
          <h2 className="bwa-title">Já fizemos isso 150 vezes. O seu é o próximo.</h2>
          <div className="bwa-diag-stats">
            {STATS.map((s) => (
              <div className="bwa-diag-stat" key={s.num + s.suf}>
                <b>{s.num}<em>{s.suf}</em></b>
                <span>{s.small}</span>
              </div>
            ))}
          </div>
          <p className="bwa-diag-fine bwa-mono">Referências sujeitas ao escopo · detalhes na proposta e no contrato</p>
        </div>
      </section>

      <DiagFaq />

      {/* CTA final */}
      <section className="bwa-section bwa-diag-cta" aria-label="Solicitar diagnóstico">
        <div className="bwa-shell" style={{ maxWidth: 900, textAlign: "center" }}>
          <p className="bwa-label">Diagnóstico gratuito · sem compromisso</p>
          <h2 className="bwa-title">Pronto pra ver seu studio rendendo?</h2>
          <p className="bwa-lead">Leva menos de dois minutos pra preencher a ficha. O resto do trabalho fica com a gente.</p>
          <div className="bwa-diag-cta-actions">
            <button type="button" className="bwa-button" onClick={scrollToForm}>
              Preencher a ficha <span aria-hidden="true">↑</span>
            </button>
            <a className="bwa-text-link" href={waUrl} target="_blank" rel="noopener noreferrer">
              Falar no WhatsApp <span aria-hidden="true">→</span>
            </a>
          </div>
          <p className="bwa-mono bwa-diag-cta-note">Atendimento de gente real · retorno rápido · 150+ studios entregues</p>
        </div>
      </section>
    </BwaSharedChrome>
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
    <form
      onSubmit={onSubmit}
      noValidate
      className="bwa-form"
      id="diag-formcard"
      aria-label="Formulário de diagnóstico"
    >
      <div className="bwa-form-head">
        <span className="bwa-label">Ficha do seu studio</span>
        <span className="bwa-mono">BW—002</span>
      </div>

      {success && (
        <div className="bwa-form-success" role="status">
          <strong>Recebemos seus dados.</strong>
          <span>Nosso time comercial vai falar com você no WhatsApp.</span>
        </div>
      )}

      {!success && (
        <>
          <div className="bwa-form-field">
            <label htmlFor="diag-nome">Nome <span className="bwa-form-req">*</span></label>
            <input
              id="diag-nome" name="nome" type="text" placeholder="Como podemos te chamar"
              className={touched.nome && !nomeOk ? "bad" : ""}
              value={f.nome} onChange={(e) => set("nome", e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, nome: true }))}
              autoComplete="name" required maxLength={120}
            />
            {touched.nome && !nomeOk && <span className="bwa-form-error">Informe seu nome.</span>}
          </div>

          <div className="bwa-form-row">
            <div className="bwa-form-field">
              <label htmlFor="diag-whats">WhatsApp <span className="bwa-form-req">*</span></label>
              <input
                id="diag-whats" name="whats" type="tel" inputMode="tel" placeholder="(11) 99999-9999"
                className={touched.whats && !whatsOk ? "bad" : ""}
                value={f.whats} onChange={(e) => set("whats", maskPhone(e.target.value))}
                onBlur={() => setTouched((t) => ({ ...t, whats: true }))}
                autoComplete="tel" required
              />
              {touched.whats && !whatsOk && <span className="bwa-form-error">Informe um WhatsApp com DDD.</span>}
            </div>
            <div className="bwa-form-field">
              <label htmlFor="diag-email">E-mail <span className="bwa-form-opt">(opcional)</span></label>
              <input
                id="diag-email" name="email" type="email" placeholder="voce@email.com"
                className={touched.email && emailFilled && !emailOk ? "bad" : ""}
                value={f.email} onChange={(e) => set("email", e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                autoComplete="email" maxLength={255}
              />
              {touched.email && emailFilled && !emailOk && <span className="bwa-form-error">E-mail inválido.</span>}
            </div>
          </div>

          <div className="bwa-form-field">
            <label htmlFor="diag-local">Bairro do imóvel <span className="bwa-form-req">*</span></label>
            <input
              id="diag-local" name="local" type="text" placeholder="Ex: Pinheiros, Itaim, Butantã"
              className={touched.local && !localOk ? "bad" : ""}
              value={f.local} onChange={(e) => set("local", e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, local: true }))}
              maxLength={120} required
            />
            {touched.local && !localOk && <span className="bwa-form-error">Informe o bairro do imóvel.</span>}
          </div>

          <ChipsField
            label="Já tem as chaves do imóvel?" required options={CHAVES} value={f.chaves}
            onChange={(v) => { set("chaves", v); setTouched((t) => ({ ...t, chaves: true })); }}
            error={touched.chaves && !chavesOk ? "Selecione uma opção." : null}
          />

          <ChipsField
            label="Objetivo" required options={OBJETIVOS} value={f.objetivo}
            onChange={(v) => { set("objetivo", v); setTouched((t) => ({ ...t, objetivo: true })); }}
            error={touched.objetivo && !objetivoOk ? "Selecione o objetivo." : null}
          />

          <div className="bwa-form-field">
            <label htmlFor="diag-m2">Metragem (m²) <span className="bwa-form-opt">(opcional)</span></label>
            <input
              id="diag-m2" name="metragem" type="text" inputMode="numeric" placeholder="32"
              value={f.metragem}
              onChange={(e) => set("metragem", e.target.value.replace(/[^\d.,]/g, "").slice(0, 6))}
            />
          </div>

          <button
            type="button"
            className="bwa-text-link"
            aria-expanded={showMore}
            onClick={() => setShowMore((s) => !s)}
            style={{ justifySelf: "start" }}
          >
            {showMore ? "− Menos detalhes" : "+ Mais detalhes (opcional)"}
          </button>

          {showMore && (
            <>
              <ChipsField label="Tem planta do imóvel?" options={PLANTA} value={f.planta} onChange={(v) => set("planta", v)} />
              <div className="bwa-form-field">
                <label htmlFor="diag-msg">Mensagem</label>
                <textarea id="diag-msg" name="mensagem" value={f.mensagem} onChange={(e) => set("mensagem", e.target.value)} maxLength={1000} />
              </div>
            </>
          )}

          <button type="submit" className="bwa-button" disabled={!canSubmit || submitting}>
            {submitting ? "Enviando…" : "Solicitar diagnóstico"}
            <span aria-hidden="true">→</span>
          </button>
          <p className="bwa-mono bwa-diag-guarantee">Sem compromisso · a gente só te chama no WhatsApp</p>
        </>
      )}
    </form>
  );
}

function ChipsField({ label, options, value, onChange, required, error }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void; required?: boolean; error?: string | null;
}) {
  return (
    <fieldset className="bwa-form-field">
      <legend>{label} {required && <span className="bwa-form-req">*</span>}</legend>
      <div className="bwa-chip-row">
        {options.map((opt) => {
          const active = value === opt;
          return (
            <button
              key={opt} type="button" aria-pressed={active}
              onClick={() => onChange(active ? "" : opt)}
              className={`bwa-chip${active ? " sel" : ""}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {error && <span className="bwa-form-error">{error}</span>}
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
      <aside className="bwa-diag-testi" aria-label="Depoimento em vídeo de cliente">
        <button
          type="button" className="bwa-diag-testithumb"
          onClick={handleOpen}
          aria-label="Assistir depoimento em vídeo de Vivian"
        >
          <video src={depoimentoVideo.url} muted playsInline preload="metadata" tabIndex={-1} aria-hidden="true" />
          <span className="bwa-diag-testiplay" aria-hidden="true">▶</span>
        </button>
        <div className="bwa-diag-testimeta">
          <p className="bwa-mono">Depoimento</p>
          <p className="bwa-diag-testiname">Vivian</p>
          <p className="bwa-diag-testirole">cliente Bewild · depoimento presencial</p>
          <a href={waUrl} target="_blank" rel="noopener noreferrer" className="bwa-text-link">
            Prefiro falar com um especialista →
          </a>
        </div>
      </aside>

      {open && (
        <div
          className="bwa-diag-modal" role="dialog" aria-modal="true" aria-label="Depoimento em vídeo de Vivian"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="bwa-diag-modal-inner">
            <button
              ref={closeBtnRef} type="button"
              className="bwa-diag-modal-close" onClick={() => setOpen(false)} aria-label="Fechar vídeo"
            >
              ✕
            </button>
            <video ref={videoRef} src={depoimentoVideo.url} controls playsInline autoPlay className="bwa-diag-modal-video" />
          </div>
        </div>
      )}
    </>
  );
}

function DiagFaq() {
  const { items } = useFaq();
  if (items.length === 0) return null;
  return (
    <section className="bwa-section" id="faq" aria-labelledby="bw-diag-faq-title">
      <div className="bwa-shell" style={{ maxWidth: 960 }}>
        <p className="bwa-label">005 · Perguntas</p>
        <h2 id="bw-diag-faq-title" className="bwa-title">O que todo investidor pergunta.</h2>
        <div className="bwa-diag-faq" itemScope itemType="https://schema.org/FAQPage">
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
