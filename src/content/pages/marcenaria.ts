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
import { INCORP_BENEFITS, INCORP_CASE, INCORP_FAQ, INCORP_STEPS } from "@/content/incorporadoras";
import { LEAL_PATH } from "@/content/lealMoreira.seo";

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
    q: "Vocês fazem móveis planejados para studio e apartamento pequeno?",
    a: "Sim, é o caso mais comum. Os móveis planejados são desenhados junto com o layout, sob medida para espaços compactos, aprovados em 3D e produzidos na fábrica da própria Bewild.",
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
    "@id": `https://bewild.com.br${CANONICAL}#service`,
    // name = H1 da página; description = texto de abertura visível.
    name: "Marcenaria sob medida em São Paulo, feita na nossa fábrica.",
    alternateName: "Móveis planejados sob medida em SP",
    serviceType: "Marcenaria sob medida",
    description:
      "Cada armário, painel e bancada da sua reforma sai do mesmo projeto executivo que orienta a obra — desenhado pela nossa equipe de arquitetura, produzido em fábrica própria e instalado pelo nosso time.",
    provider: { "@id": "https://bewild.com.br/#org" },
    areaServed: { "@type": "City", name: "São Paulo" },
    url: `https://bewild.com.br${CANONICAL}`,
  },
  faqJsonLd(FAQ.map((f) => ({ q: f.q, a: f.a }))),
];

/* ------------------------------------------------------------
 * Seção "Marcenaria para incorporadoras" (auditoria de SEO, rodada 4,
 * 09/11/2026, ação 10: a busca tinha 39 impressões na posição 14,2 e a
 * página não falava de incorporadora). Os fatos saem do programa para
 * incorporadoras e do case Leal Moreira (src/content/incorporadoras.ts),
 * lidos daqui para não repetir nem inventar número de unidades, prazo ou
 * cliente; o que é da marcenaria (projeto executivo, fábrica própria,
 * produção em paralelo à obra, garantia) já está no FAQ acima.
 * ------------------------------------------------------------ */
const passo = (n: string) => INCORP_STEPS.steps.find((s) => s.n === n)?.d ?? "";
const ganho = (t: string) => INCORP_BENEFITS.items.find((i) => i.t === t)?.d ?? "";
const resposta = (q: string) => INCORP_FAQ.items.find((i) => i.q === q)?.a ?? "";
const primeiraFrase = (texto: string) => texto.match(/^[^.]*\./)?.[0] ?? texto;

export const MARCENARIA_INCORPORADORAS = {
  id: "incorporadoras",
  titulo: "Marcenaria para incorporadoras e lotes de unidades",
  /** O medo antes da solução: cada unidade com um fornecedor diferente. */
  abertura:
    "Num prédio recém-entregue, cada comprador que contrata um marceneiro diferente é mais uma obra, mais um prazo e mais um interlocutor para o condomínio.",
  texto: `${passo("01")} ${passo("02")} A marcenaria de cada tipologia é desenhada no projeto executivo e produzida na fábrica própria da Bewild.`,
  itens: [
    {
      t: "Sem mínimo de unidades",
      d: resposta("Existe mínimo de unidades?").replace(/^Não\.\s*/, ""),
    },
    {
      t: "Prazo em contrato",
      d: `${primeiraFrase(ganho("Execução com garantia em contrato"))} A marcenaria é produzida em paralelo à obra e instalada depois dos acabamentos.`,
    },
    {
      t: "Um interlocutor para o condomínio",
      d: ganho("Um interlocutor técnico para o condomínio"),
    },
    {
      t: "5 anos de garantia na marcenaria",
      d: "Com assistência da própria Bewild, o mesmo prazo de garantia da reforma.",
    },
  ],
  caso: {
    titulo: "Case Leal Moreira",
    texto: [...INCORP_CASE.intro, ganho("O comprador que mora longe recebe o imóvel pronto")].join(" "),
    link: { href: LEAL_PATH, label: "Veja os projetos das unidades no case Leal Moreira" },
  },
  cta: { href: "/orcamento", label: "Solicitar orçamento", dataCta: "marcenaria-incorporadoras-orcamento" },
};
