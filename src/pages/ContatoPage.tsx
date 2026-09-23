import { useEffect, useRef, useState } from "react";
import BwaFooter from "@/components/BwaFooter";
import BwaNav from "@/components/BwaNav";
import { CONTACT, whatsappHref } from "@/components/landing/content";
import { isConsentAccepted, onConsentChange } from "@/lib/cookieConsent";
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
import {
  browserUserAgent,
  collectLeadAttribution,
  focusField,
  openWhatsapp,
  useLeadSubmit,
} from "@/lib/useLeadSubmit";
import { breadcrumbJsonLd, useSeo } from "@/lib/useSeo";
import { useSiteSettings } from "@/lib/useSiteSettings";
import "./contato.css";

const ADDRESS = "Rua Pitú, 72, Sala 115, Vila Olímpia, São Paulo-SP";
const MAP_QUERY = encodeURIComponent(ADDRESS);
const MAP_EMBED_URL = `https://www.google.com/maps?q=${MAP_QUERY}&output=embed`;
const MAP_LINK = `https://www.google.com/maps/search/?api=1&query=${MAP_QUERY}`;

type Campo = "nome" | "whats" | "mail" | "mensagem";
const CAMPOS: readonly Campo[] = ["nome", "whats", "mail", "mensagem"];
const CAMPO_ID: Record<Campo, string> = {
  nome: "ct-nome",
  whats: "ct-whats",
  mail: "ct-mail",
  mensagem: "ct-mensagem",
};
const MENSAGEM_MIN = 10;

function validar(v: Record<Campo, string>): FieldErrors<Campo> {
  const e: FieldErrors<Campo> = {};
  if (v.nome.trim().length < 2) e.nome = "Informe seu nome.";
  if (!isValidBrPhone(v.whats)) e.whats = "Informe um número com DDD.";
  if (v.mail.trim() && !isValidEmail(v.mail)) e.mail = "Confira o e-mail digitado.";
  // A regra dos 10 caracteres agora aparece no texto — antes o botão só
  // ficava cinza e o visitante que escreveu "Olá" não sabia por quê.
  if (v.mensagem.trim().length < MENSAGEM_MIN) {
    e.mensagem = v.mensagem.trim()
      ? `Escreva um pouco mais (ao menos ${MENSAGEM_MIN} caracteres).`
      : "Escreva sua mensagem.";
  }
  return e;
}

/**
 * Mapa do escritório. O embed do Google Maps grava cookies do Google, então
 * só carrega com o consentimento aceito — ou quando o visitante pede.
 */
function MapaEscritorio() {
  const [consentido, setConsentido] = useState(isConsentAccepted);
  const [pedido, setPedido] = useState(false);

  useEffect(() => onConsentChange((v) => setConsentido(v === "accepted")), []);

  if (consentido || pedido) {
    return (
      <iframe
        className="bwa-contact-map"
        title="Mapa do escritório Bewild na Vila Olímpia"
        src={MAP_EMBED_URL}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    );
  }

  return (
    <div className="bwa-contact-map-placeholder">
      <p className="bwa-label">Mapa · Vila Olímpia</p>
      <p>
        O mapa vem do Google Maps, que grava cookies próprios. Por isso ele só carrega se você
        pedir.
      </p>
      <div className="bwa-contact-map-actions">
        <button type="button" className="bwa-button" onClick={() => setPedido(true)}>
          Carregar mapa
        </button>
        <a className="bwa-contact-link" href={MAP_LINK} target="_blank" rel="noopener noreferrer">
          Abrir no Google Maps <span aria-hidden="true">↗</span>
        </a>
      </div>
    </div>
  );
}

export default function ContatoPage() {
  useCtaClickTracking("contato");
  const { settings } = useSiteSettings();
  const email = settings?.contact_email || CONTACT.email;

  const [nome, setNome] = useState("");
  const [whats, setWhats] = useState("");
  const [mail, setMail] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [touched, setTouched] = useState<Partial<Record<Campo, boolean>>>({});
  // Link do WhatsApp com a mensagem do visitante: aberto no envio e reusado
  // no aviso de sucesso e no fallback.
  const [whatsLink, setWhatsLink] = useState<string | null>(null);
  const ultimoAberto = useRef<string | null>(null);
  const resultadoRef = useRef<HTMLDivElement | null>(null);
  const { sending: enviando, outcome, submit } = useLeadSubmit({ method: "contato_form" });

  const errors = validar({ nome, whats, mail, mensagem });
  const erro = (k: Campo) => (touched[k] ? errors[k] : undefined);
  const touch = (k: Campo) => setTouched((t) => ({ ...t, [k]: true }));
  const concluido = outcome === "delivered" || outcome === "timedOut";

  // O formulário é trocado pelo aviso: o foco vai junto (senão cai no <body>).
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
      buildLeadMessage("Olá, vim pelo site da Bewild e quero conversar.", [
        ["Nome", nome],
        ["WhatsApp", whats],
        ["E-mail", mail],
        ["Mensagem", mensagem],
      ]),
    );
    setWhatsLink(waLink);

    const payload: LeadPayload = {
      name: nome.trim(),
      whatsapp: normalizeBrPhoneDigits(whats),
      email: mail.trim() || null,
      message: mensagem.trim(),
      location: null,
      area_m2: null,
      objetivo: null,
      chaves: null,
      planta: null,
      ...collectLeadAttribution(),
      user_agent: browserUserAgent(),
      form_path: "/contato",
    };

    // O contato continua no WhatsApp com a mensagem pronta. A aba abre
    // DENTRO do gesto (antes de qualquer await), senão o Safari/Chrome mobile
    // bloqueiam o popup. Num reenvio com os mesmos dados não abre de novo.
    void submit(payload, {
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
    title: "Contato: escritório de arquitetura e reforma em SP | Bewild",
    description:
      "Fale com o time de arquitetura e engenharia da Bewild sobre seu projeto e a reforma do apartamento. WhatsApp, e-mail e escritório na Vila Olímpia, São Paulo-SP.",
    canonicalPath: "/contato",
    ogType: "website",
    jsonLd: settings
      ? [
          breadcrumbJsonLd(settings, [
            { name: "Início", path: "/" },
            { name: "Contato", path: "/contato" },
          ]),
        ]
      : undefined,
  });

  const primeiroNome = nome.trim().split(" ")[0];

  return (
    <div className="bwa-contact-page">
      <BwaNav />

      <main id="main" tabIndex={-1}>
        <section className="bwa-contact-intro">
          <div className="bwa-shell bwa-contact-intro-grid">
            <div>
              <p className="bwa-label">Contato · São Paulo</p>
              <h1>Vamos conversar sobre seu apartamento.</h1>
            </div>
            <p className="bwa-contact-lead">
              Conte o que você deseja transformar. Nossa equipe responde pelos canais abaixo e recebe com hora marcada em nosso escritório.
            </p>
          </div>
        </section>

        <section className="bwa-contact-content" aria-label="Canais de contato e localização">
          <div className="bwa-shell bwa-contact-grid">
            <div className="bwa-contact-options">
              <article className="bwa-contact-option">
                <span className="bwa-contact-index">01</span>
                <div>
                  <p className="bwa-label">WhatsApp</p>
                  <h2>Fale diretamente com a Bewild.</h2>
                  <p>Envie uma mensagem para iniciar seu atendimento.</p>
                  <a
                    className="bwa-contact-link"
                    href={whatsappHref("Olá, quero solicitar um orçamento para meu apartamento")}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Abrir WhatsApp <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </article>

              <article className="bwa-contact-option">
                <span className="bwa-contact-index">02</span>
                <div>
                  <p className="bwa-label">E-mail</p>
                  <h2>{email}</h2>
                  <p>Para propostas, parcerias e informações gerais.</p>
                  <a className="bwa-contact-link" href={`mailto:${email}`}>
                    Enviar e-mail <span aria-hidden="true">→</span>
                  </a>
                </div>
              </article>

              <article className="bwa-contact-option">
                <span className="bwa-contact-index">03</span>
                <div>
                  <p className="bwa-label">Escritório</p>
                  <h2>Vila Olímpia</h2>
                  <address>Rua Pitú, 72, Sala 115<br />Vila Olímpia · São Paulo-SP</address>
                  <a className="bwa-contact-link" href={MAP_LINK} target="_blank" rel="noopener noreferrer">
                    Como chegar <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </article>
            </div>

            <div className="bwa-contact-map-wrap">
              <MapaEscritorio />
            </div>
          </div>
        </section>

        <section className="bwa-contact-form-sec" id="formulario">
          <div className="bwa-shell bwa-contact-form-grid">
            <div className="bwa-contact-form-intro">
              <p className="bwa-label">Formulário · 04</p>
              <h2>Prefere escrever? Conte aqui o que você precisa.</h2>
              <p>
                Respondemos em horário comercial pelo WhatsApp informado. Se preferir falar agora, o
                atendimento direto continua aberto.
              </p>
              <a
                className="bwa-contact-link"
                href={whatsappHref("Olá, quero falar com a Bewild sobre meu apartamento")}
                target="_blank"
                rel="noopener noreferrer"
                data-cta="contato-form-whatsapp"
              >
                Falar no WhatsApp <span aria-hidden="true">↗</span>
              </a>
            </div>

            {outcome === "delivered" ? (
              <div className="bwa-contact-form-done" role="status" tabIndex={-1} ref={resultadoRef}>
                <p className="bwa-label">Mensagem recebida</p>
                <h3>Obrigado, {primeiroNome}.</h3>
                <p>
                  Nosso time entra em contato pelo WhatsApp informado. Se quiser adiantar, fale com a
                  gente agora mesmo.
                </p>
                <a
                  className="bwa-button"
                  href={whatsLink ?? whatsappHref("Olá, acabei de enviar uma mensagem pelo site da Bewild")}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Falar no WhatsApp <span aria-hidden="true">→</span>
                </a>
              </div>
            ) : outcome === "timedOut" ? (
              <div className="bwa-contact-form-done" role="status" tabIndex={-1} ref={resultadoRef}>
                <p className="bwa-label">Envio sem confirmação</p>
                <h3>Sua mensagem pode já ter chegado, {primeiroNome}.</h3>
                <p>
                  A confirmação demorou mais que o normal. Abrimos o WhatsApp com a sua mensagem
                  pronta: envie por lá para garantir o atendimento — se já tivermos recebido, é só
                  ignorar.
                </p>
                {whatsLink && (
                  <a className="bwa-button" href={whatsLink} target="_blank" rel="noopener noreferrer">
                    Enviar pelo WhatsApp <span aria-hidden="true">→</span>
                  </a>
                )}
              </div>
            ) : (
              <form className="bwa-contact-form" onSubmit={enviar} noValidate aria-label="Formulário de contato">
                <div className="bwa-contact-field">
                  <label htmlFor="ct-nome">Nome</label>
                  <input
                    id="ct-nome"
                    type="text"
                    value={nome}
                    maxLength={120}
                    autoComplete="name"
                    required
                    onChange={(e) => setNome(e.target.value)}
                    onBlur={() => touch("nome")}
                    {...fieldErrorProps("ct-nome", erro("nome"))}
                  />
                  {erro("nome") && <em id={fieldErrorId("ct-nome")}>{erro("nome")}</em>}
                </div>

                <div className="bwa-contact-field">
                  <label htmlFor="ct-whats">WhatsApp</label>
                  <input
                    id="ct-whats"
                    type="tel"
                    inputMode="tel"
                    value={whats}
                    autoComplete="tel"
                    placeholder="(11) 90000-0000"
                    required
                    onChange={(e) => setWhats(formatBrPhone(e.target.value))}
                    onBlur={() => touch("whats")}
                    {...fieldErrorProps("ct-whats", erro("whats"))}
                  />
                  {erro("whats") && <em id={fieldErrorId("ct-whats")}>{erro("whats")}</em>}
                </div>

                <div className="bwa-contact-field">
                  <label htmlFor="ct-mail">E-mail (opcional)</label>
                  <input
                    id="ct-mail"
                    type="email"
                    value={mail}
                    maxLength={180}
                    autoComplete="email"
                    onChange={(e) => setMail(e.target.value)}
                    onBlur={() => touch("mail")}
                    {...fieldErrorProps("ct-mail", erro("mail"))}
                  />
                  {erro("mail") && <em id={fieldErrorId("ct-mail")}>{erro("mail")}</em>}
                </div>

                <div className="bwa-contact-field bwa-contact-field--full">
                  <label htmlFor="ct-mensagem">Mensagem</label>
                  <textarea
                    id="ct-mensagem"
                    rows={5}
                    value={mensagem}
                    maxLength={1200}
                    required
                    placeholder="Conte o tamanho do apartamento, o bairro e o que você quer fazer."
                    onChange={(e) => setMensagem(e.target.value)}
                    onBlur={() => touch("mensagem")}
                    {...fieldErrorProps("ct-mensagem", erro("mensagem"))}
                  />
                  {erro("mensagem") && <em id={fieldErrorId("ct-mensagem")}>{erro("mensagem")}</em>}
                </div>

                {outcome === "failed" && !enviando && (
                  <div className="bwa-contact-form-error" role="alert">
                    <p>
                      Não conseguimos registrar sua mensagem pelo site. Abrimos o WhatsApp com ela
                      pronta: envie por lá para garantir o atendimento, ou tente de novo.
                    </p>
                    {whatsLink && (
                      <a
                        className="bwa-contact-link"
                        href={whatsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Abrir o WhatsApp com a mensagem <span aria-hidden="true">↗</span>
                      </a>
                    )}
                  </div>
                )}

                <div className="bwa-contact-form-actions">
                  {/* Habilitado com campos pendentes: o clique mostra os erros e leva o foco ao primeiro. */}
                  <button className="bwa-button" type="submit" data-cta="contato-enviar" disabled={enviando}>
                    {enviando ? "Enviando…" : outcome === "failed" ? "Tentar de novo" : "Enviar mensagem"}
                    <span aria-hidden="true">→</span>
                  </button>
                  <p>Seus dados são usados apenas para responder ao seu contato.</p>
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
