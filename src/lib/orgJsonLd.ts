/**
 * JSON-LD sitewide (Organization, ProfessionalService, WebSite e Service) —
 * FONTE ÚNICA. O __root publica ORG_JSONLD (derivado destes nós) no HTML do
 * servidor; `organizationJsonLd`/`localBusinessRef` (useSeo.ts) e os autores
 * (postSeo.ts) reaproveitam os mesmos objetos/@id. Não repetir campos em
 * outro arquivo.
 *
 * 2026-09-30: legalName/CNPJ, alternateName alinhado ao Perfil da Empresa no
 * Google ("Bewild Reformas e Arquitetura"), sameAs/hasMap com o link do Perfil
 * (cid) e CEP. 2026-10-12 (decisão do dono): cargos de Pedro e Thiago,
 * founder na Organization, CAU só no Person do Thiago (registro pessoal),
 * foto real no #local. `geo` = pino do Perfil da Empresa no Google
 * (conferido pelo dono em 12/10/2026).
 */

export const SITE_URL = "https://bewild.com.br";
export const ORG_ID = `${SITE_URL}/#org`;
export const LOCAL_ID = `${SITE_URL}/#local`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const SERVICE_ID = `${SITE_URL}/#servico-reforma`;
export const PEDRO_ID = `${SITE_URL}/#pedro-henrique-alves`;
export const THIAGO_ID = `${SITE_URL}/#thiago-dantas`;

// Quadrado 512×512, fundo branco, marca azul atual (o bewild-logo.png antigo fica por links externos).
export const ORG_LOGO = `${SITE_URL}/brand/bewild-logo-512.png`;
export const LOCAL_PHOTO = `${SITE_URL}/images/hero-slides/rodrigo-1-lg.jpg`;
export const GOOGLE_BUSINESS_PROFILE_URL = "https://maps.google.com/maps?cid=16329162499474686119";

export const ORG_SAME_AS = [
  "https://instagram.com/bewild.oficial",
  "https://www.linkedin.com/company/bwil-d/",
  GOOGLE_BUSINESS_PROFILE_URL,
  "https://www.youtube.com/@bewild.oficial",
];
export const ORG_CNPJ = "47.350.338/0001-37";
export const ORG_LEGAL_NAME = "Bwild Reformas LTDA";
export const ORG_ALTERNATE_NAMES = ["Bwild", "Bewild Reformas", "Bewild Reformas e Arquitetura", "Bwild Reformas", "Be Wild"];
export const ORG_TELEPHONE = "+55 11 91190-6183";
export const ORG_EMAIL = "contato@bewild.com.br";

export const ORG_ADDRESS = {
  "@type": "PostalAddress",
  streetAddress: "Rua Pitú, 72, Sala 115",
  addressLocality: "São Paulo",
  addressRegion: "SP",
  addressCountry: "BR",
  postalCode: "04567-060",
};

export const OPENING_HOURS = [
  {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    opens: "09:00",
    closes: "19:00",
  },
  { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "09:00", closes: "17:00" },
];

const SAO_PAULO = { "@type": "City", name: "São Paulo" };

/** Pessoas: os mesmos nós (por @id) nas páginas de autor e na assinatura dos posts. */
export const THIAGO_NODE = {
  "@type": "Person",
  "@id": THIAGO_ID,
  name: "Thiago Dantas do Amor",
  jobTitle: "Cofundador, VP e arquiteto responsável técnico",
  identifier: "CAU A162437-7",
  url: `${SITE_URL}/conteudos/thiago-dantas-arquiteto-responsavel-tecnico-bewild`,
  sameAs: ["https://www.linkedin.com/in/thiago-dantas-do-amor-73817b134/"],
};

export const PEDRO_NODE = {
  "@type": "Person",
  "@id": PEDRO_ID,
  name: "Pedro Henrique Alves",
  jobTitle: "Fundador e CEO",
  url: `${SITE_URL}/conteudos/pedro-henrique-alves-ceo-bewild`,
  sameAs: ["https://www.linkedin.com/in/pedro-henrique-alves-872b0245"],
};

export const ORG_NODE = {
  "@type": "Organization",
  "@id": ORG_ID,
  name: "Bewild",
  legalName: ORG_LEGAL_NAME,
  alternateName: ORG_ALTERNATE_NAMES,
  url: `${SITE_URL}/`,
  logo: ORG_LOGO,
  description:
    "Reforma de apartamento em São Paulo, do projeto à entrega do apartamento pronto para morar, alugar ou vender.",
  areaServed: [SAO_PAULO],
  knowsAbout: [
    "Reformas de apartamentos",
    "Apartamentos prontos",
    "Reforma turn-key",
    "Projeto de arquitetura personalizado",
    "Reforma de studios",
    "Reforma de escritórios",
    "Short-stay",
    "Marcenaria sob medida",
    "Gestão de obra",
    "Reforma de studio em São Paulo",
    "Empresa de reforma de apartamento em São Paulo",
  ],
  founder: [{ "@id": PEDRO_ID }, { "@id": THIAGO_ID }],
  employee: [THIAGO_NODE, PEDRO_NODE],
  taxID: ORG_CNPJ,
  identifier: [{ "@type": "PropertyValue", propertyID: "CNPJ", value: ORG_CNPJ }],
  sameAs: ORG_SAME_AS,
};

export const LOCAL_NODE = {
  "@type": "ProfessionalService",
  "@id": LOCAL_ID,
  name: "Bewild",
  alternateName: ORG_ALTERNATE_NAMES,
  url: `${SITE_URL}/`,
  image: [LOCAL_PHOTO, ORG_LOGO],
  // Pino do Perfil da Empresa no Google (cid 16329162499474686119), conferido pelo dono.
  geo: { "@type": "GeoCoordinates", latitude: -23.6147497, longitude: -46.6886285 },
  description:
    "Escritório de arquitetura e engenharia em São Paulo: reforma completa de apartamentos e studios, do projeto à entrega pronta para morar, alugar ou vender.",
  telephone: ORG_TELEPHONE,
  email: ORG_EMAIL,
  priceRange: "$$",
  address: ORG_ADDRESS,
  hasMap: GOOGLE_BUSINESS_PROFILE_URL,
  areaServed: SAO_PAULO,
  openingHoursSpecification: OPENING_HOURS,
  sameAs: ORG_SAME_AS,
  parentOrganization: { "@id": ORG_ID },
};

export const WEBSITE_NODE = {
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  url: `${SITE_URL}/`,
  name: "Bewild",
  // Nome que o Google usa para o site no resultado de busca.
  alternateName: ["Bewild Reformas", "Bwild"],
  description: "Reforma de apartamento em São Paulo, com entrega do imóvel pronto para morar ou rentabilizar.",
  inLanguage: "pt-BR",
  publisher: { "@id": ORG_ID },
};

export const SERVICE_NODE = {
  "@type": "Service",
  "@id": SERVICE_ID,
  name: "Reforma completa de apartamentos e studios em São Paulo",
  serviceType: "Reforma completa de apartamentos",
  provider: { "@id": ORG_ID },
  areaServed: SAO_PAULO,
  description:
    "Reforma de apartamento em São Paulo: projeto, obra, marcenaria e mobília com gestão integrada até a entrega do apartamento pronto.",
};

export const ORG_JSONLD = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [ORG_NODE, LOCAL_NODE, WEBSITE_NODE, SERVICE_NODE],
});
