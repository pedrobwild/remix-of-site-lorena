/**
 * Segmentos ativos do painel → parâmetros nomeados das RPCs `analytics_*_v2`.
 */
import type { Segment, SegmentDim } from "./types";

export function segArgs(segments: Segment[]): Record<string, string | null> {
  const map: Partial<Record<SegmentDim, string>> = {};
  for (const s of segments) map[s.dim] = s.value;
  return {
    p_device: map.device ?? null,
    p_country: map.country ?? null,
    p_utm_source: map.utm_source ?? null,
    p_utm_medium: map.utm_medium ?? null,
    p_utm_campaign: map.utm_campaign ?? null,
    p_landing_path: map.landing_path ?? null,
    p_referrer_host: map.referrer_host ?? null,
  };
}

/**
 * Limite alto o bastante para trazer todos os caminhos do período: a aba
 * "Conteúdo" e o cartão "top projetos" filtram no cliente.
 */
export const ALL_PATHS_LIMIT = 10000;
