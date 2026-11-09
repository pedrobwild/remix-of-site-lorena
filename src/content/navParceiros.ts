/**
 * Menu "Parceiros" do header e textos da /parceiros com a página de
 * incorporadoras ligada. Saíram de `incorporadoras.ts` em 09/11/2026: o
 * BwaNav (toda página pública) só precisa deste bloco, e importá-lo de lá
 * trazia o conteúdo inteiro da página de incorporadoras (~13 kB) para o
 * pacote inicial de todas as páginas.
 */
export const NAV_PARCEIROS = {
  label: "Parceiros",
  items: [
    {
      href: "/parceiros",
      title: "Clientes e corretores",
      desc: "Indique quem vai reformar e receba pela indicação.",
      cta: "nav-parceiros-clientes-corretores",
      gated: false,
    },
    {
      href: "/parceiros/incorporadoras",
      title: "Incorporadoras",
      desc: "Projeto e obra para os compradores do seu empreendimento.",
      cta: "nav-parceiros-incorporadoras",
      gated: true,
    },
  ],
};

export const PARCEIROS_WHEN_INCORP_ON = {
  heroLead:
    "Corretores, imobiliárias, arquitetos e administradoras podem indicar clientes para uma entrega completa de projeto, obra, marcenaria e mobília. Quando o contrato indicado é pago, você recebe a comissão definida no seu termo.",
  seoDescription:
    "Indique clientes para a Bewild, acompanhe cada oportunidade e receba comissão conforme o termo. Programa para corretores, imobiliárias, arquitetos e administradoras.",
  caminhoIncorporadorasLink: "Ver a página para incorporadoras",
  bloco07: {
    label: "07 · Para incorporadoras",
    title: "Incorporadoras têm uma página própria.",
    text: "Pacotes por tipologia antes das chaves, obra para os compradores depois delas e o case do LM Urban Flex Bela Cintra, da Leal Moreira.",
    cta: "Ver a página para incorporadoras",
  },
  cardLealMoreira: {
    text: "Programa de indicações vigente com a Leal Moreira, formalizado em termo de parceria. Compradores do LM Urban Flex Bela Cintra contratam com a Bewild projeto, obra, marcenaria e mobília.",
    cta: "Ver o case completo",
    href: "/parceiros/incorporadoras#leal-moreira",
  },
  marcasCta: "Ver o case Leal Moreira",
};
