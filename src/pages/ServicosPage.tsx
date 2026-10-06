import BwaFooter from "@/components/BwaFooter";
import BwaNav from "@/components/BwaNav";
import { whatsappHref } from "@/components/landing/content";
import { useSeo } from "@/lib/useSeo";
import { useCtaClickTracking } from "@/lib/trackCta";
import "./servico-reforma.css";
import { CANONICAL, DESCRIPTION, SERVICOS, FAQ } from "@/content/pages/servicos";

/* ============================================================
 * ServicosPage — /servicos
 * Página própria (canonical próprio, indexável) que reúne tudo o
 * que a Bewild entrega e aponta para cada página de serviço.
 * O conteúdo espelha a seção "Serviços" da home e as páginas de
 * serviço — sem números ou promessas novas.
 * ============================================================ */

// Link interno SEM utm_* (ver ReformaStudioSpPage): o clique é medido por
// useCtaClickTracking (data-cta) e a campanha de origem segue na navegação.
const CTA_HREF = "/orcamento";

const TITLE = "Serviços de arquitetura, reforma e marcenaria em SP | Bewild";
const ARQUITETURA: { n: string; titulo: string; t: string }[] = [
  {
    n: "01",
    titulo: "Consultoria",
    t: "Leitura do imóvel e do objetivo — morar, alugar ou vender — antes do primeiro traço.",
  },
  {
    n: "02",
    titulo: "Projeto 3D",
    t: "Maquete realista, com revisões até você aprovar. A obra só começa depois da sua aprovação.",
  },
  {
    n: "03",
    titulo: "Personalização",
    t: "Cores, materiais, layout e marcenaria definidos com o arquiteto, com marca e modelo declarados no orçamento.",
  },
  {
    n: "04",
    titulo: "Projeto executivo",
    t: "Plantas detalhadas, com cada material e acabamento especificado antes de a obra começar.",
  },
  {
    n: "05",
    titulo: "Documentação",
    t: "ART, CREA e liberação no condomínio por nossa conta.",
  },
  {
    n: "06",
    titulo: "Marcenaria própria",
    t: "Móveis planejados sob medida para espaços compactos, com mais de 40 modelos e cores.",
  },
];

const ENGENHARIA: { n: string; titulo: string; t: string }[] = [
  {
    n: "01",
    titulo: "Preço fechado",
    t: "O valor do contrato é o valor final. Aditivo só existe se você mudar o escopo, e só com a sua aprovação.",
  },
  {
    n: "02",
    titulo: "Prazo em contrato",
    t: "Você sabe a data de entrega na assinatura, com multa por dia de atraso prevista em contrato.",
  },
  {
    n: "03",
    titulo: "Engenheiro dedicado e equipe própria",
    t: "Obra, elétrica, vidraçaria e ar-condicionado com time da casa; um engenheiro responde por prazo, custo e qualidade.",
  },
  {
    n: "04",
    titulo: "Compra de material e mobília",
    t: "Compramos e conferimos o material e coordenamos fornecedores e entregas; mobília e eletros chegam instalados.",
  },
  {
    n: "05",
    titulo: "Bwild Workflow",
    t: "Cronograma por etapa, Curva S, fotos e relatório semanal no portal, de qualquer cidade.",
  },
  {
    n: "06",
    titulo: "Entrega verificada e garantia",
    t: "Vistoria com engenheiro, termo de finalização e 5 anos de garantia de obra e marcenaria.",
  },
];

export default function ServicosPage() {
  useCtaClickTracking("servicos");

  useSeo({
    title: TITLE,
    description: DESCRIPTION,
    canonicalPath: CANONICAL,
    ogType: "website",
  });

  return (
    <div className="bwa-servico">
      <BwaNav />

      <main id="main" tabIndex={-1}>
        <section className="bwa-servico-intro">
          <div className="bwa-shell bwa-servico-head">
            <p className="bwa-label">Serviços</p>
            <div>
              <h1 className="bwa-title">
                Arquitetura, engenharia e obra sob a mesma responsabilidade.{" "}
                <em>Um contrato, com preço, prazo e garantia por escrito.</em>
              </h1>
              <p className="bwa-servico-lead">
                A Bewild reforma apartamentos, studios e coberturas em São
                Paulo, do projeto à entrega das chaves. Cada item abaixo fica
                registrado em contrato antes de a obra começar: uma
                responsabilidade só, para morar, alugar ou vender.
              </p>
            </div>
          </div>
        </section>

        <section className="bwa-servico-block" aria-labelledby="o-que-fazemos">
          <div className="bwa-shell">
            <h2 className="bwa-servico-h2" id="o-que-fazemos">
              O que fazemos
            </h2>
            <ul className="bwa-servico-cards">
              {SERVICOS.map((s) => (
                <li key={s.path}>
                  <h3>{s.nome}</h3>
                  <p>
                    {s.texto} <a href={s.path}>Ver a página do serviço</a>.
                  </p>
                </li>
              ))}
            </ul>
            <p className="bwa-servico-text" style={{ marginTop: 24 }}>
              Veja obras entregues no <a href="/portfolio">portfólio</a> e o
              passo a passo em <a href="/como-funciona">como funciona</a>.
            </p>
          </div>
        </section>

        <section className="bwa-servico-block" aria-labelledby="arquitetura">
          <div className="bwa-shell">
            <h2 className="bwa-servico-h2" id="arquitetura">
              Arquitetura: o apartamento é decidido no papel, antes de virar obra
            </h2>
            <ul className="bwa-servico-list">
              {ARQUITETURA.map((item) => (
                <li key={item.n}>
                  <span className="bwa-servico-num">{item.n}</span>
                  <span>
                    <strong>{item.titulo}.</strong> {item.t}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bwa-servico-block" aria-labelledby="engenharia">
          <div className="bwa-shell">
            <h2 className="bwa-servico-h2" id="engenharia">
              Engenharia e gestão: preço, prazo e garantia assinados antes do
              primeiro dia
            </h2>
            <ul className="bwa-servico-list">
              {ENGENHARIA.map((item) => (
                <li key={item.n}>
                  <span className="bwa-servico-num">{item.n}</span>
                  <span>
                    <strong>{item.titulo}.</strong> {item.t}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bwa-servico-block" aria-labelledby="faq">
          <div className="bwa-shell">
            <h2 className="bwa-servico-h2" id="faq">
              Perguntas frequentes
            </h2>
            <div className="bwa-servico-faq">
              {FAQ.map((item) => (
                <details key={item.q}>
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="bwa-servico-cta" aria-label="Solicitar orçamento">
          <div className="bwa-shell bwa-servico-cta-grid">
            <h2>
              Conte sobre o seu imóvel. <em>O resto é com a gente.</em>
            </h2>
            <div className="bwa-servico-cta-actions">
              <a
                className="bwa-button bwa-button-light"
                href={CTA_HREF}
                data-cta="servico-servicos"
              >
                Solicitar orçamento <span aria-hidden="true">→</span>
              </a>
              <a
                className="bwa-servico-whats"
                href={whatsappHref()}
                target="_blank"
                rel="noopener noreferrer"
              >
                Falar no WhatsApp <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      <BwaFooter />
    </div>
  );
}
