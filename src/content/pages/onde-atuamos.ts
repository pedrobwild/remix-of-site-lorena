/**
 * Dados e JSON-LD de /onde-atuamos — módulo sem componentes nem CSS.
 *
 * O `head()` da rota (src/routes/onde-atuamos.tsx) precisa do JSON-LD de forma
 * síncrona e fica no grafo carregado em TODA página (routeTree). Enquanto a
 * constante morava em src/pages/OndeAtuamosPage.tsx, o CSS e os componentes da
 * página inteira iam junto para todas as rotas (auditoria de SEO 06/10/2026,
 * item 3: 9–11 folhas de estilo bloqueantes por página).
 */

export const ONDE_ATUAMOS_JSONLD: Array<Record<string, unknown>> = [
  {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Reforma completa de studios e apartamentos",
    provider: { "@type": "Organization", name: "Bewild", url: "https://bewild.com.br" },
    areaServed: { "@type": "City", name: "São Paulo" },
  },
];
