import { useEffect, useState } from "react";
import BwaFooter from "@/components/BwaFooter";
import BwaImprensa from "@/components/BwaImprensa";
import BwaNav from "@/components/BwaNav";
import { whatsappHref } from "@/components/landing/content";
import {
  CATALOG_ROOMS,
  catalogRoomUrl,
  catalogThumbnailUrl,
  fetchCatalogItems,
  CATALOG_FULL_URL,
  type CatalogItem,
} from "@/lib/homeCatalog";
import { breadcrumbJsonLd, faqJsonLd, useSeo } from "@/lib/useSeo";
import { useSiteSettings } from "@/lib/useSiteSettings";
import "./servico-reforma.css";
import "./marcenaria.css";

/* ============================================================
 * MarcenariaPage — /marcenaria
 * Página real do serviço de marcenaria sob medida: materiais,
 * ferragens, ambientes (fotos do Catálogo Bewild) e garantia.
 * ============================================================ */

const CANONICAL = "/marcenaria";
const CTA_HREF =
  "/diagnostico?utm_source=site&utm_medium=servico&utm_campaign=marcenaria-sp";

const ESPECIFICACOES: { n: string; t: string }[] = [
  { n: "01", t: "MDF de procedência certificada, com garantia de fábrica" },
  { n: "02", t: "Estruturas em 25 mm — nada de chapas finas que empenam" },
  { n: "03", t: "Prateleiras e aéreos reforçados em 36 mm" },
  { n: "04", t: "Ferragens FGVTN com amortecimento em portas e gavetas" },
  { n: "05", t: "Mais de 40 modelos e cores para escolher no catálogo" },
  { n: "06", t: "5 anos de garantia, com assistência da própria Bewild" },
];

const PASSOS: { n: string; t: string }[] = [
  { n: "01", t: "Medição do imóvel junto com o projeto de arquitetura" },
  { n: "02", t: "Desenho de cada peça no projeto executivo e aprovação em 3D" },
  { n: "03", t: "Escolha de modelos, cores e ferragens no Catálogo Bewild" },
  { n: "04", t: "Produção na fábrica própria, no cronograma da obra" },
  { n: "05", t: "Instalação pela equipe da casa, depois dos acabamentos" },
  { n: "06", t: "Vistoria de engenheiro, regulagem e entrega das chaves" },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "A marcenaria é feita pela própria Bewild?",
    a: "Sim. A marcenaria é desenhada no nosso projeto executivo e produzida em fábrica própria, o que mantém prazo, preço e responsabilidade no mesmo contrato da obra.",
  },
  {
    q: "Quais materiais e ferragens vocês usam?",
    a: "MDF de procedência certificada, estruturas em 25 mm, prateleiras e aéreos reforçados em 36 mm e ferragens FGVTN com amortecimento em portas e gavetas.",
  },
  {
    q: "Posso contratar só a marcenaria, sem a reforma?",
    a: "Nosso contrato padrão é a reforma completa, com projeto, obra, marcenaria e mobília juntos. Casos de marcenaria isolada são avaliados um a um — fale com a gente no WhatsApp.",
  },
  {
    q: "Quantos modelos e cores posso escolher?",
    a: "Mais de 40 combinações de modelos e cores, todas no Catálogo Bewild, organizadas por ambiente: sala, cozinha, dormitório, banheiros e armários abertos.",
  },
  {
    q: "Qual é a garantia da marcenaria?",
    a: "5 anos, com assistência prestada pela própria Bewild — o mesmo prazo de garantia da reforma.",
  },
  {
    q: "Quanto tempo leva para ficar pronta?",
    a: "A produção acontece em paralelo à obra e a instalação entra depois dos acabamentos, dentro do prazo de entrega que está no seu contrato.",
  },
];

function RoomGallery() {
  const [room, setRoom] = useState<string>(CATALOG_ROOMS[0].slug);
  const [items, setItems] = useState<CatalogItem[] | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let vivo = true;
    setItems(null);
    setErro(false);
    fetchCatalogItems(room, 6)
      .then((r) => {
        if (vivo) setItems(r);
      })
      .catch(() => {
        if (vivo) setErro(true);
      });
    return () => {
      vivo = false;
    };
  }, [room]);

  const label = CATALOG_ROOMS.find((r) => r.slug === room)?.label ?? "";

  return (
    <>
      <ul className="bwa-marc-rooms">
        {CATALOG_ROOMS.map((r) => (
          <li key={r.slug}>
            <button
              type="button"
              className="bwa-marc-room"
              aria-pressed={r.slug === room}
              onClick={() => setRoom(r.slug)}
            >
              {r.label}
            </button>
          </li>
        ))}
      </ul>

      {erro && (
        <p className="bwa-servico-text">
          Não conseguimos carregar as fotos agora. Veja tudo no{" "}
          <a href={CATALOG_FULL_URL} target="_blank" rel="noopener noreferrer">
            Catálogo Bewild
          </a>
          .
        </p>
      )}

      {!erro && items === null && (
        <ul className="bwa-marc-grid" aria-busy="true">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <li key={i}>
              <div className="bwa-marc-skeleton" />
            </li>
          ))}
        </ul>
      )}

      {!erro && items !== null && items.length === 0 && (
        <p className="bwa-servico-text">
          Ainda não há fotos publicadas para {label.toLowerCase()}. Veja os
          outros ambientes ou abra o{" "}
          <a href={CATALOG_FULL_URL} target="_blank" rel="noopener noreferrer">
            Catálogo Bewild
          </a>
          .
        </p>
      )}

      {!erro && items !== null && items.length > 0 && (
        <ul className="bwa-marc-grid">
          {items.map((item, i) => (
            <li key={item.id}>
              <figure className="bwa-marc-figure">
                <img
                  src={catalogThumbnailUrl(item.image_url)}
                  alt={item.caption ?? `Marcenaria sob medida da Bewild — ${label} ${i + 1}`}
                  loading="lazy"
                  decoding="async"
                />
                {item.caption && <figcaption>{item.caption}</figcaption>}
              </figure>
            </li>
          ))}
        </ul>
      )}

      <p className="bwa-servico-text bwa-marc-note">
        <a href={catalogRoomUrl(room)} target="_blank" rel="noopener noreferrer">
          Ver todos os modelos de {label.toLowerCase()} no Catálogo Bewild
        </a>
      </p>
    </>
  );
}

export default function MarcenariaPage() {
  const { settings } = useSiteSettings();

  useSeo({
    title: "Marcenaria sob medida em São Paulo | Fábrica própria — Bewild",
    description:
      "Marcenaria planejada sob medida em São Paulo com fábrica própria: MDF certificado, estruturas em 25 mm, ferragens FGVTN, mais de 40 modelos e cores e 5 anos de garantia, dentro do mesmo contrato da reforma.",
    keywords:
      "marcenaria sob medida São Paulo, marcenaria planejada SP, móveis planejados apartamento, armário sob medida, cozinha planejada São Paulo, Bewild",
    canonicalPath: CANONICAL,
    ogType: "website",
    jsonLd: settings
      ? [
          breadcrumbJsonLd(settings, [
            { name: "Início", path: "/" },
            { name: "Marcenaria sob medida", path: CANONICAL },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "Service",
            name: "Marcenaria sob medida em São Paulo",
            alternateName: "Móveis planejados sob medida em SP",
            serviceType: "Marcenaria sob medida",
            description:
              "Marcenaria planejada desenhada no projeto executivo e produzida em fábrica própria: MDF certificado, estruturas em 25 mm, ferragens FGVTN e 5 anos de garantia.",
            provider: { "@id": "https://bewild.com.br/#org" },
            areaServed: { "@type": "City", name: "São Paulo" },
            url: `https://bewild.com.br${CANONICAL}`,
          },
          faqJsonLd(FAQ.map((f) => ({ q: f.q, a: f.a }))),
        ]
      : undefined,
  });

  return (
    <div className="bwa-servico">
      <BwaNav />

      <main id="main" tabIndex={-1}>
        <section className="bwa-servico-intro">
          <div className="bwa-shell bwa-servico-head">
            <p className="bwa-label">Marcenaria sob medida em São Paulo</p>
            <div>
              <h1 className="bwa-title">
                Marcenaria sob medida, <em>feita na nossa fábrica.</em>
              </h1>
              <p className="bwa-servico-lead">
                Cada armário, painel e bancada da sua reforma sai do mesmo
                projeto executivo que orienta a obra — desenhado pela nossa
                equipe de arquitetura, produzido em fábrica própria e instalado
                pelo nosso time. MDF de procedência certificada, ferragens
                FGVTN e 5 anos de garantia, dentro do mesmo contrato da reforma.
              </p>
            </div>
          </div>
        </section>

        <section className="bwa-servico-block" aria-labelledby="especificacoes">
          <div className="bwa-shell">
            <h2 className="bwa-servico-h2" id="especificacoes">
              O que está dentro de cada peça
            </h2>
            <ul className="bwa-servico-list">
              {ESPECIFICACOES.map((item) => (
                <li key={item.n}>
                  <span className="bwa-servico-num">{item.n}</span>
                  <span>{item.t}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bwa-servico-block" aria-labelledby="ambientes">
          <div className="bwa-shell">
            <h2 className="bwa-servico-h2" id="ambientes">
              Ambientes e modelos
            </h2>
            <p className="bwa-servico-text" style={{ marginBottom: 24 }}>
              As fotos abaixo são as mesmas referências que você escolhe no
              orçamento, organizadas por ambiente.
            </p>
            <RoomGallery />
          </div>
        </section>

        <section className="bwa-servico-block" aria-labelledby="como-funciona">
          <div className="bwa-shell">
            <h2 className="bwa-servico-h2" id="como-funciona">
              Como a marcenaria entra na obra
            </h2>
            <ul className="bwa-servico-list">
              {PASSOS.map((item) => (
                <li key={item.n}>
                  <span className="bwa-servico-num">{item.n}</span>
                  <span>{item.t}</span>
                </li>
              ))}
            </ul>
            <p className="bwa-servico-text" style={{ marginTop: 24 }}>
              Veja a marcenaria instalada nas obras entregues no{" "}
              <a href="/portfolio">portfólio</a> ou entenda o contrato completo
              em <a href="/escopo">o que está incluso</a>.
            </p>
          </div>
        </section>

        <BwaImprensa />

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
              Quer a marcenaria no mesmo contrato da obra?{" "}
              <em>Comece pelo orçamento.</em>
            </h2>
            <div className="bwa-servico-cta-actions">
              <a
                className="bwa-button bwa-button-light"
                href={CTA_HREF}
                data-cta="servico-marcenaria-sp"
              >
                Solicitar orçamento <span aria-hidden="true">→</span>
              </a>
              <a
                className="bwa-servico-whats"
                href={whatsappHref("Olá! Quero falar sobre marcenaria sob medida.")}
                target="_blank"
                rel="noopener noreferrer"
              >
                Falar no WhatsApp <span aria-hidden="true">→</span>
              </a>
              <p className="bwa-servico-cta-note">
                +160 reformas entregues · +200 projetos
              </p>
            </div>
          </div>
        </section>
      </main>

      <BwaFooter />
    </div>
  );
}
