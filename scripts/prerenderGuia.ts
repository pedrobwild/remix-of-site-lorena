/**
 * Pré-renderiza /guia-do-investidor.
 *
 * Gera, depois do build, dist/guia-do-investidor/index.html (mais o irmão
 * dist/guia-do-investidor.html) com <head> completo (título, descrição,
 * keywords, canonical, Open Graph, Twitter e JSON-LD Article + Breadcrumb +
 * FAQPage) e um corpo semântico dentro de <div id="root"> para crawlers que
 * não executam JS. O React substitui o corpo ao montar.
 *
 * NUNCA pode quebrar o build: qualquer falha apenas imprime um aviso.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { Plugin } from "vite";

const BASE_URL = "https://bewild.com.br";
const PATH = "/guia-do-investidor";
const URL_ABS = `${BASE_URL}${PATH}`;

const TITLE = "Guia do investidor em studios para short stay em SP | Bewild";
const DESCRIPTION =
  "Como escolher o bairro, validar a conta, reformar e operar um studio para short stay em São Paulo. Mapa de bairros, simulador de receita, checklists e FAQ.";
const KEYWORDS =
  "guia do investidor short stay, studio para airbnb são paulo, investir em studio compacto, mapa de bairros short stay sp";
const H1 = "Guia do investidor em studios para short stay em São Paulo";
const PUBLISHED = "2026-09-22";
const MODIFIED = "2026-10-06";
const IMAGE = `${BASE_URL}/og_final_v2.jpg`;

/** Espelha a FAQ renderizada em src/guia/components/guide/FAQSection.tsx. */
const FAQ: Array<{ q: string; a: string }> = [
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

/** Blocos do guia, na mesma ordem das seções renderizadas. */
const BLOCOS: Array<{ h2: string; p: string; itens: string[] }> = [
  {
    h2: "Onde investir",
    p: "Mapa de bairros rentáveis de São Paulo: demanda, diária praticada, ocupação observada e faixas de receita por metragem (20–25 m², 26–35 m² e 36–50 m²), com comparação entre bairros e leitura de mercado.",
    itens: [
      "Mapa interativo de bairros com metrô, pontos de interesse e mapa de calor de demanda",
      "Tabela de diária mínima, ocupação média e faixas por metragem",
      "Mercado e precificação: sazonalidade, concorrência e posicionamento",
    ],
  },
  {
    h2: "Como validar a conta",
    p: "Antes de comprar, o investidor precisa testar cenários. Esta parte reúne a escolha do ativo, a matemática da rentabilidade e um simulador de receita para comparar cenário conservador, provável e otimista.",
    itens: [
      "Checklist pontuado de avaliação do imóvel (localização, prédio, unidade e condomínio)",
      "Rentabilidade explicada: receita bruta, custos fixos, limpeza, taxas e vacância",
      "Simulador de receita com diária, ocupação e custos editáveis",
    ],
  },
  {
    h2: "O que faz um studio performar",
    p: "O que realmente move reservas: reforma inteligente, o que não mexer, decoração e fotos. Inclui o anti-checklist com os erros que mais custam caro em studios compactos.",
    itens: [
      "O que move reservas: fotos, título, avaliações e tempo de resposta",
      "Reforma inteligente: onde investir e onde não mexer",
      "Anti-checklist: decisões que reduzem diária e ocupação",
      "Decoração e enxoval: o que muda a percepção de valor",
      "Tendências de mercado para studios em São Paulo",
    ],
  },
  {
    h2: "Como agir com confiança",
    p: "Estruturação do anúncio e da precificação, estudo de caso real e o checklist final do investidor para decidir com critério e prazo definido.",
    itens: [
      "Anatomia do anúncio e estratégia de precificação",
      "Estudo de caso: antes e depois de um studio compacto",
      "Checklist do investidor com pontuação",
      "Perguntas frequentes",
    ],
  },
];

const attr = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function headFor(html: string): string {
  const set = (pattern: RegExp, replacement: string) => {
    html = html.replace(pattern, replacement);
  };

  set(/<title>[\s\S]*?<\/title>/, `<title>${attr(TITLE)}</title>`);
  set(
    /<meta\s+name="description"\s+content="[\s\S]*?"\s*\/?>/,
    `<meta name="description" content="${attr(DESCRIPTION)}" />`,
  );
  set(/<meta\s+name="keywords"[\s\S]*?\/>/, `<meta name="keywords" content="${attr(KEYWORDS)}" />`);
  set(/<meta\s+name="DC.title"\s+content="[\s\S]*?"\s*\/?>/, `<meta name="DC.title" content="${attr(TITLE)}" />`);
  set(/<link\s+rel="canonical"\s+href="[\s\S]*?"\s*\/?>/, `<link rel="canonical" href="${URL_ABS}" />`);
  html = html.replace(
    /<link\s+rel="alternate"\s+hreflang="([\w-]+)"\s+href="[\s\S]*?"\s*\/?>/g,
    (_m, lang: string) => `<link rel="alternate" hreflang="${lang}" href="${URL_ABS}" />`,
  );
  set(/<meta\s+property="og:type"\s+content="[\s\S]*?"\s*\/?>/, `<meta property="og:type" content="article" />`);
  set(/<meta\s+property="og:url"\s+content="[\s\S]*?"\s*\/?>/, `<meta property="og:url" content="${URL_ABS}" />`);
  set(
    /<meta\s+property="og:title"\s+content="[\s\S]*?"\s*\/?>/,
    `<meta property="og:title" content="${attr(TITLE)}" />`,
  );
  set(
    /<meta\s+property="og:description"\s+content="[\s\S]*?"\s*\/?>/,
    `<meta property="og:description" content="${attr(DESCRIPTION)}" />`,
  );
  set(
    /<meta\s+name="twitter:title"\s+content="[\s\S]*?"\s*\/?>/,
    `<meta name="twitter:title" content="${attr(TITLE)}" />`,
  );
  set(
    /<meta\s+name="twitter:description"\s+content="[\s\S]*?"\s*\/?>/,
    `<meta name="twitter:description" content="${attr(DESCRIPTION)}" />`,
  );

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: H1,
      description: DESCRIPTION,
      image: [IMAGE],
      author: { "@type": "Organization", name: "Bewild" },
      publisher: {
        "@type": "Organization",
        name: "Bewild",
        logo: { "@type": "ImageObject", url: `${BASE_URL}/brand/bewild-logo.png` },
      },
      datePublished: PUBLISHED,
      dateModified: MODIFIED,
      mainEntityOfPage: { "@type": "WebPage", "@id": URL_ABS },
      inLanguage: "pt-BR",
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Início", item: `${BASE_URL}/` },
        { "@type": "ListItem", position: 2, name: "Guia do investidor", item: URL_ABS },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];

  const block = `<script type="application/ld+json" data-prerender="guia">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>\n</head>`;
  return html.replace("</head>", block);
}

function bodyFor(html: string): string {
  const blocos = BLOCOS.map(
    (b) =>
      `<section><h2>${attr(b.h2)}</h2><p>${attr(b.p)}</p><ul>${b.itens
        .map((i) => `<li>${attr(i)}</li>`)
        .join("")}</ul></section>`,
  ).join("");

  const faq =
    `<section><h2>Perguntas frequentes</h2>` +
    FAQ.map((f) => `<h3>${attr(f.q)}</h3><p>${attr(f.a)}</p>`).join("") +
    `</section>`;

  const content =
    `<article data-prerender="guia-body">` +
    `<nav><a href="/">Início</a> / <a href="${PATH}">Guia do investidor</a></nav>` +
    `<h1>${attr(H1)}</h1>` +
    `<p>${attr(DESCRIPTION)}</p>` +
    blocos +
    faq +
    `<p><a href="/orcamento">Solicitar orçamento</a> · <a href="/portfolio">Portfólio de reformas em SP</a> · <a href="/conteudos">Conteúdos sobre reforma e short stay</a></p>` +
    `<p>Conteúdo informativo. As faixas de diária, ocupação e custo citadas são retratos de mercado do período analisado e não constituem promessa, garantia ou recomendação de investimento.</p>` +
    `</article>`;

  return html.replace('<div id="root"></div>', `<div id="root">${content}</div>`);
}

export function prerenderGuia(): Plugin {
  return {
    name: "bewild-prerender-guia",
    apply: "build",
    closeBundle() {
      try {
        const distIndex = resolve("dist/index.html");
        if (!existsSync(distIndex)) {
          console.warn("[prerender-guia] dist/index.html não encontrado — nada gerado.");
          return;
        }
        const html = bodyFor(headFor(readFileSync(distIndex, "utf8")));
        const dirFile = resolve("dist/guia-do-investidor/index.html");
        mkdirSync(dirname(dirFile), { recursive: true });
        writeFileSync(dirFile, html, "utf8");
        writeFileSync(resolve("dist/guia-do-investidor.html"), html, "utf8");
        console.log("[prerender-guia] /guia-do-investidor pronto em dist/guia-do-investidor/");
      } catch (err) {
        console.warn(`[prerender-guia] ${err instanceof Error ? err.message : String(err)} — nada gerado.`);
      }
    },
  };
}
