// Página /mapa — endereço e mapa do escritório da Bewild (Brooklin, São Paulo).
// Objetivo de SEO local: uma URL própria com o endereço, o mapa embutido do
// Google Maps e os horários de atendimento, para o Google associar o negócio
// ao endereço e exibir em buscas por localização.
import { useEffect, useState } from "react";
import BwaFooter from "@/components/BwaFooter";
import BwaNav from "@/components/BwaNav";
import { CONTACT, whatsappHref } from "@/components/landing/content";
import { isConsentAccepted, onConsentChange } from "@/lib/cookieConsent";
import { routes } from "@/lib/useHashRoute";
import { breadcrumbJsonLd, useSeo } from "@/lib/useSeo";
import { useSiteSettings } from "@/lib/useSiteSettings";
import "./mapa.css";

const ADDRESS = "Rua Pitú, 72, Sala 115, Brooklin, São Paulo-SP";
const MAP_QUERY = encodeURIComponent(ADDRESS);
const MAP_EMBED_URL = `https://www.google.com/maps?q=${MAP_QUERY}&output=embed`;
const MAP_LINK = `https://www.google.com/maps/search/?api=1&query=${MAP_QUERY}`;
const MAP_ROUTE_LINK = `https://www.google.com/maps/dir/?api=1&destination=${MAP_QUERY}`;

/**
 * Mapa do escritório. O embed do Google Maps grava cookies do Google, então
 * só carrega com o consentimento aceito — ou quando o visitante pede
 * (mesmo comportamento da página de contato).
 */
function MapaEscritorio() {
  const [consentido, setConsentido] = useState(isConsentAccepted);
  const [pedido, setPedido] = useState(false);

  useEffect(() => onConsentChange((v) => setConsentido(v === "accepted")), []);

  if (consentido || pedido) {
    return (
      <iframe
        className="bwa-mapa-embed"
        title="Mapa do escritório da Bewild — Rua Pitú, 72, Brooklin, São Paulo"
        src={MAP_EMBED_URL}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    );
  }

  return (
    <div className="bwa-mapa-embed-placeholder">
      <p className="bwa-label">Mapa · Brooklin</p>
      <p>
        O mapa vem do Google Maps, que grava cookies próprios. Por isso ele só carrega se você
        pedir.
      </p>
      <div className="bwa-mapa-embed-actions">
        <button type="button" className="bwa-button" onClick={() => setPedido(true)}>
          Carregar mapa
        </button>
        <a className="bwa-mapa-link" href={MAP_LINK} target="_blank" rel="noopener noreferrer">
          Abrir no Google Maps <span aria-hidden="true">↗</span>
        </a>
      </div>
    </div>
  );
}

export default function MapaPage() {
  const { settings } = useSiteSettings();
  const email = settings?.contact_email || CONTACT.email;

  useSeo({
    title: "Mapa e endereço: R. Pitu, 72, Brooklin, São Paulo | Bewild",
    description:
      "Como chegar ao escritório da Bewild: Rua Pitú, 72, Sala 115, Brooklin, São Paulo-SP. Mapa do Google Maps, horários (seg–sex 9h–19h, sáb 9h–17h) e rota pelo aplicativo.",
    canonicalPath: "/mapa",
    ogType: "website",
    jsonLd: settings
      ? [
          breadcrumbJsonLd(settings, [
            { name: "Início", path: "/" },
            { name: "Mapa e endereço", path: "/mapa" },
          ]),
        ]
      : undefined,
  });

  return (
    <div className="bwa-mapa-page">
      <BwaNav />

      <main id="main" tabIndex={-1}>
        <section className="bwa-mapa-intro">
          <div className="bwa-shell bwa-mapa-intro-grid">
            <div>
              <p className="bwa-label">Escritório · Brooklin, São Paulo</p>
              <h1>Como chegar ao escritório da Bewild.</h1>
            </div>
            <p className="bwa-mapa-lead">
              Estamos no Brooklin, em São Paulo. Atendimentos com hora marcada — e o mapa abaixo
              traça a rota até a nossa porta.
            </p>
          </div>
        </section>

        <section className="bwa-mapa-content" aria-label="Endereço, horários e mapa">
          <div className="bwa-shell bwa-mapa-grid">
            <div className="bwa-mapa-info">
              <article className="bwa-mapa-card">
                <span className="bwa-mapa-index">01</span>
                <div>
                  <p className="bwa-label">Endereço</p>
                  <h2>Rua Pitú, 72 — Brooklin</h2>
                  <address>
                    Rua Pitú, 72, Sala 115<br />
                    Brooklin · São Paulo-SP
                  </address>
                  <a
                    className="bwa-mapa-link"
                    href={MAP_ROUTE_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-cta="mapa-tracar-rota"
                  >
                    Traçar rota no Google Maps <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </article>

              <article className="bwa-mapa-card">
                <span className="bwa-mapa-index">02</span>
                <div>
                  <p className="bwa-label">Horário de atendimento</p>
                  <h2>Seg–sex 9h às 19h · Sáb 9h às 17h</h2>
                  <p>Visitas ao escritório com hora marcada.</p>
                </div>
              </article>

              <article className="bwa-mapa-card">
                <span className="bwa-mapa-index">03</span>
                <div>
                  <p className="bwa-label">Fale com a gente</p>
                  <h2>Antes de vir, chame no WhatsApp.</h2>
                  <p>
                    Confirme horário e disponibilidade da equipe pelo WhatsApp ou pelo formulário de
                    contato.
                  </p>
                  <a
                    className="bwa-mapa-link"
                    href={whatsappHref("Olá, quero agendar uma visita ao escritório da Bewild")}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Falar no WhatsApp <span aria-hidden="true">↗</span>
                  </a>
                  <a className="bwa-mapa-link bwa-mapa-link--sec" href={routes.contato}>
                    Ir para a página de contato <span aria-hidden="true">→</span>
                  </a>
                </div>
              </article>
            </div>

            <div className="bwa-mapa-map-wrap">
              <MapaEscritorio />
            </div>
          </div>
        </section>
      </main>

      <BwaFooter />
    </div>
  );
}
