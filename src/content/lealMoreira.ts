import { INCORP_CASE, INCORP_CASE_SLUG } from "@/content/incorporadoras";

/* ============================================================
 * Conteúdo da página /parceiros/leal-moreira.
 * Os fatos vêm do case já aprovado em /parceiros/incorporadoras
 * (INCORP_CASE) e da tabela partner_cases (slug "leal-moreira"),
 * para não repetir número nem inventar dado. Sem valores em reais,
 * sem nome de comprador.
 * ============================================================ */

export const LEAL_PATH = "/parceiros/leal-moreira";
export const LEAL_CASE_SLUG = INCORP_CASE_SLUG;
export const LEAL_HERO_IMAGE = "/images/parceiros/leal-moreira-urban-flex.webp";
export const LEAL_HERO_ALT =
  "Projeto em 3D de um studio do LM Urban Flex Bela Cintra, com cozinha em linha, mesa de trabalho e cama junto à janela";

export const LEAL_SEO = {
  title: "Leal Moreira e Bewild: reforma dos studios do LM Urban Flex | Bewild",
  description:
    "Parceria com a Leal Moreira: os compradores do LM Urban Flex Bela Cintra contratam com a Bewild projeto, obra, marcenaria e mobília. Veja os projetos em 3D.",
  keywords:
    "Leal Moreira, LM Urban Flex Bela Cintra, parceria incorporadora, reforma de studio Bela Cintra, reforma pós-chaves São Paulo, Bewild",
};

export const LEAL_PAGE = {
  label: "Parceria · Leal Moreira",
  titleStart: "Leal Moreira e Bewild:",
  titleEm: "do studio entregue ao studio pronto.",
  lead: INCORP_CASE.intro[0],
  lead2: INCORP_CASE.intro[1],
  ctaPrimary: { label: "Falar sobre a minha unidade", cta: "leal-moreira-hero-whatsapp" },
  ctaSecondary: { label: "Ver os projetos", href: "#projetos", cta: "leal-moreira-hero-projetos" },
  aboutLabel: "01 · A parceria",
  aboutTitle: "Como funciona para quem comprou uma unidade.",
  aboutItems: [
    {
      t: "A Leal Moreira apresenta a Bewild",
      d: "Pelo programa de indicações, o comprador conhece a Bewild ainda no relacionamento com a incorporadora.",
    },
    {
      t: "Projeto desenhado para a sua planta",
      d: "Cada unidade ganha projeto em 3D feito para a planta que o comprador recebeu, para morar ou para alugar.",
    },
    {
      t: "Um contrato só",
      d: "Projeto, obra, marcenaria e mobília no mesmo contrato, com preço e prazo fechados antes de a obra começar.",
    },
    {
      t: "Acompanhamento de qualquer cidade",
      d: "A maioria dos compradores do LM Urban Flex Bela Cintra mora em Belém. Eles aprovam o 3D e acompanham a obra pelo Bwild Workflow.",
    },
  ],
  projectsLabel: "02 · Projetos das unidades",
  projectsTitle: "Os studios do LM Urban Flex Bela Cintra em 3D.",
  projectsNote: INCORP_CASE.galleryNote,
  projectLink: INCORP_CASE.galleryLink,
  statusLabels: INCORP_CASE.statusLabels,
  moreLabel: "03 · Para outras incorporadoras",
  moreTitle: "Quer o mesmo programa no seu empreendimento?",
  moreText:
    "A Bewild monta pacotes por tipologia e atende os compradores indicados. Veja como funciona o programa para incorporadoras.",
  moreCta: { label: "Parceria com incorporadoras", href: "/parceiros/incorporadoras", cta: "leal-moreira-incorporadoras" },
  buyer: INCORP_CASE.buyer,
};
