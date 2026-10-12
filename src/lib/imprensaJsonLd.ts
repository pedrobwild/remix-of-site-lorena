/**
 * VideoObject da entrevista da Record News com o Thiago Dantas, para as páginas
 * que mostram a faixa "Na imprensa" (/faq e /contato).
 *
 * Os dados vêm do próprio JSON-LD da matéria no R7 (conferido em 12/10/2026):
 * `uploadDate` já com fuso (Z), `contentUrl` do arquivo de vídeo e duração.
 * O R7 não publica URL de player incorporável, então `embedUrl` NÃO é escrito
 * (o Google aceita `contentUrl` OU `embedUrl`). Não inventar valores aqui.
 */
import { ITENS_IMPRENSA } from "@/lib/imprensa";

export const RECORD_NEWS_VIDEO = {
  uploadDate: "2026-09-14T14:27:35Z",
  duration: "PT19M18S",
  contentUrl:
    "https://d147dt0faszygd.cloudfront.net/wp-newr7/20260902/6a983bd3d7c92e47bb49172a/t_4bec9c4853fb40c3a81c4566e6637447_name_5390817_ERP_RRN_0209_INOVACAO_E_NEGOCIOS/file_960x540-1600-v4.mp4",
  thumbnailUrl: "https://bewild.com.br/images/imprensa/record-news-thiago.jpg",
} as const;

export function imprensaVideoJsonLd(): Record<string, unknown> {
  const item = ITENS_IMPRENSA[0];
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: item.titulo,
    description:
      "Thiago Dantas, arquiteto e urbanista (CAU A162437-7), responsável técnico da Bewild, em entrevista ao Inovação e Negócios da Record News sobre por que investidores travam na obra.",
    thumbnailUrl: [RECORD_NEWS_VIDEO.thumbnailUrl],
    uploadDate: RECORD_NEWS_VIDEO.uploadDate,
    duration: RECORD_NEWS_VIDEO.duration,
    contentUrl: RECORD_NEWS_VIDEO.contentUrl,
    url: item.url,
    publisher: { "@type": "Organization", name: "Record News" },
  };
}
