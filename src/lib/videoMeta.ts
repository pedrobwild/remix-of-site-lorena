/**
 * Dados reais dos vídeos (src/content/videoMeta.json): nome, descrição,
 * miniatura, duração e data de envio do próprio vídeo. Fonte única do
 * VideoObject dos artigos, das páginas de vídeo (/videos/<slug>) e do sitemap
 * de vídeo, para o Google receber o mesmo dado em todo lugar.
 *
 * Módulo puro (sem cliente do backend): pode ser importado por qualquer rota.
 */
import videoMeta from "@/content/videoMeta.json";

export type VideoMeta = {
  name?: string;
  description?: string;
  thumbnailUrl?: string;
  /** ISO 8601, ex.: "PT9M49S". */
  duration?: string;
  /**
   * Dia em que o vídeo foi publicado. Sem a data de envio do YouTube em mãos,
   * vale o dia em que o vídeo entrou no site (histórico do repositório). O de
   * custo entrou em 01/10/2026 como arquivo do site e foi para o YouTube em 06/10.
   */
  uploadDate?: string;
};

/** Vídeo do YouTube, pelo ID. Sem cadastro, objeto vazio. */
export const ytMeta = (id: string): VideoMeta => (videoMeta.youtube as Record<string, VideoMeta>)[id] ?? {};

/** Vídeo hospedado no site, pelo caminho do arquivo. Sem cadastro, objeto vazio. */
export const fileMeta = (src: string): VideoMeta => (videoMeta.files as Record<string, VideoMeta>)[src] ?? {};

/**
 * uploadDate do VideoObject: o Google exige ISO 8601 com fuso. Data sem hora vira
 * meia-noite de São Paulo (-03:00); data e hora sem fuso é lida como UTC (Z);
 * com fuso, só é mantida. Valor ausente ou inválido não sai (melhor que data errada).
 */
export function videoUploadDate(value: string | null | undefined): string | undefined {
  const v = (value ?? "").trim();
  if (!v) return undefined;
  let iso = v;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) iso = `${v}T00:00:00-03:00`;
  else if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(v)) iso = `${v.replace(" ", "T")}Z`;
  else if (/^\d{4}-\d{2}-\d{2} \d/.test(v)) iso = v.replace(" ", "T");
  return Number.isNaN(Date.parse(iso)) ? undefined : iso;
}
