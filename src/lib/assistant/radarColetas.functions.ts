import { createServerFn } from "@tanstack/react-start";
import { inputBairro } from "@/lib/lightValidators";
import type { RadarCollectionSummary, RadarObservation } from "./radarData";

export type RadarColetasPage = {
  bairros: string[] | null;
  bairro: string | null;
  coletas: RadarObservation[] | null;
  resumo?: RadarCollectionSummary[] | null;
};

/** Leitura pública do Radar Bewild: lista de bairros + até 20 coletas do bairro escolhido. */
export const getRadarColetas = createServerFn({ method: "GET" })
  .inputValidator(inputBairro)
  .handler(async ({ data }): Promise<RadarColetasPage> => {
    const { readRadar, readRadarCollections, readRadarCollectionSummary } = await import("./radarContexto.server");
    const [rows, resumo] = await Promise.all([readRadar(), readRadarCollectionSummary()]);
    if (!rows && !resumo?.length) return { bairros: null, bairro: null, coletas: null, resumo: null };
    const bairros = [...new Set([...(rows ?? []).map((r) => r.bairro), ...(resumo ?? []).map((r) => r.bairro)])].sort((a, b) => a.localeCompare(b, "pt-BR"));
    const bairro = data.bairro && bairros.includes(data.bairro) ? data.bairro : null;
    if (!bairro) return { bairros, bairro: null, coletas: [], resumo };
    const coletas = await readRadarCollections(bairro);
    return { bairros, bairro, coletas: coletas ? coletas.slice(0, 20) : null, resumo };
  });
