/**
 * Metadados, FAQ e JSON-LD do /guia-do-investidor — fonte ÚNICA.
 *
 * Importado pela página (src/pages/GuiaInvestidorPage.tsx), pela seção de FAQ
 * (src/guia/components/guide/FAQSection.tsx) e pelo pré-render
 * (scripts/prerenderGuia.ts, que roda em Node no fim do build). Por isso este
 * módulo é dado puro: sem imports, sem `import.meta.env`, sem APIs do
 * navegador. Assim o HTML pré-renderizado e a SPA nunca divergem em título,
 * descrição, datas ou perguntas.
 *
 * Datas do JSON-LD são CONSTANTES (nunca `new Date()`) e nunca no futuro:
 * `GUIA_MODIFIED` é o dia da última mudança real de conteúdo do guia.
 * Ao editar texto, números ou tabelas visíveis do guia, atualize-a.
 */

export const GUIA_BASE_URL = "https://bewild.com.br";
export const GUIA_PATH = "/guia-do-investidor";
export const GUIA_URL = `${GUIA_BASE_URL}${GUIA_PATH}`;

export const GUIA_H1 = "Guia do investidor em studios para short stay em São Paulo";

export const GUIA_TITLE =
  "Guia do investidor: studio para short stay em SP — bairros, custo e prazo | Bewild";

export const GUIA_DESCRIPTION =
  "Bairro a bairro em São Paulo — Pinheiros, Itaim Bibi, Jardim Paulista, Consolação, Vila Mariana, Moema, Brooklin e mais — com mapa, simulador, checklists e o que considerar em custo e prazo da reforma do studio.";

export const GUIA_KEYWORDS =
  "guia do investidor short stay, studio para airbnb são paulo, custo de reforma de studio em sp, prazo de reforma de studio, quanto custa reformar studio são paulo, mapa de bairros short stay sp, short stay Pinheiros, short stay Itaim Bibi, short stay Jardim Paulista, short stay Consolação, short stay Bela Vista, short stay Moema, short stay Vila Mariana, short stay Barra Funda, short stay Campo Belo, short stay República, short stay Santana, short stay Brooklin, short stay Itaquera";

/** Primeira publicação do guia no site. */
export const GUIA_PUBLISHED = "2026-09-22";
/** Última mudança real de conteúdo (dados de bairros unificados, simulador revisto). */
export const GUIA_MODIFIED = "2026-09-23";

/** Imagem padrão do Article quando o site não informa uma og:image própria. */
export const GUIA_DEFAULT_IMAGE = `${GUIA_BASE_URL}/og_final_v2.jpg`;

export type GuiaFaqItem = { q: string; a: string };

/**
 * FAQ do guia. Regra Bewild: nenhuma promessa de renda, ocupação ou
 * rentabilidade — só faixas observadas, com origem e período.
 */
export const GUIA_FAQ: readonly GuiaFaqItem[] = [
  {
    q: "Quanto custa um studio para short stay em São Paulo?",
    a: "O investimento total costuma variar de R$ 250 mil a R$ 600 mil, dependendo do bairro, da metragem e do nível de acabamento. Studios de 25–35 m² em bairros como Pinheiros, Vila Mariana e Consolação são os mais procurados por quem busca equilíbrio entre preço de entrada e demanda.",
  },
  {
    q: "Como estimar o retorno de um studio em Airbnb?",
    a: "Não existe retorno garantido. O caminho é montar a conta com dados do próprio bairro: diária praticada, ocupação observada, custos fixos, limpeza, taxas de plataforma e vacância. O simulador desta página serve para testar cenários — otimista, provável e conservador — e não para prever resultado.",
  },
  {
    q: "Preciso de CNPJ para alugar no Airbnb?",
    a: "Não é obrigatório, mas costuma ser recomendado. Com CNPJ você emite nota fiscal, organiza a contabilidade e passa mais credibilidade. Vale conversar com um contador antes de decidir o regime.",
  },
  {
    q: "Condomínio pode proibir Airbnb?",
    a: "Pode restringir. O STJ entendeu que a convenção do condomínio pode limitar a locação por temporada. Leia a convenção e a ata antes de comprar e priorize prédios que permitem ou são neutros quanto ao uso.",
  },
  {
    q: "Qual a ocupação média de um studio em São Paulo?",
    a: "Nos bairros mais procurados, as bases públicas de mercado mostram ocupação entre 53% e 64% no período analisado. É um retrato do passado recente, não uma projeção do seu imóvel.",
  },
  {
    q: "Vale a pena contratar uma administradora?",
    a: "Com 1–2 unidades e tempo disponível, a autogestão funciona. Acima disso, ou sem disponibilidade, uma administradora (que costuma cobrar entre 15% e 25% da receita) pode fazer sentido. Compare o custo com as horas que você realmente tem.",
  },
  {
    q: "Quanto custa a reforma de um studio?",
    a: "Uma reforma bem dimensionada, sem demolições desnecessárias, costuma ficar entre R$ 15 mil e R$ 40 mil. Mobiliário e decoração somam outra faixa, de R$ 15 mil a R$ 60 mil, conforme o padrão escolhido.",
  },
  {
    q: "Qual o melhor bairro para investir em short stay?",
    a: "Depende do orçamento e do apetite a risco. Pinheiros, Consolação e Bela Vista aparecem com boa relação entre preço de entrada e demanda; Itaim Bibi e Jardim Paulista registram diárias mais altas, mas exigem investimento maior.",
  },
];

/**
 * JSON-LD do guia (Article + BreadcrumbList + FAQPage) — o MESMO objeto no
 * pré-render e na SPA. `image` absoluta opcional (og:image vinda do banco);
 * sem ela, usa a imagem padrão do site.
 */
export function guiaJsonLd(opts: { image?: string } = {}): Array<Record<string, unknown>> {
  const org = {
    "@type": "Organization",
    name: "Bewild",
    url: `${GUIA_BASE_URL}/`,
  };
  return [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: GUIA_H1,
      description: GUIA_DESCRIPTION,
      image: [opts.image || GUIA_DEFAULT_IMAGE],
      inLanguage: "pt-BR",
      author: org,
      publisher: {
        ...org,
        logo: { "@type": "ImageObject", url: `${GUIA_BASE_URL}/brand/bewild-logo.png` },
      },
      datePublished: GUIA_PUBLISHED,
      dateModified: GUIA_MODIFIED,
      mainEntityOfPage: { "@type": "WebPage", "@id": GUIA_URL },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Início", item: `${GUIA_BASE_URL}/` },
        { "@type": "ListItem", position: 2, name: "Guia do investidor", item: GUIA_URL },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: GUIA_FAQ.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];
}
