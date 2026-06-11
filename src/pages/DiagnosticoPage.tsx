import { useMemo, useState } from "react";
import { ArrowRight, MessageCircle } from "lucide-react";
import { useSeo, breadcrumbJsonLd, organizationJsonLd } from "../lib/useSeo";
import { useSiteSettings } from "../lib/useSiteSettings";
import Header from "../components/landing/Header";
import Footer from "../components/landing/Footer";
import { Container, CTAButton } from "../components/landing/primitives";
import { CONTACT } from "../components/landing/content";

/* ============================================================
 * DiagnosticoPage — /diagnostico
 * Página única de conversão. Sem FloatingCTA.
 * Porte fiel do código de referência aprovado.
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

const STATS = [
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

export default function DiagnosticoPage() {
  const { settings } = useSiteSettings();

  useSeo({
    title: "Diagnóstico — BeWild · Análise inicial do seu studio",
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
      <Header />
      <main id="main" className="bg-bewild-ink text-white">
        <DiagnosticoSection />
      </main>
      <Footer />
      {/* FloatingCTA propositalmente ausente nesta página */}
    </>
  );
}

function DiagnosticoSection() {
  return (
    <section
      aria-label="Solicitar diagnóstico"
      className="relative flex min-h-screen items-center overflow-hidden pb-16 pt-32 sm:pt-36"
    >
      {/* Foto de fundo + overlays */}
      <div className="absolute inset-0" aria-hidden="true">
        <img
          src="/images/cases/studio-compacto-pronto-01.jpg"
          alt=""
          className="h-full w-full object-cover"
          onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(7,22,38,0.95) 0%, rgba(10,37,64,0.6) 55%, rgba(10,37,64,0.5) 100%), linear-gradient(100deg, rgba(10,37,64,0.55) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute inset-0 mix-blend-overlay opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "3px 3px",
          }}
        />
      </div>

      <Container className="relative z-[2]">
        <div className="grid gap-x-16 gap-y-9 lg:grid-cols-[1fr_480px] lg:items-start">
          <DiagnosticoHead />
          <DiagnosticoForm />
          <DiagnosticoAside />
        </div>
      </Container>
    </section>
  );
}

/* ====================== HEAD ====================== */
function DiagnosticoHead() {
  return (
    <header className="lg:[grid-area:1/1/2/2]">
      <p className="font-mono text-[0.66rem] uppercase tracking-[0.28em] text-[#DCBE7A]">
        Diagnóstico BeWild
      </p>
      <h1 className="mt-4 max-w-[14em] font-display text-[clamp(2rem,3.8vw,3rem)] font-semibold leading-[1.12] tracking-tight text-white drop-shadow-[0_2px_30px_rgba(4,14,25,0.4)]">
        Quer transformar seu studio em
        <br />
        <span className="italic text-[#DCBE7A]">um ativo pronto para operar?</span>
      </h1>
      <p className="mt-4 max-w-[32rem] text-[0.98rem] leading-relaxed text-white/85">
        Envie os dados do seu imóvel e receba uma análise inicial de escopo, projeto e próximos
        passos.
      </p>
      <p className="mt-4 max-w-[34rem] font-mono text-[0.58rem] uppercase leading-[1.9] tracking-[0.2em] text-white/55">
        Sem compromisso. A análise inicial ajuda a entender escopo, prioridades e viabilidade antes
        de avançar para orçamento.
      </p>
    </header>
  );
}

/* ====================== ASIDE (resumo BeWild) ====================== */
function DiagnosticoAside() {
  return (
    <aside className="lg:[grid-area:2/1/3/2]">
      <section>
        <span className="block font-mono text-[0.56rem] uppercase tracking-[0.24em] text-[#DCBE7A]">
          O que entregamos
        </span>
        <div className="mt-3 flex flex-wrap gap-[0.45rem]">
          {ENTREGAS.map((p) => (
            <span
              key={p}
              className="rounded-full border border-white/20 bg-bewild-ink/40 px-[0.85rem] py-[0.38rem] text-[0.78rem] text-white/90 backdrop-blur"
            >
              {p}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-7">
        <span className="block font-mono text-[0.56rem] uppercase tracking-[0.24em] text-[#DCBE7A]">
          Como funciona, em 5 passos
        </span>
        <ol className="mt-3">
          {PASSOS.map((p, i) => (
            <li
              key={p}
              className="flex items-baseline gap-[0.9rem] border-b border-white/10 py-[0.5rem] last:border-0"
            >
              <span className="shrink-0 font-mono text-[0.6rem] tracking-[0.14em] text-[#DCBE7A]">
                0{i + 1}
              </span>
              <span className="text-[0.88rem] text-white/85">{p}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-7">
        <div className="grid grid-cols-2 gap-[0.7rem]">
          {STATS.map((s) => (
            <div
              key={s.num + s.suf}
              className="rounded-xl border border-white/15 bg-bewild-ink/30 px-[0.95rem] py-[0.75rem] backdrop-blur"
            >
              <p className="leading-none">
                <span className="font-display text-[1.5rem] font-semibold text-white">
                  {s.num}
                </span>
                <span className="ml-[0.35rem] font-mono text-[0.5rem] uppercase tracking-[0.16em] text-[#DCBE7A]">
                  {s.suf}
                </span>
              </p>
              <small className="mt-[0.3rem] block text-[0.68rem] leading-snug text-white/60">
                {s.small}
              </small>
            </div>
          ))}
        </div>
        <p className="mt-[0.7rem] font-mono text-[0.5rem] uppercase tracking-[0.14em] text-white/40">
          Referências sujeitas ao escopo · detalhes na proposta e no contrato
        </p>
      </section>

      <CTAButton
        href={`https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(
          "Olá, prefiro falar com um especialista sobre o diagnóstico."
        )}`}
        variant="ghost"
        external
        className="mt-6"
      >
        <MessageCircle className="h-4 w-4" /> Prefiro falar com um especialista
      </CTAButton>
    </aside>
  );
}

/* ====================== FORM ====================== */
function DiagnosticoForm() {
  const [f, setF] = useState<Form>(EMPTY_FORM);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));

  const nomeOk = f.nome.trim().length >= 2;
  const whatsOk = digits(f.whats).length >= 10;
  const canSubmit = nomeOk && whatsOk;

  const messageText = useMemo(() => {
    const lines: string[] = ["Olá, gostaria de um diagnóstico para meu studio."];
    const add = (label: string, val: string) => {
      const v = val.trim();
      if (v) lines.push(`${label}: ${v}`);
    };
    add("Nome", f.nome);
    add("WhatsApp", f.whats);
    add("E-mail", f.email);
    add("Localização", f.local);
    add("Metragem (m²)", f.metragem);
    add("Objetivo", f.objetivo);
    add("Já recebeu as chaves", f.chaves);
    add("Tem planta", f.planta);
    add("Mensagem", f.mensagem);
    return lines.join("\n");
  }, [f]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) {
      setTouched({ nome: true, whats: true });
      return;
    }
    const url = `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(messageText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="rounded-2xl bg-white p-7 text-bewild-ink shadow-[0_40px_90px_-30px_rgba(4,18,33,0.55)] lg:[grid-area:1/2/3/3]"
      aria-label="Formulário de diagnóstico"
    >
      <FormField
        label={
          <>
            Nome <b className="font-normal text-[#C9A24B]">*</b>
          </>
        }
        showError={touched.nome && !nomeOk}
        errorText="Informe seu nome."
      >
        <input
          type="text"
          className={inputCls(touched.nome && !nomeOk)}
          value={f.nome}
          onChange={(e) => set("nome", e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, nome: true }))}
          autoComplete="name"
          required
          maxLength={120}
        />
      </FormField>

      <div className="grid gap-[0.8rem] sm:grid-cols-2">
        <FormField
          label={
            <>
              WhatsApp <b className="font-normal text-[#C9A24B]">*</b>
            </>
          }
          showError={touched.whats && !whatsOk}
          errorText="Informe um WhatsApp válido com DDD."
        >
          <input
            type="tel"
            inputMode="tel"
            placeholder="(11) 99999-9999"
            className={inputCls(touched.whats && !whatsOk)}
            value={f.whats}
            onChange={(e) => set("whats", maskPhone(e.target.value))}
            onBlur={() => setTouched((t) => ({ ...t, whats: true }))}
            autoComplete="tel"
            required
          />
        </FormField>

        <FormField label="E-mail">
          <input
            type="email"
            placeholder="voce@email.com"
            className={inputCls(false)}
            value={f.email}
            onChange={(e) => set("email", e.target.value)}
            autoComplete="email"
            maxLength={255}
          />
        </FormField>
      </div>

      <div className="grid gap-[0.8rem] sm:grid-cols-2">
        <FormField label="Localização do imóvel">
          <input
            type="text"
            placeholder="Bairro, cidade"
            className={inputCls(false)}
            value={f.local}
            onChange={(e) => set("local", e.target.value)}
            maxLength={120}
          />
        </FormField>
        <FormField label="Metragem (m²)">
          <input
            type="text"
            inputMode="numeric"
            placeholder="32"
            className={inputCls(false)}
            value={f.metragem}
            onChange={(e) => set("metragem", e.target.value.replace(/[^\d.,]/g, "").slice(0, 6))}
          />
        </FormField>
      </div>

      <ChipsField
        label="Objetivo"
        options={OBJETIVOS}
        value={f.objetivo}
        onChange={(v) => set("objetivo", v)}
      />
      <ChipsField
        label="Já recebeu as chaves?"
        options={CHAVES}
        value={f.chaves}
        onChange={(v) => set("chaves", v)}
      />
      <ChipsField
        label="Tem planta do imóvel?"
        options={PLANTA}
        value={f.planta}
        onChange={(v) => set("planta", v)}
      />

      <FormField label="Mensagem">
        <textarea
          className={`${inputCls(false)} min-h-[92px] resize-y`}
          value={f.mensagem}
          onChange={(e) => set("mensagem", e.target.value)}
          maxLength={1000}
        />
      </FormField>

      <button
        type="submit"
        disabled={!canSubmit}
        className="group mt-2 inline-flex w-full items-center justify-center gap-[0.6rem] rounded-full bg-bewild-blue px-[1.7rem] py-[0.95rem] text-[0.95rem] font-semibold text-white shadow-[0_14px_34px_-14px_rgba(0,76,127,0.55)] transition-all hover:-translate-y-0.5 hover:bg-[#005C99] disabled:pointer-events-none disabled:opacity-45"
      >
        Solicitar diagnóstico
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </button>
      <p className="mt-[0.8rem] text-center font-mono text-[0.55rem] uppercase leading-[1.8] tracking-[0.16em] text-bewild-ink/55">
        Ao enviar, abrimos uma conversa no WhatsApp com seus dados preenchidos.
      </p>
    </form>
  );
}

function inputCls(bad: boolean) {
  return [
    "w-full rounded-xl border bg-white px-[0.9rem] py-[0.68rem] text-[0.9rem] font-normal text-bewild-ink transition-[border-color,box-shadow] placeholder:font-light placeholder:text-bewild-ink/35",
    "focus:border-bewild-blue focus:outline-none focus:ring-[3px] focus:ring-bewild-blue/15",
    bad ? "border-[#C65B45]" : "border-bewild-ink/20",
  ].join(" ");
}

function FormField({
  label,
  showError,
  errorText,
  children,
}: {
  label: React.ReactNode;
  showError?: boolean;
  errorText?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="mb-4 block">
      <span className="mb-[0.4rem] block text-[0.8rem] font-normal text-bewild-ink/85">
        {label}
      </span>
      {children}
      {showError && errorText && (
        <span className="mt-[0.3rem] block text-[0.7rem] font-normal text-[#B3422F]">
          {errorText}
        </span>
      )}
    </label>
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
    <fieldset className="mb-4">
      <legend className="mb-[0.4rem] block text-[0.8rem] font-normal text-bewild-ink/85">
        {label}
      </legend>
      <div className="flex flex-wrap gap-[0.5rem]">
        {options.map((opt) => {
          const active = value === opt;
          return (
            <button
              key={opt}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(active ? "" : opt)}
              className={`rounded-full border px-[0.95rem] py-[0.45rem] text-[0.8rem] font-normal transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bewild-blue ${
                active
                  ? "border-bewild-ink bg-bewild-ink text-white"
                  : "border-bewild-ink/25 bg-white text-bewild-ink/75 hover:border-bewild-blue hover:text-bewild-blue"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
