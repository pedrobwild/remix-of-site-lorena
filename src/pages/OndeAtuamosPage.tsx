import BwaFooter from "@/components/BwaFooter";
import BwaNav from "@/components/BwaNav";
import { whatsappHref } from "@/components/landing/content";
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

// Bairros reais com projetos publicados no portfólio (consulta ao banco
// em set/2026). "São Paulo" genérico e grafias duplicadas ficam de fora.
const BAIRROS: string[] = [
  "Alto da Boa Vista",
  "Avenida Paulista",
  "Barra Funda",
  "Bela Vista",
  "Brooklin",
  "Butantã",
  "Campo Belo",
  "Cerqueira César",
  "Chácara Klabin",
  "Cidade Jardim",
  "Consolação",
  "Higienópolis",
  "Ibirapuera",
  "Indianópolis",
  "Ipiranga",
  "Itaim Bibi",
  "Jardim Paulista",
  "Liberdade",
  "Moema",
  "Paraíso",
  "Perdizes",
  "Pinheiros",
  "República",
  "Santo Amaro",
  "Vila Buarque",
  "Vila Clementino",
  "Vila Madalena",
  "Vila Mariana",
  "Vila Nova Conceição",
  "Vila Olímpia",
];

const REMOTO_ITEMS: { n: string; t: string }[] = [
  { n: "01", t: "Vistoria por procuração" },
  { n: "02", t: "Ligação de energia" },
  { n: "03", t: "Prevenção de vícios de obra" },
  { n: "04", t: "Atendimento de emergências" },
  { n: "05", t: "Instalação de internet" },
  { n: "06", t: "Visibilidade total pelo Bwild Workflow" },
];

export default function OndeAtuamosPage() {
  const { settings } = useSiteSettings();

  useSeo({
    title: "Onde atuamos: reforma de apartamentos em São Paulo | Bewild",
    description:
      "A Bewild reforma studios e apartamentos em São Paulo capital, com obras entregues em mais de 27 bairros, e acompanha clientes de outras cidades com a reforma à distância.",
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

        <section className="bwa-atuamos-remoto" aria-labelledby="remoto-title">
          <div className="bwa-shell bwa-atuamos-remoto-head">
            <p className="bwa-label">Reforma à distância</p>
            <div>
              <h2 className="bwa-title" id="remoto-title">
                Você não precisa estar em São Paulo para reformar com a Bewild.
              </h2>
              <p className="bwa-atuamos-remoto-lead">
                Quem mora em Uberlândia, Salvador, Curitiba ou Brasília compra,
                reforma e recebe o apartamento pronto sem vir a São Paulo: o
                acompanhamento é todo pelo Bwild Workflow.
              </p>
            </div>
          </div>
          <div className="bwa-shell">
            <h3 className="bwa-atuamos-h3">Já incluso no contrato</h3>
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

        <section className="bwa-atuamos-cta" aria-label="Solicitar orçamento">
          <div className="bwa-shell bwa-atuamos-cta-grid">
            <h2>
              Seu imóvel é em São Paulo? <em>O resto é com a gente.</em>
            </h2>
            <div className="bwa-atuamos-cta-actions">
              <a className="bwa-button bwa-button-light" href="/diagnostico" data-cta="atuamos-cta">
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
