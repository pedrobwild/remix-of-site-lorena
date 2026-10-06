/**
 * Dados e JSON-LD de /autorizacao-condominio — módulo sem componentes nem CSS.
 *
 * O `head()` da rota (src/routes/autorizacao-condominio.tsx) precisa do JSON-LD de forma
 * síncrona e fica no grafo carregado em TODA página (routeTree). Enquanto a
 * constante morava em src/pages/AutorizacaoCondominioPage.tsx, o CSS e os componentes da
 * página inteira iam junto para todas as rotas (auditoria de SEO 06/10/2026,
 * item 3: 9–11 folhas de estilo bloqueantes por página).
 */
import { faqJsonLd } from "@/lib/useSeo";

export const ITENS: { q: string; a: string }[] = [
  {
    q: "Preciso de autorização do condomínio para reformar meu apartamento?",
    a: "Sim. Em praticamente todos os condomínios de São Paulo, obra interna depende de comunicado prévio ao síndico ou à administradora — mesmo quando não há alteração de estrutura. A regra vem da convenção do prédio e do regimento interno, e reformar sem avisar pode gerar multa, embargo da obra e até ação do condomínio.",
  },
  {
    q: "O que o condomínio costuma exigir para liberar a reforma?",
    a: "Os pedidos mais comuns são: comunicado prévio com datas de início e fim, ART ou RRT do responsável técnico, comprovante de seguro de responsabilidade civil, definição de horários de obra, uso do elevador de serviço com proteção e forma de retirada de entulho. Alguns prédios pedem também descrição do escopo, com o que será demolido e o que permanece.",
  },
  {
    q: "Como pedir a autorização de reforma ao condomínio?",
    a: "O caminho é o protocolo na administradora: ofício ou formulário próprio do condomínio, com anexos técnicos (ART/RRT, seguro, cronograma) e, em alguns prédios, ciência dos vizinhos ao imóvel. Aprovado o pedido, a obra passa a valer dentro das condições combinadas — horários, rota de entulho e cuidados com áreas comuns.",
  },
  {
    q: "Quanto tempo demora a aprovação do condomínio?",
    a: "Depende do regimento. Condomínios administrados costumam responder entre 3 e 15 dias úteis; alguns prédios só deliberam em assembleia ou exigem assinatura de mais de um responsável, o que alonga o prazo. Por isso a autorização entra no cronograma antes de a obra começar, nunca em paralelo a ela.",
  },
  {
    q: "Posso começar a obra antes da autorização do condomínio?",
    a: "Não vale a pena. Sem a autorização, o síndico pode embargar a obra no primeiro dia, aplicar multa prevista em convenção e reter materiais ou caçamba. E o prejuízo não é só financeiro: retrabalho, equipe parada e prazo perdido. O certo é protocolar, aprovar e só depois quebrar a primeira parede.",
  },
  {
    q: "Quais são os horários permitidos para obra em São Paulo?",
    a: "A maioria dos condomínios de São Paulo libera obra ruidosa em dias úteis, em geral das 8h às 18h, com variações definidas em convenção ou assembleia — alguns limitam ferramentas de alto impacto a períodos mais curtos e proíbem trabalho em fins de semana e feriados. O horário exato do seu prédio é confirmado na autorização.",
  },
  {
    q: "Quem cuida da burocracia com o condomínio na reforma?",
    a: "Na Bewild, essa parte é conduzida pela nossa equipe, não por você: preparamos o protocolo com ART do responsável técnico, seguro, cronograma e escopo descrito, acompanhamos a aprovação e cumprimos as condições acordadas durante toda a obra. Você assina o que for preciso e acompanha o resto pelo Bwild Workflow.",
  },
];

export const AUTORIZACAO_JSONLD: Array<Record<string, unknown>> = [
  faqJsonLd(ITENS.map((i) => ({ q: i.q, a: i.a }))),
];
