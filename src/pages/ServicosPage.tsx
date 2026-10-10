import { useEffect, useRef } from "react";
import BwaFooter from "@/components/BwaFooter";
import BwaNav from "@/components/BwaNav";
import { whatsappHref } from "@/components/landing/content";
import { useSeo } from "@/lib/useSeo";
import { useSiteSettings } from "@/lib/useSiteSettings";
import { useCtaClickTracking } from "@/lib/trackCta";
import { installBastidores } from "@/lib/homeBastidores";
import { installInstagramEmbeds } from "@/lib/homeInstagram";
import { installTour3d, installTour3dCovers } from "@/lib/homeTour3d";
import { installSectionSpy } from "@/lib/sectionSpy";
import { bastidoresJsonLd, parseBastidoresPosts } from "@/lib/bastidoresJsonLd";
import { BAIRROS_ATENDIDOS, PROJETOS, REFORMAS_ENTREGUES } from "@/content/provas";
import { initBwaGallery } from "./home-bwa-script";
import { BASTIDORES_HTML, GALERIA_HTML, SERVICOS_SVG_LIBRARY, TOUR3D_HTML } from "./servicos-bwa-sections";
import "./servico-reforma.css";
import "./servicos.css";
import { CANONICAL, DESCRIPTION, SERVICOS, FAQ } from "@/content/pages/servicos";

/* ============================================================
 * ServicosPage — /servicos
 * Página própria (canonical próprio, indexável) que reúne tudo o
 * que a Bewild entrega e aponta para cada página de serviço.
 * O conteúdo espelha a seção "Serviços" da home e as páginas de
 * serviço — sem números ou promessas novas (números só de provas.ts).
 *
 * Desde 10/10/2026 a página também hospeda três blocos que ficavam na
 * home (pedido do Pedro): Bastidores (time em obra, Instagram), galeria
 * "Atmosferas Bewild" e Tour virtual 3D — HTML em servicos-bwa-sections.ts,
 * comportamento nos mesmos instaladores da home. A ordem alterna texto e
 * prova: o que fazemos → quem faz (Bastidores) → arquitetura → o projeto
 * em 3D → engenharia → o resultado (galeria) → perguntas → orçamento.
 * ============================================================ */

// Link interno SEM utm_* (ver ReformaStudioSpPage): o clique é medido por
// useCtaClickTracking (data-cta) e a campanha de origem segue na navegação.
const CTA_HREF = "/orcamento";

const TITLE = "Serviços de arquitetura, reforma e marcenaria em SP | Bewild";

const BASTIDORES_POSTS = parseBastidoresPosts();

/** Atalhos para os blocos da página, na ordem em que aparecem. */
const NAV: { href: string; label: string }[] = [
  { href: "#o-que-fazemos", label: "O que fazemos" },
  { href: "#bastidores", label: "Time em obra" },
  { href: "#arquitetura", label: "Arquitetura" },
  { href: "#tour-3d", label: "Tour 3D" },
  { href: "#engenharia", label: "Engenharia e gestão" },
  { href: "#galeria", label: "Galeria" },
  { href: "#faq", label: "Perguntas" },
];

/** Provas numéricas (fonte única: src/content/provas.ts) e garantia contratual. */
const PROVAS: { valor: string; rotulo: string }[] = [
  { valor: `+${REFORMAS_ENTREGUES}`, rotulo: "obras entregues" },
  { valor: `+${PROJETOS}`, rotulo: "projetos" },
  { valor: `+${BAIRROS_ATENDIDOS}`, rotulo: "bairros de São Paulo" },
  { valor: "5 anos", rotulo: "de garantia em contrato" },
];

/**
 * Imagem de cada serviço: só material já usado no site (galeria "Atmosferas"
 * e card "Para morar" da home), com o mesmo texto alternativo.
 */
const SERVICO_IMAGEM: Record<string, { nome: string; alt: string }> = {
  "/reforma-de-apartamento-sao-paulo": {
    nome: "rodrigo-1",
    alt: "Sala de jantar integrada reformada pela Bewild para moradia, com mesa de madeira maciça, parede de pedra e marcenaria iluminada",
  },
  "/reforma-de-studio-sao-paulo": {
    nome: "quarto-remos",
    alt: "Quarto com parede de tijolos claros, remos decorativos, roupa de cama branca e guarda-roupa azul-marinho",
  },
  "/reforma-de-cobertura-sao-paulo": {
    nome: "varanda-barril",
    alt: "Studio com poltronas de couro caramelo, barril de madeira, parede de tijolinhos e varanda envidraçada",
  },
  "/marcenaria": {
    nome: "cozinha-verde",
    alt: "Cozinha compacta com marcenaria verde, geladeira inox, micro-ondas e azulejo branco",
  },
};

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

/**
 * `src` é só o fallback JPEG (navegador sem srcset); `rodrigo-1` não tem o
 * recorte `-md.jpg` em public/images/hero-slides, só o `-lg.jpg`.
 */
function imagem(nome: string) {
  const base = `/images/hero-slides/${nome}`;
  return {
    src: nome === "rodrigo-1" ? `${base}-lg.jpg` : `${base}-md.jpg`,
    srcSet: `${base}-sm.webp 640w, ${base}-md.webp 1280w`,
  };
}

function ItensGrid({ itens, tom }: { itens: typeof ARQUITETURA; tom: "claro" | "escuro" }) {
  return (
    <ol className={`bwa-svcs-itens bwa-svcs-itens--${tom}`}>
      {itens.map((item) => (
        <li key={item.n}>
          <span className="bwa-svcs-item-num" aria-hidden="true">
            {item.n}
          </span>
          <h3>{item.titulo}</h3>
          <p>{item.t}</p>
        </li>
      ))}
    </ol>
  );
}

export default function ServicosPage() {
  useCtaClickTracking("servicos");
  const mainRef = useRef<HTMLElement>(null);

  // Título e descrição dos 6 posts dos Bastidores editáveis em /admin/seo.
  const { settings } = useSiteSettings();
  useSeo({
    title: TITLE,
    description: DESCRIPTION,
    canonicalPath: CANONICAL,
    ogType: "website",
    jsonLd: bastidoresJsonLd(BASTIDORES_POSTS, settings?.bastidores_seo ?? {}),
  });

  // Comportamento dos blocos vindos da home, restrito ao <main> desta página
  // (cada instalador devolve a própria limpeza; ver HomePage.tsx).
  useEffect(() => {
    const root = mainRef.current;
    if (!root) return;
    const cleanups = [
      installInstagramEmbeds(root),
      installBastidores(root),
      initBwaGallery(root),
      installTour3d(root),
      installTour3dCovers(root),
      // Atalhos "Nesta página" acompanham a rolagem (cabeçalho 69 + fila 61).
      installSectionSpy(root, { links: ".bwa-svcs-nav a[href^='#']", offset: 140 }),
    ];
    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);

  const hero = imagem("erik-03-11");

  return (
    <div className="bwa-servico bwa-servicos">
      <BwaNav />
      <div dangerouslySetInnerHTML={{ __html: SERVICOS_SVG_LIBRARY }} />

      <main id="main" tabIndex={-1} ref={mainRef}>
        <section className="bwa-servico-intro bwa-svcs-hero" aria-labelledby="servicos-titulo">
          <div className="bwa-shell bwa-svcs-hero-grid">
            <div className="bwa-svcs-hero-copy">
              <p className="bwa-label bwa-label-accent">Serviços</p>
              <h1 className="bwa-title" id="servicos-titulo">
                Arquitetura, engenharia e obra sob a mesma responsabilidade.{" "}
                <em>Um contrato, com preço, prazo e garantia por escrito.</em>
              </h1>
              <p className="bwa-servico-lead">
                A Bewild reforma apartamentos, studios e coberturas em São
                Paulo, do projeto à entrega das chaves. Cada item abaixo fica
                registrado em contrato antes de a obra começar: uma
                responsabilidade só, para morar, alugar ou vender.
              </p>
              <div className="bwa-svcs-hero-actions">
                <a className="bwa-button" href={CTA_HREF} data-cta="servicos-hero-orcamento">
                  Solicitar orçamento <span aria-hidden="true">→</span>
                </a>
                <a className="bwa-svcs-hero-secondary" href="/portfolio">
                  Visitar portfólio completo <span aria-hidden="true">→</span>
                </a>
              </div>
            </div>
            <figure className="bwa-svcs-hero-media">
              <img
                src={hero.src}
                srcSet={hero.srcSet}
                sizes="(max-width: 999px) 100vw, 46vw"
                width={1280}
                height={720}
                alt="Studio com parede de tijolos, estante com bicicleta e cama com almofadas, projeto Bewild"
                decoding="async"
                fetchPriority="high"
              />
            </figure>
          </div>
          <div className="bwa-shell">
            <dl className="bwa-svcs-provas" aria-label="Bewild em números">
              {PROVAS.map((p) => (
                <div key={p.rotulo}>
                  <dt>{p.valor}</dt>
                  <dd>{p.rotulo}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <nav className="bwa-svcs-nav" aria-label="Nesta página">
          <div className="bwa-shell">
            <ul>
              {NAV.map((n) => (
                <li key={n.href}>
                  <a href={n.href}>{n.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <section className="bwa-servico-block bwa-svcs-block" aria-labelledby="o-que-fazemos-titulo" id="o-que-fazemos">
          <div className="bwa-shell">
            <div className="bwa-svcs-block-head">
              <p className="bwa-label bwa-label-accent">Serviços</p>
              <h2 className="bwa-servico-h2 bwa-svcs-h2" id="o-que-fazemos-titulo">
                O que fazemos
              </h2>
            </div>
            <ul className="bwa-svcs-cards">
              {SERVICOS.map((s) => {
                const img = SERVICO_IMAGEM[s.path];
                const src = img ? imagem(img.nome) : null;
                return (
                  <li key={s.path}>
                    <a className="bwa-svcs-card" href={s.path} data-cta={`servicos-card-${s.path.replace(/^\//, "")}`}>
                      {src && img ? (
                        <figure className="bwa-svcs-card-media">
                          <img
                            src={src.src}
                            srcSet={src.srcSet}
                            sizes="(max-width: 799px) 100vw, (max-width: 1179px) 50vw, 25vw"
                            width={1280}
                            height={860}
                            alt={img.alt}
                            loading="lazy"
                            decoding="async"
                          />
                        </figure>
                      ) : null}
                      <div className="bwa-svcs-card-body">
                        <h3>{s.nome}</h3>
                        <p>{s.texto}</p>
                        <span className="bwa-svcs-card-link">
                          Ver a página do serviço <span aria-hidden="true">→</span>
                        </span>
                      </div>
                    </a>
                  </li>
                );
              })}
            </ul>
            <p className="bwa-servico-text bwa-svcs-after">
              Veja obras entregues no <a href="/portfolio">portfólio</a> e o
              passo a passo em <a href="/como-funciona">como funciona</a>.
            </p>
          </div>
        </section>

        {/* Bastidores: quem faz a obra, em vídeos do Instagram (vindo da home). */}
        <div dangerouslySetInnerHTML={{ __html: BASTIDORES_HTML }} />

        <section className="bwa-servico-block bwa-svcs-block" aria-labelledby="arquitetura-titulo" id="arquitetura">
          <div className="bwa-shell">
            <div className="bwa-svcs-block-head">
              <p className="bwa-label bwa-label-accent">Disciplina 01</p>
              <h2 className="bwa-servico-h2 bwa-svcs-h2" id="arquitetura-titulo">
                Arquitetura: o apartamento é decidido no papel, antes de virar obra
              </h2>
            </div>
            <ItensGrid itens={ARQUITETURA} tom="claro" />
          </div>
        </section>

        {/* Tour virtual 3D: o projeto aprovado, em três cômodos (vindo da home). */}
        <div dangerouslySetInnerHTML={{ __html: TOUR3D_HTML }} />

        <section className="bwa-servico-block bwa-svcs-block bwa-svcs-block--deep" aria-labelledby="engenharia-titulo" id="engenharia">
          <div className="bwa-shell">
            <div className="bwa-svcs-block-head">
              <p className="bwa-label bwa-label-accent">Disciplina 02</p>
              <h2 className="bwa-servico-h2 bwa-svcs-h2" id="engenharia-titulo">
                Engenharia e gestão: preço, prazo e garantia assinados antes do
                primeiro dia
              </h2>
            </div>
            <ItensGrid itens={ENGENHARIA} tom="claro" />
          </div>
        </section>

        {/* Galeria "Atmosferas Bewild": o resultado (vindo da home). */}
        <div dangerouslySetInnerHTML={{ __html: GALERIA_HTML }} />

        <section className="bwa-servico-block bwa-svcs-block" aria-labelledby="faq-titulo" id="faq">
          <div className="bwa-shell bwa-svcs-faq-grid">
            <div className="bwa-svcs-block-head">
              <p className="bwa-label bwa-label-accent">FAQ</p>
              <h2 className="bwa-servico-h2 bwa-svcs-h2" id="faq-titulo">
                Perguntas frequentes
              </h2>
              <p className="bwa-servico-text">
                Não encontrou sua resposta?{" "}
                <a href={whatsappHref()} target="_blank" rel="noopener noreferrer">
                  Vamos conversar
                </a>
                .
              </p>
            </div>
            <div className="bwa-servico-faq bwa-svcs-faq">
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
