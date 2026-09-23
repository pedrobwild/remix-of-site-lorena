/**
 * Lógica pura do mapa de bairros (MapaBairrosEmbed): filtros de perfil de
 * demanda, busca, eventos futuros, limites do mapa e join dos polígonos com a
 * base única de bairros. Sem React, sem MapLibre — testável isoladamente.
 */
import type * as GeoJSON from "geojson";
import { BAIRROS, POLIGONO_PARA_BAIRRO, type Bairro } from "@/guia/data/bairros";

/* ─── Filtros de perfil de demanda ─── */

export type FiltroDemanda = "tourism" | "business" | "events" | "medical" | "mixed" | "metro";

/**
 * Cada filtro → tags (chips em minúsculas) que ele aceita. As chaves são em
 * inglês por herança do app original; as tags dos bairros são os chips em
 * português. Sem este mapa, `tags.includes("tourism")` nunca casava e todo
 * filtro devolvia zero bairros.
 */
export const TAGS_DO_FILTRO: Readonly<Record<FiltroDemanda, readonly string[]>> = {
  tourism: ["turismo", "turismo premium"],
  business: ["corporativo"],
  events: ["eventos"],
  medical: ["hospitais"],
  mixed: ["misto"],
  metro: ["próximo ao metrô"],
};

/** Minúsculas, sem acento e sem espaços nas pontas ("Consolação" → "consolacao"). */
export function normalizar(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

/**
 * Busca por nome (sem diferenciar acento/caixa) + filtros de demanda.
 * Vários filtros ativos = bairros com QUALQUER um dos perfis (OU).
 */
export function filtrarBairros<T extends { name: string; tags: readonly string[] }>(
  lista: readonly T[],
  { busca = "", filtros = [] }: { busca?: string; filtros?: readonly FiltroDemanda[] },
): T[] {
  const termo = normalizar(busca);
  const aceitas = new Set(filtros.flatMap((f) => TAGS_DO_FILTRO[f] ?? []).map(normalizar));
  return lista.filter((n) => {
    if (termo && !normalizar(n.name).includes(termo)) return false;
    if (filtros.length > 0 && !n.tags.some((t) => aceitas.has(normalizar(t)))) return false;
    return true;
  });
}

/* ─── Eventos ─── */

/**
 * Eventos que ainda não terminaram em `hojeISO` (AAAA-MM-DD), do mais próximo
 * ao mais distante. A lista de eventos é fixa; o filtro por data evita exibir
 * como "próximo" o que já passou.
 */
export function eventosFuturos<T extends { startDate: string; endDate: string }>(
  eventos: readonly T[],
  hojeISO: string,
): T[] {
  return eventos
    .filter((e) => e.endDate >= hojeISO)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

/* ─── Geometria ─── */

export type Limites = [oeste: number, sul: number, leste: number, norte: number];

/** Caixa que contém todos os pontos, com margem (graus) — usada como maxBounds. */
export function limitesDoMapa(pontos: ReadonlyArray<{ lat: number; lng: number }>, margem = 0.06): Limites {
  if (pontos.length === 0) throw new Error("limitesDoMapa: nenhum ponto informado");
  const lats = pontos.map((p) => p.lat);
  const lngs = pontos.map((p) => p.lng);
  return [
    Math.min(...lngs) - margem,
    Math.min(...lats) - margem,
    Math.max(...lngs) + margem,
    Math.max(...lats) + margem,
  ];
}

export function dentroDosLimites(p: { lat: number; lng: number }, [o, s, l, n]: Limites): boolean {
  return p.lng >= o && p.lng <= l && p.lat >= s && p.lat <= n;
}

/** Caixa grosseira do município de São Paulo — sanidade dos centros cadastrados. */
const MUNICIPIO_SP: Limites = [-46.83, -24.01, -46.36, -23.35];

/* ─── Polígonos ─── */

export interface PropriedadesPoligono {
  poligonoId: string;
  /** Nome do recorte no geojson (ex.: "Vila Madalena"). */
  poligonoNome: string;
  bairroId: string;
  /** Nome do bairro cujos números são exibidos (ex.: "Pinheiros"). */
  bairroNome: string;
  /** Score do bairro; -1 quando o bairro não tem perfil de mapa. */
  score: number;
}

/**
 * Troca as propriedades do geojson pelas da base única: cada polígono passa a
 * carregar só o id/nome do bairro e o score. As métricas antigas do arquivo
 * (diária, ocupação, ROI…) são descartadas. Polígono sem correspondência em
 * POLIGONO_PARA_BAIRRO é descartado (e acusado por `validarBaseDoMapa`).
 */
export function juntarPoligonos(
  fc: GeoJSON.FeatureCollection,
  bairros: readonly Bairro[] = BAIRROS,
  alias: Readonly<Record<string, string>> = POLIGONO_PARA_BAIRRO,
): GeoJSON.FeatureCollection<GeoJSON.Geometry, PropriedadesPoligono> {
  const porId = new Map(bairros.map((b) => [b.id, b]));
  const features: Array<GeoJSON.Feature<GeoJSON.Geometry, PropriedadesPoligono>> = [];
  for (const f of fc.features) {
    const props = (f.properties ?? {}) as Record<string, unknown>;
    const poligonoId = String(props.id ?? f.id ?? "");
    const bairro = porId.get(alias[poligonoId] ?? "");
    if (!bairro) continue;
    features.push({
      type: "Feature",
      geometry: f.geometry,
      properties: {
        poligonoId,
        poligonoNome: String(props.name ?? bairro.nome),
        bairroId: bairro.id,
        bairroNome: bairro.nome,
        score: bairro.perfil?.score ?? -1,
      },
    });
  }
  return { type: "FeatureCollection", features };
}

/**
 * Checagem de consistência da base do mapa. Devolve a lista de problemas
 * (vazia = ok). O mapa lança erro em desenvolvimento se houver algum.
 */
export function validarBaseDoMapa(
  bairros: readonly Bairro[] = BAIRROS,
  alias: Readonly<Record<string, string>> = POLIGONO_PARA_BAIRRO,
): string[] {
  const problemas: string[] = [];
  const ids = new Set<string>();
  for (const b of bairros) {
    if (ids.has(b.id)) problemas.push(`id de bairro duplicado: ${b.id}`);
    ids.add(b.id);
    const { lat, lng } = b.centro ?? ({} as { lat?: number; lng?: number });
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      problemas.push(`${b.nome}: sem centro (lat/lng) — o pino cairia fora do bairro`);
    } else if (!dentroDosLimites({ lat: lat as number, lng: lng as number }, MUNICIPIO_SP)) {
      problemas.push(`${b.nome}: centro fora do município de São Paulo`);
    }
    if (b.mercado.diariaMin > b.mercado.diariaMax) problemas.push(`${b.nome}: diariaMin > diariaMax`);
  }
  for (const [poligono, bairroId] of Object.entries(alias)) {
    if (!ids.has(bairroId)) problemas.push(`polígono ${poligono} aponta para bairro inexistente: ${bairroId}`);
  }
  return problemas;
}
