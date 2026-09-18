import BwaFooter from "@/components/BwaFooter";
import BwaNav from "@/components/BwaNav";
import { CONTACT, whatsappHref } from "@/components/landing/content";
import { breadcrumbJsonLd, useSeo } from "@/lib/useSeo";
import { useSiteSettings } from "@/lib/useSiteSettings";
import "./contato.css";

const ADDRESS = "Rua Pitú, 72, Sala 115, Vila Olímpia, São Paulo-SP";
const MAP_QUERY = encodeURIComponent(ADDRESS);
const MAP_EMBED_URL = `https://www.google.com/maps?q=${MAP_QUERY}&output=embed`;
const MAP_LINK = `https://www.google.com/maps/search/?api=1&query=${MAP_QUERY}`;

export default function ContatoPage() {
  const { settings } = useSiteSettings();
  const email = settings?.contact_email || CONTACT.email;

  useSeo({
    title: "Contato | Bewild — Arquitetura e reforma em São Paulo",
    description:
      "Fale com a Bewild por WhatsApp ou e-mail e encontre nosso escritório na Vila Olímpia, em São Paulo-SP.",
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
      </main>

      <BwaFooter />
    </div>
  );
}