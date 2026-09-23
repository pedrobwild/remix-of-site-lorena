import BwaFooter from "@/components/BwaFooter";
import BwaImprensa from "@/components/BwaImprensa";
import BwaNav from "@/components/BwaNav";
import { whatsappHref } from "@/components/landing/content";
import { BAIRROS, REMOTO_ITEMS } from "@/lib/bairrosSp";
import { breadcrumbJsonLd, useSeo } from "@/lib/useSeo";
import { useSiteSettings } from "@/lib/useSiteSettings";
import "./onde-atuamos.css";

/* ============================================================
 * OndeAtuamosPage — /onde-atuamos
 * Página institucional de área de atuação, na linguagem visual
 * da home (.bwa). Sem "páginas de cidade" artificiais: São Paulo
 * capital é a área de obra (bairros reais do portfólio) e a
 * reforma à distância atende clientes de outras cidades.
 * ============================================================ */

export default function OndeAtuamosPage() {
  const { settings } = useSiteSettings();

  useSeo({
    title: "Onde atuamos: arquitetura e reforma em São Paulo | Bewild",
    description:
      "Procura arquitetura, engenharia e reforma de apartamento em SP? A Bewild projeta e reforma apartamentos em São Paulo capital, em mais de 27 bairros, e atende à distância clientes de outras cidades.",
    canonicalPath: "/onde-atuamos",
    ogType: "website",
    jsonLd: settings
      ? [
          breadcrumbJsonLd(settings, [
            { name: "Início", path: "/" },
            { name: "Onde atuamos", path: "/onde-atuamos" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "Service",
            name: "Reforma completa de studios e apartamentos",
            provider: { "@type": "Organization", name: "Bewild", url: "https://bewild.com.br" },
            areaServed: { "@type": "City", name: "São Paulo" },
          },
        ]
      : undefined,
  });

  return (
    <div className="bwa-atuamos">
      <BwaNav />

      <main id="main" tabIndex={-1}>
        <section className="bwa-atuamos-intro">
          <div className="bwa-shell bwa-faq-head bwa-atuamos-head">
            <p className="bwa-label">Onde atuamos</p>
            <div>
              <h1 className="bwa-title">
                Reformamos em São Paulo. <em>Você mora onde quiser.</em>
              </h1>
              <p className="bwa-atuamos-lead">
                As obras da Bewild acontecem em São Paulo capital — são mais de
                160 reformas entregues em mais de 27 bairros. E você não precisa
                estar na cidade: clientes de Uberlândia, Salvador, Curitiba e
                Brasília acompanham tudo à distância, do projeto à entrega das
                chaves.
              </p>
            </div>
          </div>

          <div className="bwa-shell">
            <h2 className="bwa-atuamos-h2">Bairros com obras entregues</h2>
            <ul className="bwa-atuamos-bairros">
              {BAIRROS.map((b) => (
                <li key={b}>
                  <a href="/portfolio">{b}</a>
                </li>
              ))}
            </ul>
            <p className="bwa-atuamos-note">
              Seu bairro não está na lista? Sem problema — atendemos São Paulo
              capital inteira.
            </p>
          </div>
        </section>

        <section className="bwa-atuamos-remoto" aria-label="Reforma à distância">
          <div className="bwa-shell bwa-atuamos-remoto-head">
            <p className="bwa-label">Reforma à distância</p>
            <div>
              <p className="bwa-atuamos-remoto-lead">
                Quem mora em Uberlândia, Salvador, Curitiba ou Brasília compra,
                reforma e recebe o apartamento pronto sem vir a São Paulo: o
                acompanhamento é todo pelo Bwild Workflow.
              </p>
            </div>
          </div>
          <div className="bwa-shell">
            <ul className="bwa-atuamos-remoto-list">
              {REMOTO_ITEMS.map((item) => (
                <li key={item.n}>
                  <span className="bwa-atuamos-remoto-num">{item.n}</span>
                  <span>{item.t}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <BwaImprensa />

        <section className="bwa-atuamos-cta" aria-label="Solicitar orçamento">
          <div className="bwa-shell bwa-atuamos-cta-grid">
            <h2>
              Seu imóvel é em São Paulo? <em>O resto é com a gente.</em>
            </h2>
            <div className="bwa-atuamos-cta-actions">
              <a className="bwa-button bwa-button-light" href="/orcamento" data-cta="atuamos-cta">
                Solicitar orçamento <span aria-hidden="true">→</span>
              </a>
              <a
                className="bwa-atuamos-whats"
                href={whatsappHref()}
                target="_blank"
                rel="noopener noreferrer"
              >
                Falar no WhatsApp <span aria-hidden="true">→</span>
              </a>
              <p className="bwa-atuamos-cta-note">+160 reformas entregues · +200 projetos</p>
            </div>
          </div>
        </section>
      </main>

      <BwaFooter />
    </div>
  );
}
