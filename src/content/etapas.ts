/**
 * As 12 etapas da reforma turnkey, na ordem em que acontecem — a mesma lista
 * da seção "O processo" da home (home-bwa-body.ts). /como-funciona as
 * detalha; as páginas de serviço apontam para lá.
 */
export type Etapa = { n: string; nome: string; detalhe: string };
export type FaseEtapas = { n: string; nome: string; resumo: string; etapas: Etapa[] };

export const FASES: FaseEtapas[] = [
  {
    n: "01",
    nome: "Projeto",
    resumo:
      "Tudo o que vai para a obra é decidido e aprovado antes dela começar. É aqui que o orçamento fecha: o projeto executivo lista cada material e acabamento, e o preço do contrato cobre esse escopo.",
    etapas: [
      { n: "01", nome: "Briefing", detalhe: "Alinhamento de expectativas, estilo e objetivos do projeto: morar, alugar por temporada ou vender." },
      { n: "02", nome: "Projeto 3D", detalhe: "Maquete realista do apartamento, com revisões até a sua aprovação." },
      { n: "03", nome: "Medição técnica", detalhe: "Levantamento preciso do espaço, dos pontos hidráulicos e elétricos, para o projeto executivo." },
      { n: "04", nome: "Projeto executivo", detalhe: "Plantas detalhadas com especificação de materiais, marcenaria e acabamentos." },
    ],
  },
  {
    n: "02",
    nome: "Preparação",
    resumo:
      "A obra só começa com a documentação entregue e o condomínio de acordo. A Bewild cuida da ART, do plano de reforma que a NBR 16280 pede e da liberação com o síndico; você não precisa estar em São Paulo.",
    etapas: [
      { n: "05", nome: "Documentação técnica", detalhe: "ART no CREA e a documentação que o condomínio exige, no padrão da NBR 16280." },
      { n: "06", nome: "Liberação da obra", detalhe: "Aprovações concluídas e autorização do condomínio para o início dos trabalhos." },
      { n: "07", nome: "Cronograma oficial", detalhe: "Cronograma definido por etapa antes de a obra começar, com a data de entrega em contrato." },
      { n: "08", nome: "Mobilização", detalhe: "Equipe própria mobilizada e canteiro preparado dentro das regras do prédio." },
    ],
  },
  {
    n: "03",
    nome: "Obra e entrega",
    resumo:
      "Engenheiro dedicado, equipe própria e marcenaria da Bewild. Você acompanha tudo pelo Bwild Workflow, de onde estiver, e recebe o apartamento limpo, mobiliado e com garantia por escrito.",
    etapas: [
      { n: "09", nome: "Relatórios semanais", detalhe: "Avanço, fotos e próximos passos toda semana, no Bwild Workflow." },
      { n: "10", nome: "Gestão da obra", detalhe: "Engenheiro dedicado, compras e fornecedores coordenados pela Bewild." },
      { n: "11", nome: "Vistorias de qualidade", detalhe: "Vistorias técnicas em cada etapa, registradas no Bwild Workflow." },
      { n: "12", nome: "Entrega da obra", detalhe: "Vistoria final, apartamento limpo e pronto para usar, com 5 anos de garantia por escrito." },
    ],
  },
];
