import { useEffect, useMemo, useRef, useState } from "react";
import { useSeo, breadcrumbJsonLd, organizationJsonLd } from "../lib/useSeo";
import { useSiteSettings } from "../lib/useSiteSettings";
import BwaNav from "@/components/BwaNav";
import BwaFooter from "@/components/BwaFooter";
import { CONTACT } from "../components/landing/content";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/ga4";
import { isLeadDelivered, timeoutAfter } from "@/lib/leadDelivery";
import { resolveLeadAttribution } from "@/lib/campaignParams";
import { readPersistedAttribution } from "@/lib/analytics";
import depoimentoVideo from "@/assets/testimonials/depoimento-cliente.mp4.asset.json";
import diagCssUrl from "./diagnostico-bwa.css?url";

/* ============================================================
 * DiagnosticoPage — /diagnostico no visual .bwa aprovado em
 * public/mockups/diag-bwa-aprovado.html (fonte da verdade da
 * APRESENTAÇÃO + COPY). A MECÂNICA do formulário é a testada:
 * names/ids/types, maskPhone, validações, notify-lead (15 chaves),
 * GA4 (generate_lead, play_depoimento), WhatsApp, useSeo e
 * jsonLd — TUDO PRESERVADO.
 *
 * Adições permitidas (documentadas no brief do dono):
 *  a) mensagens de erro de validação sob os campos;
 *  b) modal do vídeo da Vivian (thumb com <video>);
 *  c) botão "Enviando…" durante submit.
 *
 * O bloco FAQ dinâmico (useFaq) foi substituído pela versão de 4
 * perguntas aprovada pelo dono em 18/jul, com microdata FAQPage.
 * ============================================================ */

const FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Manrope:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,500&display=swap";

function ensureLinkOnce(rel: string, href: string, marker: string) {
  if (document.head.querySelector(`link[${marker}]`)) return;
  const el = document.createElement("link");
  el.rel = rel;
  el.href = href;
  el.setAttribute(marker, "");
  document.head.appendChild(el);
}

/** Mesma técnica da home: injeta o CSS da rota POR ÚLTIMO no head
 *  para vencer cascata dos globais (index.css, bwh-*); remove no
 *  unmount para não vazar paleta para outras rotas. */
function mountDiagStylesheet(): () => void {
  const marker = "data-bwa-diag-css";
  let link = document.head.querySelector<HTMLLinkElement>(`link[${marker}]`);
  if (!link) {
    link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = diagCssUrl;
    link.setAttribute(marker, "");
    document.head.appendChild(link);
  } else {
    document.head.appendChild(link);
  }
  return () => {
    link?.parentNode?.removeChild(link);
  };
}

function maskPhone(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
const digits = (v: string) => v.replace(/\D/g, "");
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* VALORES verbatim do mockup (dados do CRM, inalterados) */
const CHAVES = ["Sim", "Ainda não", "Estou comprando"];
const OBJETIVOS = ["Short stay", "Locação tradicional", "Uso misto", "Moradia", "Ainda avaliando"];
const PLANTA = ["Sim", "Não", "Não sei"];

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
    title: "Solicitar orçamento | Bewild",
    description:
      "Envie os dados do seu apartamento e receba uma leitura do potencial do imóvel, do escopo e dos próximos passos. Sem custo e sem compromisso.",
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

  useEffect(() => {
    ensureLinkOnce("preconnect", "https://fonts.googleapis.com", "data-bwa-diag-pc1");
    const el2 = document.head.querySelector("link[data-bwa-diag-pc2]");
    if (!el2) {
      const l = document.createElement("link");
      l.rel = "preconnect";
      l.href = "https://fonts.gstatic.com";
      l.crossOrigin = "anonymous";
      l.setAttribute("data-bwa-diag-pc2", "");
      document.head.appendChild(l);
    }
    ensureLinkOnce("stylesheet", FONTS_HREF, "data-bwa-diag-fonts");
    const unmountCss = mountDiagStylesheet();

    return () => {
      unmountCss();
    };
  }, []);

  const waUrl = `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(
    "Olá, prefiro falar com um especialista sobre o diagnóstico."
  )}`;

  return (
    <>
      {/* Nav compartilhado (mesmo componente da home e das demais internas).
          A nav própria .dg-nav foi removida: era o único header do site com
          wordmark de 20px, tracking .2em nos links e CTA navy sólido. */}
      <BwaNav />

      <main id="main" tabIndex={-1}>
        {/* 01 · HERO + FICHA */}
        <section className="dg-hero" aria-label="Solicitar Orçamento">
          <div className="dg-shell dg-hero-grid">
            <div>
              <div className="dg-intro">
                <p className="dg-label">Diagnóstico · 01 · sem custo, sem compromisso</p>
                <h1 className="dg-title">Conte o que você tem. A gente devolve o caminho.</h1>
                <p className="dg-lead">
                  Preencha a ficha do seu apartamento. A Bewild analisa o potencial do imóvel — para morar, alugar ou vender — e volta no seu WhatsApp com uma leitura clara do escopo, do investimento estimado e dos próximos passos.
                </p>
              </div>

              <div className="dg-support">
                <div className="dg-recebe">
                  <p className="dg-label">O que você recebe</p>
                  <ol>
                    <li><i>01</i><span><strong>Leitura do potencial do imóvel</strong>, considerando uso, bairro e metragem.</span></li>
                    <li><i>02</i><span><strong>Escopo da reforma</strong> para deixar o apartamento pronto para o seu objetivo.</span></li>
                    <li><i>03</i><span><strong>Faixa de investimento e prazo</strong> estimados para o seu caso.</span></li>
                    <li><i>04</i><span><strong>Próximos passos, no seu tempo</strong> — você decide se avança.</span></li>
                  </ol>
                </div>

                <p className="dg-trust">+160 reformas entregues</p>

                <TestimonialCard waUrl={waUrl} />
              </div>
            </div>

            <DiagnosticoForm waUrl={waUrl} />
          </div>
        </section>

        {/* 02 · DEPOIS DO ENVIO */}
        <section className="dg-section" aria-labelledby="dg-passos-title">
          <div className="dg-shell">
            <div className="dg-section-head">
              <p className="dg-label">Depois do envio · 02</p>
              <h2 id="dg-passos-title" className="dg-title">O que acontece quando você manda a ficha.</h2>
              <p className="dg-lead">Nada de mistério nem de fila. O processo é direto — e você decide cada passo seguinte.</p>
            </div>
            <div className="dg-cells">
              <div className="dg-cell"><i>01 · Análise</i><h3>A gente lê o seu imóvel.</h3><p>Bairro, metragem, estado atual e objetivo entram na leitura do potencial.</p></div>
              <div className="dg-cell"><i>02 · Retorno</i><h3>Voltamos no seu WhatsApp.</h3><p>Uma leitura inicial e as suas dúvidas respondidas. Gente de verdade, sem robô.</p></div>
              <div className="dg-cell"><i>03 · Visita e projeto</i><h3>Se fizer sentido, avançamos.</h3><p>Agendamos a visita técnica e começamos o projeto do seu apartamento.</p></div>
              <div className="dg-cell"><i>04 · Proposta fechada</i><h3>Preço e prazo antes da obra.</h3><p>Escopo, data de entrega e valor definidos em contrato. Sem surpresa no meio do caminho.</p></div>
            </div>
          </div>
        </section>

        {/* 03 · PROVA EM NÚMEROS */}
        <section className="dg-section" style={{ paddingTop: 0 }} aria-labelledby="dg-num-title">
          <div className="dg-shell">
            <div className="dg-section-head">
              <p className="dg-label">Por que a Bewild · 03</p>
              <h2 id="dg-num-title" className="dg-title">Já fizemos isso mais de 160 vezes.</h2>
            </div>
            <div className="dg-cells">
              <div className="dg-cell dg-stat"><b>+160</b><span>reformas entregues</span></div>
              <div className="dg-cell dg-stat"><b>60<em>dias úteis</em></b><span>referência de prazo de obra até 30 m²</span></div>
              <div className="dg-cell dg-stat"><b>5<em>anos</em></b><span>garantia de obra e marcenaria</span></div>
              <div className="dg-cell dg-stat"><b>1<em>contrato</em></b><span>preço e prazo fechados antes de a obra começar</span></div>
            </div>
            <p className="dg-fine dg-mono">Referências sujeitas ao escopo · detalhes na proposta e no contrato</p>
          </div>
        </section>

        {/* 04 · FAQ — versão aprovada de 4 perguntas (substitui useFaq dinâmico) */}
        <section className="dg-section" style={{ paddingTop: 0 }} aria-labelledby="dg-faq-title">
          <div className="dg-shell">
            <div className="dg-section-head">
              <p className="dg-label">Perguntas · 04</p>
              <h2 id="dg-faq-title" className="dg-title">Antes de mandar a ficha.</h2>
            </div>
            <div className="dg-faq" itemScope itemType="https://schema.org/FAQPage">
              <details open itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                <summary itemProp="name">Quanto custa o diagnóstico?</summary>
                <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                  <p itemProp="text">Nada. É uma análise inicial sem custo e sem compromisso — você decide se quer avançar depois de receber a leitura.</p>
                </div>
              </details>
              <details itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                <summary itemProp="name">Em quanto tempo vocês respondem?</summary>
                <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                  <p itemProp="text">Nosso time retorna no seu WhatsApp em horário comercial, normalmente no mesmo dia útil.</p>
                </div>
              </details>
              <details itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                <summary itemProp="name">Preciso ter as chaves para pedir o diagnóstico?</summary>
                <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                  <p itemProp="text">Não. Dá para começar a análise antes mesmo da compra — muitos clientes usam o diagnóstico para decidir o imóvel.</p>
                </div>
              </details>
              <details itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                <summary itemProp="name">E se eu ainda não souber o objetivo?</summary>
                <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                  <p itemProp="text">Sem problema. Marque "Ainda avaliando" e a gente compara com você os cenários de morar, alugar e vender.</p>
                </div>
              </details>
            </div>
          </div>
        </section>

        {/* 05 · CTA FINAL */}
        <section className="dg-final" aria-label="Preencher a ficha">
          <div className="dg-shell">
            <p className="dg-label" style={{ justifySelf: "center" }}>Diagnóstico gratuito · 05</p>
            <h2 className="dg-title">Pronto para ver o projeto antes da obra?</h2>
            <p className="dg-lead" style={{ margin: "0 auto" }}>A ficha leva menos de dois minutos. O resto do trabalho é nosso.</p>
            <div className="dg-final-actions">
              <a className="dg-button dg-button-light" href="#dg-ficha">Preencher a ficha <span aria-hidden="true">↑</span></a>
              <a className="dg-textlink" href={waUrl} target="_blank" rel="noopener noreferrer">Falar no WhatsApp →</a>
            </div>
            <p className="dg-mono">Atendimento de gente real · retorno rápido · +160 reformas entregues</p>
          </div>
        </section>
      </main>

      <BwaFooter />
    </>
  );
}

function DiagnosticoForm({ waUrl: _waUrl }: { waUrl: string }) {
  const [f, setF] = useState<Form>(EMPTY_FORM);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  // true quando o WhatsApp abriu mas nenhum destino (banco/Slack/CRM) confirmou.
  const [deliveryFailed, setDeliveryFailed] = useState(false);
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
    const add = (label: string, val: string) => { const v = val.trim(); if (v) lines.push(`${label}: ${v}`); };
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

    // Origem: URL atual → last-touch da sessão → first-touch do visitante.
    // (Antes lia só a URL atual, e quem chegava com UTM na home perdia a
    // origem ao navegar para /diagnostico — 22 de 38 leads sem UTM.)
    const persisted = readPersistedAttribution();
    const attribution = resolveLeadAttribution({
      search: typeof window !== "undefined" ? window.location.search : "",
      sessionUtm: persisted.sessionUtm,
      firstUtm: persisted.firstUtm,
      referrer: typeof document !== "undefined" ? document.referrer : "",
      referrerHost: persisted.referrerHost,
      landingPath: persisted.landingPath,
      currentPath: typeof window !== "undefined" ? window.location.pathname : "",
    });
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
      utm_source: attribution.utm_source,
      utm_medium: attribution.utm_medium,
      utm_campaign: attribution.utm_campaign,
      referrer: attribution.referrer,
      landing_path: attribution.landing_path,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    };

    // WhatsApp abre ANTES de qualquer await (senão o navegador bloqueia o popup).
    const url = `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(messageText)}`;
    window.open(url, "_blank", "noopener,noreferrer");

    // Espera a edge function (com teto de 8 s) antes de dizer "recebemos".
    // `notify-lead` responde 200 mesmo quando banco/Slack/CRM falharam, então
    // a confirmação vem de `isLeadDelivered`, não do status HTTP.
    let delivered = false;
    try {
      const result = await Promise.race([
        supabase.functions.invoke("notify-lead", { body: leadPayload }),
        timeoutAfter(8000),
      ]);
      delivered = isLeadDelivered(result);
      if (!delivered) console.error("[notify-lead] lead não confirmado", result);
    } catch (err) {
      console.error("[notify-lead] invoke failed", err);
    }

    trackEvent("generate_lead", {
      method: "diagnostico_form",
      objetivo: f.objetivo || undefined,
      chaves: f.chaves || undefined,
      planta: f.planta || undefined,
      location: f.local || undefined,
      delivery: delivered ? "confirmed" : "whatsapp_fallback",
    });

    setF(EMPTY_FORM);
    setTouched({});
    setShowMore(false);
    setDeliveryFailed(!delivered);
    setSuccess(true);
    setSubmitting(false);
  }

  const badCls = (bad: boolean) => (bad ? " dg-bad" : "");

  return (
    <form
      className={`dg-ficha${success ? " dg-sent" : ""}`}
      id="dg-ficha"
      data-ficha
      noValidate
      onSubmit={onSubmit}
      aria-label="Formulário de diagnóstico"
    >
      <div className="dg-ficha-head">
        <span className="dg-label">Ficha do seu apartamento</span>
        <span className="dg-mono">BW—002</span>
      </div>

      <div className="dg-success" role="status" data-delivery={deliveryFailed ? "fallback" : "confirmed"}>
        {deliveryFailed ? (
          <>
            <strong>Abrimos o WhatsApp com seus dados.</strong>
            <span>
              Não conseguimos registrar a ficha automaticamente. Envie a mensagem que já está
              pronta no WhatsApp para garantir o atendimento — ou{" "}
              <a className="dg-textlink" href={_waUrl} target="_blank" rel="noopener noreferrer">
                abra o WhatsApp de novo
              </a>
              .
            </span>
          </>
        ) : (
          <>
            <strong>Recebemos seus dados.</strong>
            <span>Nosso time vai falar com você no WhatsApp.</span>
          </>
        )}
      </div>

      <div className="dg-field dg-hidepós">
        <label htmlFor="dg-nome">Nome <span aria-hidden="true">*</span></label>
        <input
          id="dg-nome" name="nome" type="text" placeholder="Como podemos te chamar"
          autoComplete="name" required
          className={badCls(!!touched.nome && !nomeOk).trim()}
          value={f.nome}
          onChange={(e) => set("nome", e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, nome: true }))}
          maxLength={120}
        />
        {touched.nome && !nomeOk && <span className="dg-field-error">Informe seu nome.</span>}
      </div>

      <div className="dg-row dg-hidepós">
        <div className="dg-field">
          <label htmlFor="dg-whats">WhatsApp <span aria-hidden="true">*</span></label>
          <input
            id="dg-whats" name="whats" type="tel" inputMode="tel" placeholder="(11) 99999-9999"
            autoComplete="tel" required
            className={badCls(!!touched.whats && !whatsOk).trim()}
            value={f.whats}
            onChange={(e) => set("whats", maskPhone(e.target.value))}
            onBlur={() => setTouched((t) => ({ ...t, whats: true }))}
          />
          {touched.whats && !whatsOk && <span className="dg-field-error">Informe um WhatsApp com DDD.</span>}
        </div>
        <div className="dg-field">
          <label htmlFor="dg-email">E-mail <span className="dg-opt">(opcional)</span></label>
          <input
            id="dg-email" name="email" type="email" placeholder="voce@email.com"
            autoComplete="email"
            className={badCls(!!touched.email && emailFilled && !emailOk).trim()}
            value={f.email}
            onChange={(e) => set("email", e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            maxLength={255}
          />
          {touched.email && emailFilled && !emailOk && <span className="dg-field-error">E-mail inválido.</span>}
        </div>
      </div>

      <div className="dg-field dg-hidepós">
        <label htmlFor="dg-local">Bairro do imóvel <span aria-hidden="true">*</span></label>
        <input
          id="dg-local" name="local" type="text" placeholder="Ex: Pinheiros, Itaim, Butantã" required
          className={badCls(!!touched.local && !localOk).trim()}
          value={f.local}
          onChange={(e) => set("local", e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, local: true }))}
          maxLength={120}
        />
        {touched.local && !localOk && <span className="dg-field-error">Informe o bairro do imóvel.</span>}
      </div>

      <fieldset className="dg-field dg-hidepós">
        <legend>Já tem as chaves do imóvel? <span aria-hidden="true">*</span></legend>
        <ChipRow
          options={CHAVES} value={f.chaves}
          onChange={(v) => { set("chaves", v); setTouched((t) => ({ ...t, chaves: true })); }}
        />
        {touched.chaves && !chavesOk && <span className="dg-field-error">Selecione uma opção.</span>}
      </fieldset>

      <fieldset className="dg-field dg-hidepós">
        <legend>Objetivo <span aria-hidden="true">*</span></legend>
        <ChipRow
          options={OBJETIVOS} value={f.objetivo}
          onChange={(v) => { set("objetivo", v); setTouched((t) => ({ ...t, objetivo: true })); }}
        />
        {touched.objetivo && !objetivoOk && <span className="dg-field-error">Selecione o objetivo.</span>}
      </fieldset>

      <div className="dg-field dg-hidepós">
        <label htmlFor="dg-m2">Metragem (m²) <span className="dg-opt">(opcional)</span></label>
        <input
          id="dg-m2" name="metragem" type="text" inputMode="numeric" placeholder="32"
          value={f.metragem}
          onChange={(e) => set("metragem", e.target.value.replace(/[^\d.,]/g, "").slice(0, 6))}
        />
      </div>

      <button
        type="button"
        className="dg-textlink dg-more dg-hidepós"
        data-more
        aria-expanded={showMore}
        onClick={() => setShowMore((s) => !s)}
      >
        {showMore ? "− Menos detalhes" : "+ Mais detalhes (opcional)"}
      </button>

      {showMore && (
        <div className="dg-hidepós" data-more-panel>
          <fieldset className="dg-field">
            <legend>Tem planta do imóvel?</legend>
            <ChipRow options={PLANTA} value={f.planta} onChange={(v) => set("planta", v)} />
          </fieldset>
          <div className="dg-field" style={{ marginTop: 14 }}>
            <label htmlFor="dg-msg">Mensagem</label>
            <textarea id="dg-msg" name="mensagem" maxLength={1000}
              value={f.mensagem} onChange={(e) => set("mensagem", e.target.value)} />
          </div>
        </div>
      )}

      <button type="submit" className="dg-button dg-hidepós" disabled={!canSubmit || submitting}>
        {submitting ? "Enviando…" : "Solicitar Orçamento"} <span aria-hidden="true">→</span>
      </button>
      <p className="dg-ficha-note dg-hidepós">Sem compromisso · a gente só te chama no WhatsApp</p>
    </form>
  );
}

function ChipRow({ options, value, onChange }: {
  options: string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="dg-chips" data-chips>
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            className="dg-chip"
            aria-pressed={active}
            onClick={() => onChange(active ? "" : opt)}
          >
            {opt}
          </button>
        );
      })}
    </div>
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
      <aside className="dg-testi" aria-label="Depoimento em vídeo de cliente">
        <button
          type="button"
          className="dg-testithumb"
          onClick={handleOpen}
          aria-label="Assistir depoimento em vídeo de Vivian"
        >
          {/* Conforme nota do mockup: em produção entra o vídeo real (muted,
              preload=metadata) no lugar da <img> poster. */}
          <video src={depoimentoVideo.url} muted playsInline preload="metadata" tabIndex={-1} aria-hidden="true" />
        </button>
        <div className="dg-testimeta">
          <p className="dg-mono">Depoimento</p>
          <p className="dg-testiname">Vivian</p>
          <p className="dg-testirole">cliente Bewild · depoimento gravado sem roteiro</p>
          <a className="dg-textlink" href={waUrl} target="_blank" rel="noopener noreferrer">
            Prefiro falar com um especialista →
          </a>
        </div>
      </aside>

      {open && (
        <div
          className="dg-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Depoimento em vídeo de Vivian"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="dg-modal-inner">
            <button
              ref={closeBtnRef}
              type="button"
              className="dg-modal-close"
              onClick={() => setOpen(false)}
              aria-label="Fechar vídeo"
            >
              ✕
            </button>
            <video
              ref={videoRef}
              src={depoimentoVideo.url}
              controls
              playsInline
              autoPlay
              className="dg-modal-video"
            />
          </div>
        </div>
      )}
    </>
  );
}
