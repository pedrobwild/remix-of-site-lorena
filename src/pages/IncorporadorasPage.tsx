import { useEffect, useMemo, useRef, useState } from "react";
import BwaFooter from "@/components/BwaFooter";
import BwaNav from "@/components/BwaNav";
import BewildLealMoreiraLogos from "@/components/BewildLealMoreiraLogos";
import { CONTACT, whatsappHref } from "@/components/landing/content";
import {
  INCORP_BENEFITS,
  INCORP_CASE,
  INCORP_CASE_SLUG,
  INCORP_FAQ,
  INCORP_FORM,
  INCORP_HERO,
  INCORP_PATH,
  INCORP_PREVIEW_BANNER,
  INCORP_RULES,
  INCORP_SEO,
  INCORP_STEPS,
  INDICACAO_FORM_URL,
} from "@/content/incorporadoras";
import { supabase } from "@/integrations/supabase/client";
import { isIncorporadorasPreview } from "@/lib/incorporadorasFlag";
import { formatDate, usePartnerCase } from "@/lib/usePartnerCase";
import { devWarn } from "@/lib/devLog";
import type { LeadPayload } from "@/lib/leadDelivery";
import {
  buildLeadMessage,
  fieldErrorId,
  fieldErrorProps,
  firstInvalidField,
  isValidEmail,
  touchAll,
  type FieldErrors,
} from "@/lib/leadForm";
import { formatBrPhone, isValidBrPhone, normalizeBrPhoneDigits } from "@/lib/phone";
import { useCtaClickTracking } from "@/lib/trackCta";
import { useImageAlts } from "@/lib/useImageAlts";
import {
  browserUserAgent,
  collectLeadAttribution,
  focusField,
  openWhatsapp,
  useLeadSubmit,
} from "@/lib/useLeadSubmit";
import { breadcrumbJsonLd, faqJsonLd, useSeo } from "@/lib/useSeo";
import { useSiteSettings } from "@/lib/useSiteSettings";
import "./faq-page.css";
import "./contato.css";
import "./parceiros.css";
import "./incorporadoras.css";

/* ============================================================
 * IncorporadorasPage — /parceiros/incorporadoras
 *
 * Página atrás da flag INCORPORADORAS_PAGE_ENABLED (src/config/site.ts):
 * enquanto estiver false, o roteador devolve a 404 e a prévia interna
 * (?incorporadoras=1) sai com noindex e um aviso fixo na tela.
 *
 * Todo o texto vem de src/content/incorporadoras.ts (aprovado em 23/09/2026).
 * Números, linha do tempo, projetos e depoimento do case vêm da tabela
 * partner_cases (slug "leal-moreira"), para atualizar sem publicar código.
 * ============================================================ */

/* ------------------------------------------------------------------ */
/* Formulário                                                          */
/* ------------------------------------------------------------------ */

type Campo = "nome" | "incorporadora" | "whats" | "mail" | "empreendimento" | "fase";
const CAMPOS: readonly Campo[] = [
  "nome",
  "incorporadora",
  "whats",
  "mail",
  "empreendimento",
  "fase",
];
const CAMPO_ID: Record<Campo, string> = {
  nome: "incorp-nome",
  incorporadora: "incorp-empresa",
  whats: "incorp-whats",
  mail: "incorp-mail",
  empreendimento: "incorp-empreendimento",
  fase: "incorp-fase",
};

function validar(v: {
  nome: string;
  incorporadora: string;
  whats: string;
  mail: string;
  empreendimento: string;
  fase: string;
}): FieldErrors<Campo> {
  const e: FieldErrors<Campo> = {};
  if (!v.nome.trim()) e.nome = INCORP_FORM.errors.nome;
  if (!v.incorporadora.trim()) e.incorporadora = INCORP_FORM.errors.incorporadora;
  if (!isValidBrPhone(v.whats)) e.whats = INCORP_FORM.errors.whats;
  if (v.mail.trim() && !isValidEmail(v.mail)) e.mail = INCORP_FORM.errors.mail;
  if (!v.empreendimento.trim()) e.empreendimento = INCORP_FORM.errors.empreendimento;
  if (!v.fase) e.fase = INCORP_FORM.errors.fase;
  return e;
}

export default function IncorporadorasPage() {
  useCtaClickTracking("incorporadoras");
  const { settings } = useSiteSettings();
  const email = settings?.contact_email || CONTACT.email;
  const preview = isIncorporadorasPreview();
  const { data: caso, projects } = usePartnerCase(INCORP_CASE_SLUG);
  const [faqAberto, setFaqAberto] = useState(0);

  const capas = useMemo(() => projects.map((p) => p.cover_url), [projects]);
  const alts = useImageAlts(capas);

  const mostrarCase = !!caso && (caso.published || preview);
  const atualizado = formatDate(caso?.updated_on ?? null);

  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [incorporadora, setIncorporadora] = useState("");
  const [whats, setWhats] = useState("");
  const [mail, setMail] = useState("");
  const [empreendimento, setEmpreendimento] = useState("");
  const [fase, setFase] = useState("");
  const [unidades, setUnidades] = useState("");
  const [metragens, setMetragens] = useState("");
  const [chaves, setChaves] = useState("");
  const [compradores, setCompradores] = useState("");
  const [touched, setTouched] = useState<Partial<Record<Campo, boolean>>>({});
  const [whatsLink, setWhatsLink] = useState<string | null>(null);
  const resultadoRef = useRef<HTMLDivElement | null>(null);
  const { sending: enviando, outcome, submit } = useLeadSubmit({ method: "incorporadoras_form" });
  const ultimoAberto = useRef<string | null>(null);
  const ultimaIndicacao = useRef<string | null>(null);

  const errors = validar({ nome, incorporadora, whats, mail, empreendimento, fase });
  const erro = (k: Campo) => (touched[k] ? errors[k] : undefined);
  const touch = (k: Campo) => setTouched((t) => ({ ...t, [k]: true }));
  const concluido = outcome === "delivered" || outcome === "timedOut";

  useEffect(() => {
    if (concluido) resultadoRef.current?.focus();
  }, [concluido]);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;
    const primeiro = firstInvalidField(CAMPOS, errors);
    if (primeiro) {
      setTouched(touchAll(CAMPOS));
      focusField(CAMPO_ID[primeiro]);
      return;
    }

    const waLink = whatsappHref(
      buildLeadMessage(INCORP_FORM.whatsappIntro, [
        ["Nome", nome],
        ["Cargo", cargo],
        ["Incorporadora", incorporadora],
        ["WhatsApp", whats],
        ["E-mail", mail],
        ["Empreendimento e bairro", empreendimento],
        ["Fase", fase],
        ["Unidades", unidades],
        ["Metragens", metragens],
        ["Previsão de chaves", chaves],
        ["Compradores", compradores],
      ]),
    );
    setWhatsLink(waLink);

    const mensagem = buildLeadMessage(`Incorporadora: ${incorporadora.trim()}`, [
      ["Cargo", cargo],
      ["Fase", fase],
      ["Unidades", unidades],
      ["Metragens", metragens],
      ["Previsão de chaves", chaves],
      ["Compradores", compradores],
    ]);

    const payload: LeadPayload = {
      name: nome.trim(),
      whatsapp: normalizeBrPhoneDigits(whats),
      email: mail.trim() || null,
      message: mensagem,
      location: empreendimento.trim(),
      area_m2: null,
      objetivo: "Parceria incorporadora",
      chaves: null,
      planta: null,
      ...collectLeadAttribution(),
      user_agent: browserUserAgent(),
      lead_source: null,
      form_path: INCORP_PATH,
    };

    // Registra no painel /admin/indicacoes, uma vez por conjunto de dados.
    // Os tetos seguem a policy de INSERT anônimo de partner_referrals.
    const assinatura = JSON.stringify([nome, incorporadora, whats, mail, empreendimento, fase]);
    if (ultimaIndicacao.current !== assinatura) {
      ultimaIndicacao.current = assinatura;
      void supabase
        .from("partner_referrals")
        .insert({
          partner_name: nome.trim().slice(0, 160),
          partner_type: "Incorporadora",
          company: incorporadora.trim().slice(0, 160),
          whatsapp: normalizeBrPhoneDigits(whats),
          email: mail.trim().slice(0, 254) || null,
          region: empreendimento.trim().slice(0, 200),
          units: unidades.trim().slice(0, 80) || null,
          origin: "site-incorporadoras",
          message: mensagem.slice(0, 4000),
          landing_path: INCORP_PATH,
          referrer:
            typeof document !== "undefined" ? (document.referrer || "").slice(0, 500) || null : null,
          user_agent: browserUserAgent()?.slice(0, 500) ?? null,
        })
        .then(({ error }) => {
          if (error) {
            ultimaIndicacao.current = null;
            devWarn("[partner_referrals] insert falhou:", error);
          }
        });
    }

    // A aba do WhatsApp abre DENTRO do gesto (antes de qualquer await),
    // senão Safari e Chrome mobile bloqueiam o popup.
    void submit(payload, {
      params: { fase },
      beforeSend:
        ultimoAberto.current === waLink
          ? undefined
          : () => {
              ultimoAberto.current = waLink;
              openWhatsapp(waLink);
            },
      handedToWhatsapp: true,
    });
  }

  useSeo({
    title: INCORP_SEO.title,
    description: INCORP_SEO.description,
    keywords: INCORP_SEO.keywords,
    canonicalPath: INCORP_PATH,
    ogType: "website",
    // Prévia interna nunca entra em buscador.
    noindex: preview,
    jsonLd: settings
      ? [
          breadcrumbJsonLd(settings, INCORP_SEO.breadcrumb),
          faqJsonLd(INCORP_FAQ.items.map((i) => ({ q: i.q, a: i.a }))),
        ]
      : undefined,
  });

  const primeiroNome = nome.trim().split(" ")[0];

  return (
    <div className="bwa-parceiros">
      <BwaNav />

      {preview && (
        <p className="bwa-incorp-preview" role="status">
          {INCORP_PREVIEW_BANNER}
        </p>
      )}

      <main id="main" tabIndex={-1}>
        {/* Abertura */}
        <section className="bwa-parc-hero">
          <div className="bwa-shell">
            <p className="bwa-label">{INCORP_HERO.label}</p>
            <h1>
              {INCORP_HERO.titleStart} <em>{INCORP_HERO.titleEm}</em>
            </h1>
            <p className="bwa-parc-lead">{INCORP_HERO.lead}</p>
            <div className="bwa-parc-hero-actions">
              <a
                className="bwa-button"
                href={INCORP_HERO.ctaPrimary.href}
                data-cta={INCORP_HERO.ctaPrimary.cta}
              >
                {INCORP_HERO.ctaPrimary.label} <span aria-hidden="true">→</span>
              </a>
              <a
                className="bwa-parc-ghost"
                href={INCORP_HERO.ctaSecondary.href}
                data-cta={INCORP_HERO.ctaSecondary.cta}
              >
                {INCORP_HERO.ctaSecondary.label} <span aria-hidden="true">↓</span>
              </a>
            </div>
            <a className="bwa-incorp-strip" href={`#${INCORP_CASE.id}`} data-cta="incorporadoras-faixa-case">
              <BewildLealMoreiraLogos />
              <span>{INCORP_HERO.caseStrip}</span>
            </a>
          </div>
        </section>

        {/* Case Leal Moreira */}
        <section className="bwa-parc-section" id={INCORP_CASE.id}>
          <div className="bwa-shell">
            <p className="bwa-label">{INCORP_CASE.label}</p>
            <h2>{INCORP_CASE.title}</h2>
            {INCORP_CASE.intro.map((p) => (
              <p className="bwa-parc-lead2" key={p}>
                {p}
              </p>
            ))}

            {mostrarCase && caso && (
              <>
                {caso.stats.length > 0 && (
                  <>
                    <h3>{INCORP_CASE.statsTitle}</h3>
                    {preview && !caso.published && (
                      <p className="bwa-incorp-pending">{INCORP_CASE.previewPending}</p>
                    )}
                    <ul className="bwa-parc-facts">
                      {caso.stats.map((s) => (
                        <li key={s.label}>
                          <strong>{s.value}</strong> {s.label}
                        </li>
                      ))}
                    </ul>
                    {atualizado && (
                      <p className="bwa-incorp-updated">
                        {INCORP_CASE.updatedPrefix} {atualizado}
                      </p>
                    )}
                  </>
                )}

                {caso.timeline.length > 0 && (
                  <>
                    <h3>{INCORP_CASE.timelineTitle}</h3>
                    <ol className="bwa-incorp-timeline">
                      {caso.timeline.map((t) => (
                        <li key={`${t.when}-${t.text}`}>
                          <span className="bwa-incorp-when">{t.when}</span>
                          <span>{t.text}</span>
                        </li>
                      ))}
                    </ol>
                  </>
                )}

                {projects.length > 0 && (
                  <>
                    <h3>{INCORP_CASE.galleryTitle}</h3>
                    <div className="bwa-incorp-gallery">
                      {projects.map((p) => (
                        <article className="bwa-incorp-card" key={p.slug}>
                          {p.cover_url && (
                            <figure>
                              <img
                                src={p.cover_url}
                                alt={
                                  p.cover_alt ||
                                  alts[p.cover_url] ||
                                  `Projeto 3D de ${p.title}`
                                }
                                loading="lazy"
                                decoding="async"
                              />
                            </figure>
                          )}
                          <span className="bwa-incorp-status">
                            {INCORP_CASE.statusLabels[p.status ?? "entregue"] ??
                              INCORP_CASE.statusLabels.entregue}
                          </span>
                          <h4>{p.title}</h4>
                          <a
                            href={`/portfolio/${p.slug}`}
                            data-cta="incorporadoras-case-projeto"
                          >
                            {INCORP_CASE.galleryLink} <span aria-hidden="true">→</span>
                          </a>
                        </article>
                      ))}
                    </div>
                    <p className="bwa-incorp-note">{INCORP_CASE.galleryNote}</p>
                  </>
                )}

                {caso.quote_text && (
                  <blockquote className="bwa-incorp-quote">
                    <p>{caso.quote_text}</p>
                    {(caso.quote_author || caso.quote_role) && (
                      <footer>
                        {[caso.quote_author, caso.quote_role].filter(Boolean).join(" · ")}
                      </footer>
                    )}
                  </blockquote>
                )}
              </>
            )}

            <aside className="bwa-incorp-buyer">
              <h3>{INCORP_CASE.buyer.title}</h3>
              <p>{INCORP_CASE.buyer.text}</p>
              <a
                className="bwa-button"
                href={whatsappHref(INCORP_CASE.buyer.whatsappMessage)}
                target="_blank"
                rel="noopener noreferrer"
                data-cta={INCORP_CASE.buyer.cta}
              >
                {INCORP_CASE.buyer.ctaLabel} <span aria-hidden="true">↗</span>
              </a>
            </aside>
          </div>
        </section>

        {/* Como funciona */}
        <section className="bwa-parc-section" id={INCORP_STEPS.id}>
          <div className="bwa-shell">
            <p className="bwa-label">{INCORP_STEPS.label}</p>
            <h2>{INCORP_STEPS.title}</h2>
            <p className="bwa-parc-lead2">{INCORP_STEPS.lead}</p>
            <ol className="bwa-parc-steps">
              {INCORP_STEPS.steps.map((p) => (
                <li className="bwa-parc-step" key={p.n}>
                  <span className="bwa-parc-num">{p.n}</span>
                  <div>
                    <h3>{p.t}</h3>
                    <p>{p.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* O que a incorporadora ganha */}
        <section className="bwa-parc-section bwa-parc-section--alt" id={INCORP_BENEFITS.id}>
          <div className="bwa-shell">
            <p className="bwa-label">{INCORP_BENEFITS.label}</p>
            <h2>{INCORP_BENEFITS.title}</h2>
            <div className="bwa-incorp-benefits">
              {INCORP_BENEFITS.items.map((item) => (
                <article className="bwa-parc-reason" key={item.t}>
                  <h3>{item.t}</h3>
                  <p>{item.d}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Regras da parceria */}
        <section className="bwa-parc-section" id={INCORP_RULES.id}>
          <div className="bwa-shell">
            <p className="bwa-label">{INCORP_RULES.label}</p>
            <h2>{INCORP_RULES.title}</h2>
            <ul className="bwa-incorp-rules">
              {INCORP_RULES.items.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <p className="bwa-parc-note">
              <a href={INCORP_RULES.link.href} data-cta={INCORP_RULES.link.cta}>
                {INCORP_RULES.link.label} <span aria-hidden="true">→</span>
              </a>
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="bwa-parc-section bwa-parc-section--alt" id={INCORP_FAQ.id}>
          <div className="bwa-shell">
            <p className="bwa-label">{INCORP_FAQ.label}</p>
            <h2>{INCORP_FAQ.title}</h2>
            {/* Dados estruturados só pelo JSON-LD (faqJsonLd no useSeo). */}
            <div className="bwa-faq-list">
              {INCORP_FAQ.items.map((item, i) => {
                const open = faqAberto === i;
                return (
                  <article key={item.q} className={`bwa-faq-item${open ? " bwa-open" : ""}`}>
                    <h3 className="bwa-faqpage-q">
                      <button
                        className="bwa-faq-question"
                        type="button"
                        aria-expanded={open}
                        aria-controls={`incorp-resposta-${i}`}
                        onClick={() => setFaqAberto(open ? -1 : i)}
                      >
                        <span className="bwa-faq-num">{String(i + 1).padStart(2, "0")}</span>
                        <strong>{item.q}</strong>
                        <span className="bwa-faq-icon" aria-hidden="true" />
                      </button>
                    </h3>
                    <div id={`incorp-resposta-${i}`} className="bwa-faq-answer">
                      <p>{item.a}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Formulário */}
        <section className="bwa-contact-form-sec" id={INCORP_FORM.id}>
          <div className="bwa-shell bwa-contact-form-grid">
            <div className="bwa-contact-form-intro">
              <p className="bwa-label">{INCORP_FORM.label}</p>
              <h2>{INCORP_FORM.title}</h2>
              <p>{INCORP_FORM.intro}</p>
              <p>{INCORP_FORM.partnerNoteLead}</p>
              <a
                className="bwa-contact-link"
                href={INDICACAO_FORM_URL}
                target="_blank"
                rel="noopener noreferrer"
                data-cta="incorporadoras-form-indicacao"
              >
                {INCORP_FORM.partnerNoteLink} <span aria-hidden="true">↗</span>
              </a>
              <p>
                {INCORP_FORM.emailPrefix} <a href={`mailto:${email}`}>{email}</a>
              </p>
            </div>

            {outcome === "delivered" ? (
              <div className="bwa-contact-form-done" role="status" tabIndex={-1} ref={resultadoRef}>
                <p className="bwa-label">{INCORP_FORM.done.label}</p>
                <h3>
                  {INCORP_FORM.done.title} {primeiroNome}.
                </h3>
                <p>{INCORP_FORM.done.text}</p>
                <a
                  className="bwa-button"
                  href={whatsLink ?? whatsappHref(INCORP_FORM.whatsappIntro)}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cta="incorporadoras-form-whatsapp"
                >
                  {INCORP_FORM.done.whatsLabel} <span aria-hidden="true">↗</span>
                </a>
              </div>
            ) : outcome === "timedOut" ? (
              <div className="bwa-contact-form-done" role="status" tabIndex={-1} ref={resultadoRef}>
                <p className="bwa-label">{INCORP_FORM.timedOut.label}</p>
                <h3>
                  {INCORP_FORM.timedOut.title} {primeiroNome}.
                </h3>
                <p>{INCORP_FORM.timedOut.text}</p>
                {whatsLink && (
                  <a
                    className="bwa-button"
                    href={whatsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-cta="incorporadoras-form-whatsapp-timeout"
                  >
                    {INCORP_FORM.timedOut.whatsLabel} <span aria-hidden="true">→</span>
                  </a>
                )}
              </div>
            ) : (
              <form
                className="bwa-contact-form"
                onSubmit={enviar}
                noValidate
                aria-label={INCORP_FORM.title}
              >
                <div className="bwa-contact-field">
                  <label htmlFor="incorp-nome">{INCORP_FORM.fields.nome}</label>
                  <input
                    id="incorp-nome"
                    type="text"
                    value={nome}
                    maxLength={120}
                    autoComplete="name"
                    required
                    onChange={(e) => setNome(e.target.value)}
                    onBlur={() => touch("nome")}
                    {...fieldErrorProps("incorp-nome", erro("nome"))}
                  />
                  {erro("nome") && <em id={fieldErrorId("incorp-nome")}>{erro("nome")}</em>}
                </div>

                <div className="bwa-contact-field">
                  <label htmlFor="incorp-cargo">{INCORP_FORM.fields.cargo}</label>
                  <input
                    id="incorp-cargo"
                    type="text"
                    value={cargo}
                    maxLength={80}
                    autoComplete="organization-title"
                    onChange={(e) => setCargo(e.target.value)}
                  />
                </div>

                <div className="bwa-contact-field">
                  <label htmlFor="incorp-empresa">{INCORP_FORM.fields.incorporadora}</label>
                  <input
                    id="incorp-empresa"
                    type="text"
                    value={incorporadora}
                    maxLength={120}
                    autoComplete="organization"
                    required
                    onChange={(e) => setIncorporadora(e.target.value)}
                    onBlur={() => touch("incorporadora")}
                    {...fieldErrorProps("incorp-empresa", erro("incorporadora"))}
                  />
                  {erro("incorporadora") && (
                    <em id={fieldErrorId("incorp-empresa")}>{erro("incorporadora")}</em>
                  )}
                </div>

                <div className="bwa-contact-field">
                  <label htmlFor="incorp-whats">{INCORP_FORM.fields.whats}</label>
                  <input
                    id="incorp-whats"
                    type="tel"
                    inputMode="tel"
                    value={whats}
                    autoComplete="tel"
                    placeholder="(11) 90000-0000"
                    required
                    onChange={(e) => setWhats(formatBrPhone(e.target.value))}
                    onBlur={() => touch("whats")}
                    {...fieldErrorProps("incorp-whats", erro("whats"))}
                  />
                  {erro("whats") && <em id={fieldErrorId("incorp-whats")}>{erro("whats")}</em>}
                </div>

                <div className="bwa-contact-field">
                  <label htmlFor="incorp-mail">{INCORP_FORM.fields.mail}</label>
                  <input
                    id="incorp-mail"
                    type="email"
                    value={mail}
                    maxLength={180}
                    autoComplete="email"
                    onChange={(e) => setMail(e.target.value)}
                    onBlur={() => touch("mail")}
                    {...fieldErrorProps("incorp-mail", erro("mail"))}
                  />
                  {erro("mail") && <em id={fieldErrorId("incorp-mail")}>{erro("mail")}</em>}
                </div>

                <div className="bwa-contact-field">
                  <label htmlFor="incorp-empreendimento">
                    {INCORP_FORM.fields.empreendimento}
                  </label>
                  <input
                    id="incorp-empreendimento"
                    type="text"
                    value={empreendimento}
                    maxLength={180}
                    placeholder={INCORP_FORM.fields.empreendimentoPlaceholder}
                    required
                    onChange={(e) => setEmpreendimento(e.target.value)}
                    onBlur={() => touch("empreendimento")}
                    {...fieldErrorProps("incorp-empreendimento", erro("empreendimento"))}
                  />
                  {erro("empreendimento") && (
                    <em id={fieldErrorId("incorp-empreendimento")}>{erro("empreendimento")}</em>
                  )}
                </div>

                <div className="bwa-contact-field">
                  <label htmlFor="incorp-fase">{INCORP_FORM.fields.fase}</label>
                  <select
                    id="incorp-fase"
                    value={fase}
                    required
                    onChange={(e) => setFase(e.target.value)}
                    onBlur={() => touch("fase")}
                    {...fieldErrorProps("incorp-fase", erro("fase"))}
                  >
                    <option value="">Selecione</option>
                    {INCORP_FORM.fases.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                  {erro("fase") && <em id={fieldErrorId("incorp-fase")}>{erro("fase")}</em>}
                </div>

                <div className="bwa-contact-field">
                  <label htmlFor="incorp-unidades">{INCORP_FORM.fields.unidades}</label>
                  <input
                    id="incorp-unidades"
                    type="text"
                    inputMode="numeric"
                    value={unidades}
                    maxLength={5}
                    placeholder={INCORP_FORM.fields.unidadesPlaceholder}
                    onChange={(e) => setUnidades(e.target.value.replace(/\D+/g, ""))}
                  />
                </div>

                <div className="bwa-contact-field">
                  <label htmlFor="incorp-metragens">{INCORP_FORM.fields.metragens}</label>
                  <input
                    id="incorp-metragens"
                    type="text"
                    value={metragens}
                    maxLength={120}
                    placeholder={INCORP_FORM.fields.metragensPlaceholder}
                    onChange={(e) => setMetragens(e.target.value)}
                  />
                </div>

                <div className="bwa-contact-field">
                  <label htmlFor="incorp-chaves">{INCORP_FORM.fields.chaves}</label>
                  <input
                    id="incorp-chaves"
                    type="text"
                    value={chaves}
                    maxLength={40}
                    placeholder={INCORP_FORM.fields.chavesPlaceholder}
                    onChange={(e) => setChaves(e.target.value)}
                  />
                </div>

                <div className="bwa-contact-field bwa-contact-field--full">
                  <label htmlFor="incorp-compradores">{INCORP_FORM.fields.compradores}</label>
                  <select
                    id="incorp-compradores"
                    value={compradores}
                    onChange={(e) => setCompradores(e.target.value)}
                  >
                    <option value="">Selecione</option>
                    {INCORP_FORM.compradores.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {outcome === "failed" && (
                  <div className="bwa-contact-field bwa-contact-field--full" role="alert">
                    <p>{INCORP_FORM.failed}</p>
                    {whatsLink && (
                      <a href={whatsLink} target="_blank" rel="noopener noreferrer">
                        {INCORP_FORM.timedOut.whatsLabel} <span aria-hidden="true">↗</span>
                      </a>
                    )}
                  </div>
                )}

                <div className="bwa-contact-form-actions">
                  {/* Habilitado com campos pendentes: o clique mostra os erros
                      e leva o foco ao primeiro campo inválido. */}
                  <button
                    className="bwa-button"
                    type="submit"
                    data-cta="incorporadoras-enviar"
                    disabled={enviando}
                  >
                    {enviando
                      ? INCORP_FORM.sending
                      : outcome === "failed"
                        ? INCORP_FORM.retry
                        : INCORP_FORM.submit}
                    <span aria-hidden="true">→</span>
                  </button>
                  <p>{INCORP_FORM.privacy}</p>
                </div>
              </form>
            )}
          </div>
        </section>
      </main>

      <BwaFooter />
    </div>
  );
}
