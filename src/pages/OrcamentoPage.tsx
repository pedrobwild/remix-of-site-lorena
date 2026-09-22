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

const OBJETIVOS = [
  "Morar",
  "Short stay (curta temporada)",
  "Locação tradicional",
  "Uso misto",
  "Ainda avaliando",
];

/**
 * OrcamentoPage — /orcamento
 *
 * Página real de pedido de orçamento. O formulário entrega no mesmo canal
 * do /contato (edge function `notify-lead`), marcando a origem `/orcamento`.
 */
export default function OrcamentoPage() {
  useCtaClickTracking("orcamento");
  const { settings } = useSiteSettings();
  const email = settings?.contact_email || CONTACT.email;

  const [nome, setNome] = useState("");
  const [whats, setWhats] = useState("");
  const [mail, setMail] = useState("");
  const [bairro, setBairro] = useState("");
  const [area, setArea] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const nomeOk = nome.trim().length >= 2;
  const whatsOk = digits(whats).length >= 10;
  const mailOk = mail.trim() === "" || EMAIL_RE.test(mail.trim());
  const bairroOk = bairro.trim().length >= 2;
  const areaNum = Number(digits(area));
  const areaOk = area.trim() === "" || (areaNum > 0 && areaNum < 2000);
  const podeEnviar = nomeOk && whatsOk && mailOk && bairroOk && areaOk && !enviando;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ nome: true, whats: true, mail: true, bairro: true, area: true });
    if (!podeEnviar) return;
    setEnviando(true);
    setErro(null);

    const payload = {
      name: nome.trim(),
      whatsapp: digits(whats),
      email: mail.trim() || null,
      message: mensagem.trim() || null,
      location: bairro.trim(),
      area_m2: area.trim() ? areaNum : null,
      objetivo: objetivo || null,
      chaves: null,
      planta: null,
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      referrer: typeof document !== "undefined" ? document.referrer || null : null,
      landing_path: "/orcamento",
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
      trackEvent("generate_lead", { method: "orcamento_form" });
    } else {
      setErro(
        "Não conseguimos enviar seu pedido agora. Tente novamente ou fale com a gente no WhatsApp.",
      );
    }
  }

  useSeo({
    title: "Orçamento de reforma de apartamento em SP | Bewild",
    description:
      "Peça o orçamento da sua reforma de apartamento em São Paulo: projeto, obra, marcenaria e mobília em um contrato, com preço e prazo fechados.",
    keywords:
      "orçamento de reforma de apartamento, orçamento de reforma em SP, pedir orçamento reforma São Paulo, custo de reforma, reforma de apartamento em SP, Bewild",
    canonicalPath: "/orcamento",
    ogType: "website",
    jsonLd: settings
      ? [
          breadcrumbJsonLd(settings, [
            { name: "Início", path: "/" },
            { name: "Orçamento", path: "/orcamento" },
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
              <p className="bwa-label">Orçamento · São Paulo</p>
              <h1>Orçamento de reforma de apartamento em SP.</h1>
            </div>
            <p className="bwa-contact-lead">
              Conte o essencial sobre o imóvel e devolvemos uma faixa de investimento e prazo para
              a reforma completa — projeto, obra, marcenaria e mobília em um único contrato.
            </p>
          </div>
        </section>

        <section className="bwa-contact-form-sec" id="formulario">
          <div className="bwa-shell bwa-contact-form-grid">
            <div className="bwa-contact-form-intro">
              <p className="bwa-label">Pedido de orçamento</p>
              <h2>Preencha em um minuto. Respondemos pelo WhatsApp.</h2>
              <p>
                Sem custo e sem compromisso. Se preferir conversar antes, fale com a gente agora ou
                use os canais da <a href="/contato">página de contato</a>.
              </p>
              <a
                className="bwa-contact-link"
                href={whatsappHref("Olá, quero um orçamento de reforma para meu apartamento")}
                target="_blank"
                rel="noopener noreferrer"
                data-cta="orcamento-whatsapp"
              >
                Falar no WhatsApp <span aria-hidden="true">↗</span>
              </a>
              <p>
                Prefere e-mail? <a href={`mailto:${email}`}>{email}</a>
              </p>
            </div>

            {enviado ? (
              <div className="bwa-contact-form-done" role="status">
                <p className="bwa-label">Pedido recebido</p>
                <h3>Obrigado, {nome.trim().split(" ")[0]}.</h3>
                <p>
                  Nosso time analisa as informações do apartamento e responde pelo WhatsApp
                  informado. Se quiser adiantar, fale com a gente agora mesmo.
                </p>
                <a
                  className="bwa-button"
                  href={whatsappHref("Olá, acabei de pedir um orçamento pelo site da Bewild")}
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

                <label className="bwa-contact-field">
                  <span>Bairro do apartamento</span>
                  <input
                    type="text"
                    value={bairro}
                    maxLength={120}
                    placeholder="Vila Olímpia, São Paulo-SP"
                    onChange={(e) => setBairro(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, bairro: true }))}
                    aria-invalid={touched.bairro && !bairroOk}
                  />
                  {touched.bairro && !bairroOk && <em>Informe o bairro.</em>}
                </label>

                <label className="bwa-contact-field">
                  <span>Metragem (m²)</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={area}
                    maxLength={5}
                    placeholder="28"
                    onChange={(e) => setArea(e.target.value.replace(/\D+/g, ""))}
                    onBlur={() => setTouched((t) => ({ ...t, area: true }))}
                    aria-invalid={touched.area && !areaOk}
                  />
                  {touched.area && !areaOk && <em>Informe a metragem em números.</em>}
                </label>

                <label className="bwa-contact-field">
                  <span>Objetivo da reforma</span>
                  <select value={objetivo} onChange={(e) => setObjetivo(e.target.value)}>
                    <option value="">Selecione</option>
                    {OBJETIVOS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="bwa-contact-field bwa-contact-field--full">
                  <span>Detalhes (opcional)</span>
                  <textarea
                    rows={4}
                    value={mensagem}
                    maxLength={1200}
                    placeholder="Conte o estado do imóvel, prazo desejado e o que não pode faltar."
                    onChange={(e) => setMensagem(e.target.value)}
                  />
                </label>

                {erro && (
                  <p className="bwa-contact-form-error" role="alert">
                    {erro}
                  </p>
                )}

                <div className="bwa-contact-form-actions">
                  <button
                    className="bwa-button"
                    type="submit"
                    data-cta="orcamento-enviar"
                    disabled={!podeEnviar}
                  >
                    {enviando ? "Enviando…" : "Pedir orçamento"}
                    <span aria-hidden="true">→</span>
                  </button>
                  <p>Seus dados são usados apenas para responder ao seu pedido de orçamento.</p>
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
