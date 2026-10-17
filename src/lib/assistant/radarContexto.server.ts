import { z } from "zod";
import { radarRowSchema, type RadarRow } from "./radarData";

// Chave pública fornecida pelo Radar; permite somente leitura de dados públicos.
const RADAR_URL = "https://zxdjgifncmkvjbjmrjss.supabase.co";
const RADAR_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4ZGpnaWZuY21rdmpiam1yanNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3Njc3OTEsImV4cCI6MjA4ODM0Mzc5MX0.erbsi5xpt66U-2cYD3yrriXbyIg3cINI6wbJ9YX6LAw";
export async function readRadar(fetcher: typeof fetch = fetch): Promise<RadarRow[] | null> {
  try {
    const url = new URL(`${RADAR_URL}/rest/v1/radar_bairro_atual`);
    url.searchParams.set("select", "indicador,bairro,cidade,valor,amostra_n,periodo_inicio,periodo_fim,fonte_nome,fonte_tipo,url_origem,coletado_em,confianca,idade_dias");
    url.searchParams.set("cidade", "eq.São Paulo");
    const response = await fetcher(url, {
      headers: { apikey: RADAR_ANON_KEY, Authorization: `Bearer ${RADAR_ANON_KEY}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    const parsed = z.array(radarRowSchema).safeParse(await response.json());
    return parsed.success && parsed.data.length ? parsed.data : null;
  } catch { return null; }
}