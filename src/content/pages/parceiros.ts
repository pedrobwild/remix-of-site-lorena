/**
 * Dados e JSON-LD de /parceiros — módulo sem componentes nem CSS.
 *
 * O `head()` da rota (src/routes/parceiros.index.tsx) precisa do JSON-LD de forma
 * síncrona e fica no grafo carregado em TODA página (routeTree). Enquanto a
 * constante morava em src/pages/ParceirosPage.tsx, o CSS e os componentes da
 * página inteira iam junto para todas as rotas (auditoria de SEO 06/10/2026,
 * item 3: 9–11 folhas de estilo bloqueantes por página).
 */
import { faqJsonLd } from "@/lib/useSeo";

export const FAQ_PARCEIRO = [
  {
    q: "Qual é o percentual de comissão?",
    a: "O percentual é definido no termo de parceria, por perfil e volume de indicações. O que é público são as regras — base líquida, prazos de pagamento, validade de 12 meses e relatório mensal — reproduzidas nesta página, linha a linha, para você saber exatamente como a comissão é calculada antes de assinar qualquer coisa.",
  },
  {
    q: "Como registro uma indicação e por quanto tempo ela vale?",
    a: "Pelo formulário oficial de indicação, linkado nesta página. São 2 minutos: dados do cliente e do imóvel. O registro vale por 12 meses — se o cliente fechar contrato nesse período, a indicação é sua, mesmo que ele volte a falar com a Bewild meses depois.",
  },
  {
    q: "E se o cliente já estiver falando com a Bewild?",
    a: "Clientes já em negociação ou vindos de canal próprio não geram comissão — essa regra protege os dois lados de disputa de origem. Por isso o registro formal da indicação vem sempre antes da primeira conversa.",
  },
  {
    q: "Quem fala com o cliente depois da indicação?",
    a: "A Bewild, sempre em nome próprio. Não usamos o nome do corretor, da imobiliária ou da incorporadora em nenhuma etapa, e não acessamos a sua carteira: atendemos apenas o cliente indicado, no assunto indicado.",
  },
  {
    q: "Quando a comissão é paga?",
    a: "Sobre o que o cliente efetivamente pagou. Contrato à vista: parcela única em até 30 dias corridos do recebimento. Contrato parcelado: a partir da 2ª parcela, em até 10 dias úteis por recebimento. Sem adiantamento — e com relatório mensal mostrando cada valor.",
  },
  {
    q: "Preciso de CNPJ para ser parceiro?",
    a: "O pagamento da comissão é feito contra nota fiscal de intermediação. Na prática, isso pede um CNPJ ativo — inclusive o de corretor autônomo. Se você atua como pessoa física, fale com a gente antes de cadastrar: avaliamos o formato caso a caso.",
  },
  {
    q: "A Bewild disputa meus clientes ou vende para a minha carteira?",
    a: "Não. A Bewild executa reforma — não vende imóvel, não capta cliente de venda e não fala em seu nome. Os dados do indicado são usados só para atender a indicação, conforme a LGPD, e o relacionamento comercial do cliente continua sendo seu.",
  },
  {
    q: "O que acontece se o cliente desistir depois de assinar?",
    a: "Distrato gera devolução proporcional: a comissão referente aos valores devolvidos ao cliente é restituída ou compensada nas parcelas seguintes. A regra é a mesma para os dois lados — comissão existe sobre o que ficou no contrato.",
  },
];

export const PARCEIROS_JSONLD: Array<Record<string, unknown>> = [
  faqJsonLd(FAQ_PARCEIRO.map((i) => ({ q: i.q, a: i.a }))),
];
