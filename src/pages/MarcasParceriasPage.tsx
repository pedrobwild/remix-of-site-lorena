import BwaFooter from "@/components/BwaFooter";
import BwaNav from "@/components/BwaNav";
import BewildLealMoreiraLogos from "@/components/BewildLealMoreiraLogos";
import { breadcrumbJsonLd, useSeo } from "@/lib/useSeo";
import { useSiteSettings } from "@/lib/useSiteSettings";
import "./marcas-parcerias.css";

const MIDIA = [
  {
    veiculo: "Record News · Inovação e Negócios",
    titulo: "Thiago Dantas fala sobre as estratégias para transformar imóveis em ativos de renda",
    imagem: "/images/imprensa/record-news-thiago.jpg",
    alt: "Entrevista de Thiago Dantas no programa Inovação e Negócios da Record News",
    url: "https://noticias.r7.com/record-news/inovacao-e-negocios/video/a-dor-de-cabeca-de-fazer-a-obra-trava-muitos-investidores-diz-o-arquiteto-thiago-dantas-14092026/",
    cta: "Assistir na Record News",
  },
  {
    veiculo: "All Around Worlds · Global Business Icons 2026",
    titulo: "Pedro Henrique Alves entre os 27 Global Business Icons de 2026",
    imagem: "/images/imprensa/allaroundworlds-pedro.webp",
    alt: "Pedro Henrique Alves na lista Global Business Icons 2026 da All Around Worlds",
    url: "https://www.allaroundworlds.com/top-list/global-business-icons-2026/pedro-henrique-alves/",
    cta: "Ler a matéria completa",
  },
];

export default function MarcasParceriasPage() {
  const { settings } = useSiteSettings();

  useSeo({
    title: "Marcas, parcerias e Bewild na mídia | Bewild",
    description:
      "Conheça as parcerias institucionais da Bewild e as matérias publicadas sobre arquitetura, reforma e imóveis como ativos de renda.",
    canonicalPath: "/marcas-e-parcerias",
    ogType: "website",
    jsonLd: settings
      ? breadcrumbJsonLd(settings, [
          { name: "Início", path: "/" },
          { name: "Marcas e parcerias", path: "/marcas-e-parcerias" },
        ])
      : undefined,
  });

  return (
    <div className="bwa-marcas-page">
      <BwaNav />
      <main id="main" tabIndex={-1}>
        <section className="bwa-marcas-hero">
          <div className="bwa-shell bwa-marcas-hero-grid">
            <p className="bwa-label">Marcas e parcerias</p>
            <div>
              <h1>Relações que ampliam o que entregamos.</h1>
              <p className="bwa-marcas-hero-copy">
                Parcerias comerciais e reconhecimento editorial que conectam a Bewild ao mercado imobiliário, à arquitetura e aos investidores.
              </p>
            </div>
          </div>
        </section>

        <section className="bwa-marcas-section" aria-labelledby="midia-title">
          <div className="bwa-shell">
            <div className="bwa-marcas-heading">
              <p className="bwa-label">01 · Na mídia</p>
              <h2 id="midia-title">Conversas sobre obra, investimento e ativos de renda.</h2>
            </div>
            <div className="bwa-marcas-media-grid">
              {MIDIA.map((item) => (
                <a
                  className="bwa-marcas-media-card"
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  key={item.url}
                >
                  <span className="bwa-marcas-media-image">
                    <img src={item.imagem} alt={item.alt} loading="lazy" />
                  </span>
                  <span className="bwa-marcas-media-body">
                    <span className="bwa-marcas-media-source">{item.veiculo}</span>
                    <h3>{item.titulo}</h3>
                    <span className="bwa-marcas-media-cta">{item.cta} <span aria-hidden="true">↗</span></span>
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="bwa-marcas-section bwa-marcas-section--navy" aria-labelledby="parcerias-title">
          <div className="bwa-shell">
            <div className="bwa-marcas-heading">
              <p className="bwa-label">02 · Parcerias</p>
              <h2 id="parcerias-title">Do imóvel entregue ao imóvel pronto.</h2>
            </div>
            <article className="bwa-marcas-partner">
              <div>
                <p className="bwa-marcas-partner-meta">Parceria vigente</p>
                <BewildLealMoreiraLogos />
              </div>
              <div className="bwa-marcas-partner-copy">
                <p>
                  Programa de indicações em operação com a Leal Moreira, conectando compradores e investidores a uma entrega completa de projeto, obra, marcenaria e mobília.
                </p>
                <div className="bwa-marcas-partner-actions">
                  <a className="bwa-button bwa-button-light" href="/parceiros">
                    Conhecer o programa de parceiros <span aria-hidden="true">→</span>
                  </a>
                  <a className="bwa-marcas-text-link" href="/contato">
                    Falar com a Bewild <span aria-hidden="true">→</span>
                  </a>
                </div>
              </div>
            </article>
          </div>
        </section>
      </main>
      <BwaFooter />
    </div>
  );
}