/**
 * Dados e JSON-LD de /indique-um-amigo — módulo sem componentes nem CSS.
 *
 * O `head()` da rota (src/routes/indique-um-amigo.tsx) precisa do JSON-LD de forma
 * síncrona e fica no grafo carregado em TODA página (routeTree). Enquanto a
 * constante morava em src/pages/IndiquePage.tsx, o CSS e os componentes da
 * página inteira iam junto para todas as rotas (auditoria de SEO 06/10/2026,
 * item 3: 9–11 folhas de estilo bloqueantes por página).
 */
import { faqJsonLd } from "@/lib/useSeo";

export const FAQ_INDICADOR = [
  {
    q: "Quanto eu ganho por indicação?",
    a: "O valor da recompensa é combinado individualmente e confirmado por escrito no registro da indicação, antes de qualquer conversa com o indicado. Você sabe exatamente quanto recebe antes de indicar — nada de descobrir depois.",
  },
  {
    q: "Quando e como recebo?",
    a: "Em Pix, após o fechamento do contrato e a confirmação do primeiro pagamento do cliente indicado. Não pedimos nota fiscal e não exigimos CNPJ — é um programa para clientes, não para empresas.",
  },
  {
    q: "Preciso ser cliente da Bewild para indicar?",
    a: "Não. Qualquer pessoa física pode indicar — cliente, ex-cliente ou alguém que conhece o nosso trabalho. Profissionais do mercado imobiliário (corretores, imobiliárias, arquitetos) têm um programa próprio, com comissão, na página de parceiros.",
  },
  {
    q: "Como registro a indicação e por quanto tempo ela vale?",
    a: "No formulário desta página: 2 minutos, com seus dados e os do indicado. O registro vale por 12 meses — se a pessoa fechar contrato nesse período, a recompensa é sua, mesmo que ela retome o contato meses depois.",
  },
  {
    q: "E se a pessoa que eu indiquei já estiver falando com a Bewild?",
    a: "Indicados já em negociação ou vindos de canal próprio não geram recompensa — essa regra evita disputa de origem. Por isso o registro formal da indicação vem sempre antes da primeira conversa.",
  },
  {
    q: "O que acontece depois que eu indico?",
    a: "Nossa equipe chama o indicado em até 1 dia útil, se apresenta como Bewild e conduz o diagnóstico do imóvel. Você é avisado do andamento e, se o contrato fechar, combina o Pix da recompensa.",
  },
];

export const INDIQUE_JSONLD: Array<Record<string, unknown>> = [
  faqJsonLd(FAQ_INDICADOR.map((i) => ({ q: i.q, a: i.a }))),
];
