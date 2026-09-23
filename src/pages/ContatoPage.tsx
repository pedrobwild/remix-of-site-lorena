import { useState } from "react";
import BwaFooter from "@/components/BwaFooter";
import BwaNav from "@/components/BwaNav";
import { CONTACT, whatsappHref } from "@/components/landing/content";
import { supabase } from "@/integrations/supabase/client";
import { isLeadDelivered, timeoutAfter } from "@/lib/leadDelivery";
import { trackEvent } from "@/lib/ga4";
import { useCtaClickTracking } from "@/lib/trackCta";
import { breadcrumbJsonLd, useSeo } from "@/lib/useSeo";
import { useSiteSettings } from "@/lib/useSiteSettings";
import "./contato.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const digits = (v: string) => v.replace(/\D+/g, "");

function maskPhone(v: string) {
  const d = digits(v).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

const ADDRESS = "Rua Pitú, 72, Sala 115, Vila Olímpia, São Paulo-SP";
const MAP_QUERY = encodeURIComponent(ADDRESS);
const MAP_EMBED_URL = `https://www.google.com/maps?q=${MAP_QUERY}&output=embed`;
const MAP_LINK = `https://www.google.com/maps/search/?api=1&query=${MAP_QUERY}`;

export default function ContatoPage() {
  useCtaClickTracking("contato");
  const { settings } = useSiteSettings();
  const email = settings?.contact_email || CONTACT.email;

  const [nome, setNome] = useState("");
  const [whats, setWhats] = useState("");
  const [mail, setMail] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const nomeOk = nome.trim().length >= 2;
  const whatsOk = digits(whats).length >= 10;
  const mailOk = mail.trim() === "" || EMAIL_RE.test(mail.trim());
  const msgOk = mensagem.trim().length >= 10;
  const podeEnviar = nomeOk && whatsOk && mailOk && msgOk && !enviando;

  const [whatsLink, setWhatsLink] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ nome: true, whats: true, mail: true, mensagem: true });
    if (!podeEnviar) return;
    setEnviando(true);
    setErro(null);

    const waTexto = [
      "Olá, vim pelo site da Bewild e quero conversar.",
      `Nome: ${nome.trim()}`,
      `WhatsApp: ${whats}`,
      mail.trim() ? `E-mail: ${mail.trim()}` : null,
      `Mensagem: ${mensagem.trim()}`,
    ]
      .filter(Boolean)
      .join("\n");
    const waLink = whatsappHref(waTexto);
    setWhatsLink(waLink);


    const payload = {
      name: nome.trim(),
      whatsapp: digits(whats),
      email: mail.trim() || null,
      message: mensagem.trim(),
      location: null,
      area_m2: null,
      objetivo: null,
      chaves: null,
      planta: null,
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      referrer: typeof document !== "undefined" ? document.referrer || null : null,
      landing_path: "/contato",
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    };

    let delivered = false;
    try {
      const result = await Promise.race([
        supabase.functions.invoke("notify-lead", { body: payload }),
        timeoutAfter(8000),
      ]);
      delivered = isLeadDelivered(result);
    } catch (err) {
      console.error("[notify-lead] invoke failed", err);
    }

    setEnviando(false);
    if (delivered) {
      setEnviado(true);
      trackEvent("generate_lead", { method: "contato_form" });
      window.open(waLink, "_blank", "noopener,noreferrer");
    } else {
      setErro(
        "Não conseguimos enviar sua mensagem agora. Tente novamente ou fale com a gente no WhatsApp.",
      );
    }
  }

  useSeo({
    title: "Contato para reforma de apartamento em SP | Bewild",
    description:
      "Fale com a Bewild sobre sua reforma de apartamento e a entrega do imóvel pronto. WhatsApp, e-mail e escritório na Vila Olímpia, São Paulo-SP.",
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
              <iframe
                className="bwa-contact-map"
                title="Mapa do escritório Bewild na Vila Olímpia"
                src={MAP_EMBED_URL}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
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

            {enviado ? (
              <div className="bwa-contact-form-done" role="status">
                <p className="bwa-label">Mensagem recebida</p>
                <h3>Obrigado, {nome.trim().split(" ")[0]}.</h3>
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
            ) : (
              <form className="bwa-contact-form" onSubmit={enviar} noValidate>
                <label className="bwa-contact-field">
                  <span>Nome</span>
                  <input
                    type="text"
                    value={nome}
                    maxLength={120}
                    autoComplete="name"
                    onChange={(e) => setNome(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, nome: true }))}
                    aria-invalid={touched.nome && !nomeOk}
                  />
                  {touched.nome && !nomeOk && <em>Informe seu nome.</em>}
                </label>

                <label className="bwa-contact-field">
                  <span>WhatsApp</span>
                  <input
                    type="tel"
                    inputMode="tel"
                    value={whats}
                    autoComplete="tel"
                    placeholder="(11) 90000-0000"
                    onChange={(e) => setWhats(maskPhone(e.target.value))}
                    onBlur={() => setTouched((t) => ({ ...t, whats: true }))}
                    aria-invalid={touched.whats && !whatsOk}
                  />
                  {touched.whats && !whatsOk && <em>Informe um número com DDD.</em>}
                </label>

                <label className="bwa-contact-field">
                  <span>E-mail (opcional)</span>
                  <input
                    type="email"
                    value={mail}
                    maxLength={180}
                    autoComplete="email"
                    onChange={(e) => setMail(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, mail: true }))}
                    aria-invalid={touched.mail && !mailOk}
                  />
                  {touched.mail && !mailOk && <em>Confira o e-mail digitado.</em>}
                </label>

                <label className="bwa-contact-field bwa-contact-field--full">
                  <span>Mensagem</span>
                  <textarea
                    rows={5}
                    value={mensagem}
                    maxLength={1200}
                    placeholder="Conte o tamanho do apartamento, o bairro e o que você quer fazer."
                    onChange={(e) => setMensagem(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, mensagem: true }))}
                    aria-invalid={touched.mensagem && !msgOk}
                  />
                  {touched.mensagem && !msgOk && <em>Escreva ao menos uma frase.</em>}
                </label>

                {erro && (
                  <p className="bwa-contact-form-error" role="alert">
                    {erro}
                  </p>
                )}

                <div className="bwa-contact-form-actions">
                  <button className="bwa-button" type="submit" data-cta="contato-enviar" disabled={!podeEnviar}>
                    {enviando ? "Enviando…" : "Enviar mensagem"}
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