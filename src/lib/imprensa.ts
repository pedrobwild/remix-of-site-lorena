/* Itens de imprensa da Bewild — matérias externas que citam a empresa.
   Acrescentar novas matérias aqui: a faixa <BwaImprensa /> renderiza o array. */

export type ItemImprensa = {
  veiculo: string;
  data: string;
  titulo: string;
  url: string;
  cta: string;
  apoio: string;
};

export const ITENS_IMPRENSA: ItemImprensa[] = [
  {
    veiculo: "Record News · Inovação e Negócios",
    data: "14/09/2026",
    titulo:
      "A dor de cabeça de fazer a obra trava muitos investidores, diz o arquiteto Thiago Dantas",
    url: "https://noticias.r7.com/record-news/inovacao-e-negocios/video/a-dor-de-cabeca-de-fazer-a-obra-trava-muitos-investidores-diz-o-arquiteto-thiago-dantas-14092026/",
    cta: "Assistir na Record News",
    apoio:
      "Thiago Dantas, arquiteto e urbanista (CAU A162437-7), responsável técnico da Bewild, em entrevista sobre por que investidores travam na obra.",
  },
];
