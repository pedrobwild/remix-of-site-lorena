/**
 * DiagnosticoPage — /diagnostico
 * Re-skin: hero escuro por foto + card de formulário branco flutuante.
 * Estrutura mantida: hero com formulário + footer.
 * Toda a lógica de envio ao WhatsApp e os campos atuais permanecem idênticos.
 */
import { useEffect, useRef, useState } from "react";
import { useSeo } from "../lib/useSeo";
import Header from "../components/landing/Header";
import Footer from "../components/landing/Footer";
import { whatsappHref } from "../components/landing/content";
import { ImagePlaceholder } from "../components/landing/ImagePlaceholder";
import "../styles/diagnostico.css";

type Estagio = "cru" | "reformando" | "pronto" | "ja-alugando" | "nao-sei" | "";
type Objetivo = "preparar" | "operar" | "jornada-completa" | "entender-potencial" | "";
type Timing = "agora" | "30-dias" | "60-90-dias" | "sem-prazo" | "";

interface FormData {
  nome: string;
  whatsapp: string;
  temImovel: string;
  estagio: Estagio;
  bairro: string;
  tipo: string;
  objetivo: Objetivo;
  timing: Timing;
}

const INITIAL: FormData = {
  nome: "", whatsapp: "", temImovel: "",
  estagio: "", bairro: "", tipo: "",
  objetivo: "", timing: "",
};

function buildWhatsappMessage(data: FormData): string {
  const estagioMap: Record<Estagio, string> = {
    cru: "cru ou recém-entregue pela construtora",
    reformando: "em reforma",
    pronto: "pronto mas ainda não alugando",
    "ja-alugando": "já alugando por temporada",
    "nao-sei": "em estágio que preciso avaliar",
    "": "",
  };
  const objMap: Record<Objetivo, string> = {
    preparar: "preparar o imóvel com Be Wild Reformas",
    operar: "colocar para operar com BeWild Host Care",
    "jornada-completa": "fazer a jornada completa (Be Wild Reformas + BeWild Host Care)",
    "entender-potencial": "entender o potencial do imóvel para short stay",
    "": "",
  };

  return `Olá! Me chamo ${data.nome || "..."} e quero um diagnóstico Be Wild para meu imóvel.

Situação:
• Imóvel: ${data.tipo || "—"} em ${data.bairro || "—"}
• Estágio atual: ${estagioMap[data.estagio] || "—"}
• Objetivo: ${objMap[data.objetivo] || "—"}
• Quando quer começar: ${data.timing || "—"}

Aguardo orientação sobre o melhor caminho: Be Wild Reformas, BeWild Host Care ou jornada completa.`;
}

/* ─── Radio-chip group acessível ────────────────────────── */
interface ChipsProps<T extends string> {
  name: string;
  value: T;
  options: { val: T; label: string }[];
  onChange: (v: T) => void;
}
function ChipGroup<T extends string>({ name, value, options, onChange }: ChipsProps<T>) {
  function onKey(e: React.KeyboardEvent, i: number) {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const next = (i + 1) % options.length;
      onChange(options[next].val);
      (e.currentTarget.parentElement?.children[next] as HTMLElement)?.focus();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const prev = (i - 1 + options.length) % options.length;
      onChange(options[prev].val);
      (e.currentTarget.parentElement?.children[prev] as HTMLElement)?.focus();
    }
  }
  return (
    <div className="chips" role="radiogroup" aria-label={name}>
      {options.map((o, i) => (
        <button
          key={o.val}
          type="button"
          role="radio"
          aria-checked={value === o.val}
          tabIndex={value === o.val || (!value && i === 0) ? 0 : -1}
          className={`chip ${value === o.val ? "is-selected" : ""}`}
          onClick={() => onChange(o.val)}
          onKeyDown={(e) => onKey(e, i)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ─── Página ─────────────────────────────────────────────── */
export default function DiagnosticoPage() {
  const [form, setForm] = useState<FormData>(INITIAL);
  const [enviado, setEnviado] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});
  const heroRef = useRef<HTMLElement>(null);

  useSeo({
    title: "Diagnóstico Be Wild — Avalie seu imóvel para short stay",
    description:
      "Conte em que estágio está seu imóvel. A Be Wild indica o caminho certo: Be Wild Reformas, BeWild Host Care ou jornada completa.",
    canonicalPath: "/diagnostico",
    ogType: "website",
  });

  useEffect(() => {
    const t = setTimeout(() => heroRef.current?.classList.add("is-ready"), 80);
    return () => clearTimeout(t);
  }, []);

  const update = (field: keyof FormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const canSubmit =
    !!form.nome.trim() &&
    !!form.whatsapp.trim() &&
    !!form.estagio &&
    !!form.objetivo;

  const errors: Partial<Record<keyof FormData, string>> = {};
  if (touched.nome && !form.nome.trim()) errors.nome = "Informe seu nome.";
  if (touched.whatsapp && !form.whatsapp.trim()) errors.whatsapp = "Informe seu WhatsApp.";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const msg = buildWhatsappMessage(form);
    window.open(whatsappHref(msg), "_blank", "noopener,noreferrer");
    setEnviado(true);
  };

  const orientacoes = [
    { titulo: "Be Wild Reformas", desc: "Imóvel cru, vazio, recém-entregue ou mal aproveitado. Precisa de projeto, obra e setup para operar." },
    { titulo: "BeWild Host Care", desc: "Imóvel pronto ou quase pronto. Precisa de gestão profissional: anúncio, hóspedes, limpeza e repasse." },
    { titulo: "Jornada completa", desc: "Imóvel que precisa de preparação E operação. A Be Wild cuida do ciclo inteiro." },
  ];

  return (
    <div className="bewild-diagnostico min-h-screen antialiased">
      <Header />
      <main>
        <section ref={heroRef} className="hero">
          <div className="hero__media">
            <ImagePlaceholder assetId="hero-studio" showReveal={false} className="w-full h-full" />
          </div>
          <div className="hero__overlay" />
          <div className="hero__grain" />

          <div className="container">
            <div className="grid">
              {/* Esquerda — orientação */}
              <div className="side">
                <p className="eyebrow">Diagnóstico Be Wild do ativo</p>
                <h1>
                  <span className="hero__line"><span>Descubra qual caminho</span></span>
                  <span className="hero__line"><span className="italic">faz sentido para o seu imóvel.</span></span>
                </h1>
                <p className="side__lead">
                  Não sabe se precisa reformar, ajustar ou colocar para operar? Conte o estágio
                  do seu imóvel. A Be Wild te orienta: Be Wild Reformas, BeWild Host Care ou jornada completa.
                </p>

                <div className="orient">
                  {orientacoes.map((o) => (
                    <div key={o.titulo} className="orient__item">
                      <span className="orient__check" aria-hidden>✓</span>
                      <div>
                        <p className="orient__title">{o.titulo}</p>
                        <p className="orient__desc">{o.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Direita — formulário */}
              <div className="form-card">
                {enviado ? (
                  <div className="success">
                    <p className="eyebrow" style={{ color: "var(--petroleo)" }}>Pedido enviado</p>
                    <h2>Diagnóstico enviado!</h2>
                    <p>
                      Você será redirecionado para o WhatsApp com suas informações preenchidas.
                      Nossa equipe entrará em contato para orientar o próximo passo.
                    </p>
                  </div>
                ) : (
                  <form className="form" onSubmit={handleSubmit} noValidate>
                    <div className={`field ${errors.nome ? "field--error" : ""}`}>
                      <label htmlFor="nome">Nome <span className="req">*</span></label>
                      <input
                        id="nome" type="text" value={form.nome}
                        onChange={(e) => update("nome", e.target.value)}
                        onBlur={() => setTouched((t) => ({ ...t, nome: true }))}
                        placeholder="Seu nome" required
                      />
                      {errors.nome && <p className="field__err">{errors.nome}</p>}
                    </div>

                    <div className={`field ${errors.whatsapp ? "field--error" : ""}`}>
                      <label htmlFor="wa">WhatsApp <span className="req">*</span></label>
                      <input
                        id="wa" type="tel" value={form.whatsapp}
                        onChange={(e) => update("whatsapp", e.target.value)}
                        onBlur={() => setTouched((t) => ({ ...t, whatsapp: true }))}
                        placeholder="(11) 99999-9999" required
                      />
                      {errors.whatsapp && <p className="field__err">{errors.whatsapp}</p>}
                    </div>

                    <div className="field">
                      <label>Você já tem o imóvel?</label>
                      <ChipGroup
                        name="Você já tem o imóvel?"
                        value={form.temImovel}
                        onChange={(v) => update("temImovel", v)}
                        options={[
                          { val: "sim", label: "Sim, tenho" },
                          { val: "comprando", label: "Estou comprando" },
                          { val: "pesquisando", label: "Ainda pesquisando" },
                        ]}
                      />
                    </div>

                    <div className="field">
                      <label>Estágio do imóvel <span className="req">*</span></label>
                      <ChipGroup<Estagio>
                        name="Estágio do imóvel"
                        value={form.estagio}
                        onChange={(v) => update("estagio", v)}
                        options={[
                          { val: "cru", label: "Cru / recém-entregue" },
                          { val: "reformando", label: "Em reforma" },
                          { val: "pronto", label: "Pronto, mas não opera" },
                          { val: "ja-alugando", label: "Já alugo por temporada" },
                          { val: "nao-sei", label: "Não sei avaliar" },
                        ]}
                      />
                    </div>

                    <div className="row-2">
                      <div className="field">
                        <label htmlFor="bairro">Bairro / região</label>
                        <input
                          id="bairro" type="text" value={form.bairro}
                          onChange={(e) => update("bairro", e.target.value)}
                          placeholder="Ex: Pinheiros, SP"
                        />
                      </div>
                      <div className="field">
                        <label htmlFor="tipo">Tipo do imóvel</label>
                        <select
                          id="tipo" value={form.tipo}
                          onChange={(e) => update("tipo", e.target.value)}
                        >
                          <option value="">Selecione</option>
                          <option value="Studio">Studio</option>
                          <option value="Apartamento 1 dorm">Apartamento 1 dorm</option>
                          <option value="Apartamento 2 dorm">Apartamento 2 dorm</option>
                          <option value="Outro">Outro</option>
                        </select>
                      </div>
                    </div>

                    <div className="field">
                      <label>Objetivo <span className="req">*</span></label>
                      <ChipGroup<Objetivo>
                        name="Objetivo"
                        value={form.objetivo}
                        onChange={(v) => update("objetivo", v)}
                        options={[
                          { val: "preparar", label: "Preparar meu imóvel" },
                          { val: "operar", label: "Colocar para operar" },
                          { val: "jornada-completa", label: "Jornada completa" },
                          { val: "entender-potencial", label: "Entender o potencial" },
                        ]}
                      />
                    </div>

                    <div className="field">
                      <label>Quando quer começar?</label>
                      <ChipGroup<Timing>
                        name="Quando quer começar?"
                        value={form.timing}
                        onChange={(v) => update("timing", v)}
                        options={[
                          { val: "agora", label: "Agora" },
                          { val: "30-dias", label: "Em 30 dias" },
                          { val: "60-90-dias", label: "Em 60–90 dias" },
                          { val: "sem-prazo", label: "Sem prazo definido" },
                        ]}
                      />
                    </div>

                    <button type="submit" className="submit" disabled={!canSubmit}>
                      Receber diagnóstico Be Wild <span className="arr">→</span>
                    </button>

                    <p className="micro">
                      Você será direcionado ao WhatsApp com suas informações. Não enviamos spam.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      {/* FloatingCTA, MobileBottomCTA e StickyDiagnosticPanel ocultos por design nesta página */}
    </div>
  );
}
