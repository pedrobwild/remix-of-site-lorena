import { useMemo, useState } from "react";
import { useSeo, breadcrumbJsonLd, organizationJsonLd } from "../lib/useSeo";
import { useSiteSettings } from "../lib/useSiteSettings";
import BewildSiteNav from "@/components/BewildSiteNav";
import SiteFooter from "@/components/SiteFooter";
import { CONTACT } from "../components/landing/content";
import { supabase } from "@/integrations/supabase/client";
import "../styles/bw-diag.css";

/* ============================================================
 * DiagnosticoPage — /diagnostico
 * Visual Bewild v4 (anexo aprovado). CSS isolado .bw-diag.
 * ============================================================ */

const ENTREGAS = [
  "Projeto de arquitetura",
  "Obra",
  "Marcenaria",
  "Mobiliário e enxoval",
  "Portal de acompanhamento",
];

const PASSOS = [
  "Diagnóstico do imóvel",
  "Projeto de arquitetura personalizado",
  "Orçamento e escopo claros",
  "Obra com acompanhamento pelo portal",
  "Entrega pronta para operar",
];

const STATS: { num: string; suf: string; small: string }[] = [
  { num: "55", suf: "dias úteis", small: "referência de prazo de obra" },
  { num: "5", suf: "anos", small: "garantia de mão de obra" },
  { num: "10+", suf: "anos", small: "garantia em marcenaria selecionada" },
  { num: "100%", suf: "turn-key", small: "tudo em um processo único" },
];

const OBJETIVOS = ["Short stay", "Locação tradicional", "Uso misto", "Moradia", "Ainda avaliando"];
const CHAVES = ["Sim", "Ainda não", "Estou comprando"];
const PLANTA = ["Sim", "Não", "Não sei"];

/* ============= máscara WhatsApp ============= */
function maskPhone(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
const digits = (v: string) => v.replace(/\D/g, "");

type Form = {
  nome: string;
  whats: string;
  email: string;
  local: string;
  metragem: string;
  objetivo: string;
  chaves: string;
  planta: string;
  mensagem: string;
};

const EMPTY_FORM: Form = {
  nome: "",
  whats: "",
  email: "",
  local: "",
  metragem: "",
  objetivo: "",
  chaves: "",
  planta: "",
  mensagem: "",
};

/* ============= Ícones SVG ============= */
function IconChat({ className = "ic" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}
function IconArrow({ className = "arrow" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
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

  return (
    <>
      <BewildSiteNav />
      <main id="main" className="bw-diag">
        <section className="bw-diag__hero" aria-label="Solicitar diagnóstico">
          <div className="bw-diag__container">
            <div className="bw-diag__grid">
              <DiagnosticoPitch />
              <DiagnosticoForm />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function DiagnosticoPitch() {
  const waUrl = `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(
    "Olá, prefiro falar com um especialista sobre o diagnóstico."
  )}`;
  return (
    <div>
      <p className="bw-diag__eyebrow">Diagnóstico Bewild</p>
      <h1 className="bw-diag__title">
        Quer transformar seu studio em <span className="accent">um ativo pronto para operar?</span>
      </h1>
      <p className="bw-diag__sub">
        Envie os dados do seu imóvel e receba uma análise inicial de escopo, projeto e próximos passos.
      </p>
      <p className="bw-diag__note">
        Sem compromisso. A análise inicial ajuda a entender escopo, prioridades e viabilidade antes
        de avançar para orçamento.
      </p>

      <p className="bw-diag__blocklabel">O que entregamos</p>
      <ul className="bw-diag__pills">
        {ENTREGAS.map((p) => (
          <li key={p} className="bw-diag__pill">
            {p}
          </li>
        ))}
      </ul>

      <p className="bw-diag__blocklabel">Como funciona, em 5 passos</p>
      <ol className="bw-diag__steps">
        {PASSOS.map((p, i) => (
          <li key={p} className="bw-diag__step">
            <span className="n">0{i + 1}</span>
            <span className="tx">{p}</span>
          </li>
        ))}
      </ol>

      <div className="bw-diag__stats">
        {STATS.map((s) => (
          <div key={s.num + s.suf} className="bw-diag__stat">
            <b>
              {s.num}
              <em>{s.suf}</em>
            </b>
            <span>{s.small}</span>
          </div>
        ))}
      </div>
      <p className="bw-diag__fine">
        Referências sujeitas ao escopo · Detalhes na proposta e no contrato
      </p>

      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="bw-diag__alt"
      >
        <IconChat /> Prefiro falar com um especialista
      </a>
    </div>
  );
}

function DiagnosticoForm() {
  const [f, setF] = useState<Form>(EMPTY_FORM);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));

  const nomeOk = f.nome.trim().length >= 2;
  const whatsOk = digits(f.whats).length >= 10;
  const canSubmit = nomeOk && whatsOk;

  const messageText = useMemo(() => {
    const lines: string[] = ["Olá! Quero um diagnóstico do meu studio."];
    const add = (label: string, val: string) => {
      const v = val.trim();
      if (v) lines.push(`${label}: ${v}`);
    };
    add("Nome", f.nome);
    add("WhatsApp", f.whats);
    add("E-mail", f.email);
    add("Local", f.local);
    add("Metragem (m²)", f.metragem);
    add("Objetivo", f.objetivo);
    add("Chaves", f.chaves);
    add("Planta", f.planta);
    add("Mensagem", f.mensagem);
    return lines.join("\n");
  }, [f]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting) {
      setTouched({ nome: true, whats: true });
      return;
    }
    setSubmitting(true);

    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const scope: string[] = [];
    if (f.objetivo) scope.push(`objetivo:${f.objetivo}`);
    if (f.chaves) scope.push(`chaves:${f.chaves}`);
    if (f.planta) scope.push(`planta:${f.planta}`);

    try {
      const areaDigits = f.metragem ? digits(f.metragem) : "";
      const areaNum = areaDigits ? Number(areaDigits) : null;
      const { error } = await supabase.from("leads").insert({
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
      });
      if (error) throw error;
    } catch (err) {
      console.error("[leads] insert failed", err);
    }
    // unused; kept to avoid breaking previous closure scope
    void scope;

    const url = `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(messageText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setSuccess(true);
    setSubmitting(false);
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="bw-diag__formcard"
      aria-label="Formulário de diagnóstico"
    >
      {success && (
        <div className="bw-diag__success" role="status">
          Recebemos seus dados. Continue a conversa no WhatsApp que abrimos em outra aba.
        </div>
      )}

      <div className="bw-diag__field">
        <label htmlFor="diag-nome">
          Nome <span className="bw-diag__req">*</span>
        </label>
        <input
          id="diag-nome"
          type="text"
          className={touched.nome && !nomeOk ? "bad" : ""}
          value={f.nome}
          onChange={(e) => set("nome", e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, nome: true }))}
          autoComplete="name"
          required
          maxLength={120}
        />
        {touched.nome && !nomeOk && <span className="bw-diag__error">Informe seu nome.</span>}
      </div>

      <div className="bw-diag__frow">
        <div className="bw-diag__field">
          <label htmlFor="diag-whats">
            WhatsApp <span className="bw-diag__req">*</span>
          </label>
          <input
            id="diag-whats"
            type="tel"
            inputMode="tel"
            placeholder="(11) 99999-9999"
            className={touched.whats && !whatsOk ? "bad" : ""}
            value={f.whats}
            onChange={(e) => set("whats", maskPhone(e.target.value))}
            onBlur={() => setTouched((t) => ({ ...t, whats: true }))}
            autoComplete="tel"
            required
          />
          {touched.whats && !whatsOk && (
            <span className="bw-diag__error">Informe um WhatsApp válido com DDD.</span>
          )}
        </div>
        <div className="bw-diag__field">
          <label htmlFor="diag-email">E-mail</label>
          <input
            id="diag-email"
            type="email"
            placeholder="voce@email.com"
            value={f.email}
            onChange={(e) => set("email", e.target.value)}
            autoComplete="email"
            maxLength={255}
          />
        </div>
      </div>

      <div className="bw-diag__frow">
        <div className="bw-diag__field">
          <label htmlFor="diag-local">Localização do imóvel</label>
          <input
            id="diag-local"
            type="text"
            placeholder="Bairro, cidade"
            value={f.local}
            onChange={(e) => set("local", e.target.value)}
            maxLength={120}
          />
        </div>
        <div className="bw-diag__field">
          <label htmlFor="diag-m2">Metragem (m²)</label>
          <input
            id="diag-m2"
            type="text"
            inputMode="numeric"
            placeholder="32"
            value={f.metragem}
            onChange={(e) => set("metragem", e.target.value.replace(/[^\d.,]/g, "").slice(0, 6))}
          />
        </div>
      </div>

      <ChipsField label="Objetivo" options={OBJETIVOS} value={f.objetivo} onChange={(v) => set("objetivo", v)} />
      <ChipsField label="Já recebeu as chaves?" options={CHAVES} value={f.chaves} onChange={(v) => set("chaves", v)} />
      <ChipsField label="Tem planta do imóvel?" options={PLANTA} value={f.planta} onChange={(v) => set("planta", v)} />

      <div className="bw-diag__field">
        <label htmlFor="diag-msg">Mensagem</label>
        <textarea
          id="diag-msg"
          value={f.mensagem}
          onChange={(e) => set("mensagem", e.target.value)}
          maxLength={1000}
        />
      </div>

      <button type="submit" className="bw-diag__submit" disabled={!canSubmit || submitting}>
        {submitting ? "Enviando…" : "Solicitar diagnóstico"}
        <IconArrow />
      </button>
      <p className="bw-diag__formfine">
        Ao enviar, abrimos uma conversa no WhatsApp com seus dados preenchidos.
      </p>
    </form>
  );
}

function ChipsField({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <fieldset className="bw-diag__field">
      <legend>{label}</legend>
      <div className="bw-diag__opts">
        {options.map((opt) => {
          const active = value === opt;
          return (
            <button
              key={opt}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(active ? "" : opt)}
              className={`bw-diag__opt${active ? " sel" : ""}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
