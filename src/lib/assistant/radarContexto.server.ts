import { z } from "zod";
import { radarRowSchema, radarObservationSchema, latestRadarCollections, type RadarCollectionSummary, type RadarObservation, type RadarRow } from "./radarData";
import { RADAR_URL, RADAR_ANON_KEY } from "./radarConnection";

// Chave pública fornecida pelo Radar; permite somente leitura de dados públicos.
export async function readRadar(fetcher: typeof fetch = fetch): Promise<RadarRow[] | null> {
  try {
    const url = new URL(`${RADAR_URL}/rest/v1/radar_bairro_atual`);
    url.searchParams.set("select", "indicador,bairro,cidade,valor,amostra_n,periodo_inicio,periodo_fim,fonte_nome,fonte_tipo,url_origem,coletado_em,confianca,idade_dias");
    url.searchParams.set("cidade", "eq.São Paulo");
    const response = await fetcher(url, {
      headers: { apikey: RADAR_ANON_KEY, Authorization: `Bearer ${RADAR_ANON_KEY}` },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    const parsed = z.array(radarRowSchema).safeParse(await response.json());
    return parsed.success && parsed.data.length ? parsed.data : null;
  } catch { return null; }
}

/** Projeção explícita: nenhum metadado privado é solicitado. */
export async function readRadarCollections(bairro: string, fetcher: typeof fetch = fetch): Promise<RadarObservation[] | null> {
  try {
    const url = new URL(`${RADAR_URL}/rest/v1/radar_observacoes`);
    url.searchParams.set("select", "coletado_em,periodo_inicio,periodo_fim,radar_fontes(nome),amostra_n,ativo");
    url.searchParams.set("cidade", "eq.São Paulo");
    url.searchParams.set("bairro", `eq.${bairro}`);
    url.searchParams.set("indicador", "eq.adr_medio_brl");
    url.searchParams.set("order", "coletado_em.desc");
    url.searchParams.set("limit", "20");
    const response = await fetcher(url, {
      headers: { apikey: RADAR_ANON_KEY, Authorization: `Bearer ${RADAR_ANON_KEY}` },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    const wireSchema = radarObservationSchema.omit({ fonte_nome: true }).extend({ radar_fontes: z.object({ nome: z.string() }) });
    const parsed = z.array(wireSchema).safeParse(await response.json());
    return parsed.success ? parsed.data.slice(0, 20).map(({ radar_fontes, ...row }) => ({ ...row, fonte_nome: radar_fontes.nome })) : null;
  } catch { return null; }
}

/** Apenas campos públicos; paginação evita omitir bairros no limite de 1.000 linhas. */
export async function readRadarCollectionSummary(fetcher: typeof fetch = fetch): Promise<RadarCollectionSummary[] | null> {
  try {
    const rows: (RadarObservation & { bairro: string })[] = [];
    const schema = radarObservationSchema.omit({ fonte_nome: true }).extend({ bairro: z.string(), radar_fontes: z.object({ nome: z.string() }) });
    for (let offset = 0; ; offset += 1000) {
      const url = new URL(`${RADAR_URL}/rest/v1/radar_observacoes`);
      url.searchParams.set("select", "bairro,coletado_em,periodo_inicio,periodo_fim,radar_fontes(nome),amostra_n,ativo");
      url.searchParams.set("cidade", "eq.São Paulo");
      url.searchParams.set("indicador", "eq.adr_medio_brl");
      url.searchParams.set("order", "coletado_em.desc,id.asc");
      url.searchParams.set("limit", "1000");
      url.searchParams.set("offset", String(offset));
      const response = await fetcher(url, {
        headers: { apikey: RADAR_ANON_KEY, Authorization: `Bearer ${RADAR_ANON_KEY}` },
        cache: "no-store", signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) return null;
      const parsed = z.array(schema).safeParse(await response.json());
      if (!parsed.success) return null;
      rows.push(...parsed.data.map(({ radar_fontes, ...row }) => ({ ...row, fonte_nome: radar_fontes.nome })));
      if (parsed.data.length < 1000) break;
    }
    return latestRadarCollections(rows);
  } catch { return null; }
}