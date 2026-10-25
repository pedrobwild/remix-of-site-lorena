/**
 * Dados e JSON-LD de /onde-atuamos — módulo sem componentes nem CSS.
 *
 * O `head()` da rota (src/routes/onde-atuamos.tsx) precisa do JSON-LD de forma
 * síncrona e fica no grafo carregado em TODA página (routeTree). Enquanto a
 * constante morava em src/pages/OndeAtuamosPage.tsx, o CSS e os componentes da
 * página inteira iam junto para todas as rotas (auditoria de SEO 06/10/2026,
 * item 3: 9–11 folhas de estilo bloqueantes por página).
 */

import { BAIRROS_ATENDIDOS } from "@/content/provas";

/** Título e descrição de /onde-atuamos: os mesmos no head() da rota (HTML do servidor) e no useSeo da página. */
// 25/10/2026: posição 4,8 no Google com CTR de 0,8% (124 impressões, 1 clique em
// 28 dias). O título passa a dizer o que a página mostra: os bairros com obra.
export const ONDE_ATUAMOS_TITLE = `Onde a Bewild reforma em São Paulo: ${BAIRROS_ATENDIDOS} bairros com obra entregue`;
export const ONDE_ATUAMOS_DESCRIPTION = `Obras entregues em ${BAIRROS_ATENDIDOS} bairros de São Paulo. Veja a lista, abra as fotos reais das obras de cada bairro e peça o orçamento, mesmo morando em outra cidade.`;

export const ONDE_ATUAMOS_JSONLD: Array<Record<string, unknown>> = [
  {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Reforma completa de studios e apartamentos",
    provider: { "@type": "Organization", name: "Bewild", url: "https://bewild.com.br" },
    areaServed: { "@type": "City", name: "São Paulo" },
  },
];
