/**
 * Dados e JSON-LD de /marcenaria — módulo sem componentes nem CSS.
 *
 * O `head()` da rota (src/routes/marcenaria.tsx) precisa do JSON-LD de forma
 * síncrona e fica no grafo carregado em TODA página (routeTree). Enquanto a
 * constante morava em src/pages/MarcenariaPage.tsx, o CSS e os componentes da
 * página inteira iam junto para todas as rotas (auditoria de SEO 06/10/2026,
 * item 3: 9–11 folhas de estilo bloqueantes por página).
 */
import { faqJsonLd } from "@/lib/useSeo";

export const CANONICAL = "/marcenaria";

export const FAQ: { q: string; a: string }[] = [
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

export const MARCENARIA_JSONLD: Array<Record<string, unknown>> = [
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
];
