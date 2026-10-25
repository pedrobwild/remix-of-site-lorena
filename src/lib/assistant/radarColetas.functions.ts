import { createServerFn } from "@tanstack/react-start";
import { inputBairro } from "@/lib/lightValidators";
import type { RadarObservation } from "./radarData";

export type RadarColetasPage = {
  bairros: string[] | null;
  bairro: string | null;
  coletas: RadarObservation[] | null;
};

/** Leitura pública do Radar Bewild: lista de bairros + até 20 coletas do bairro escolhido. */
export const getRadarColetas = createServerFn({ method: "GET" })
  .inputValidator(inputBairro)
  .handler(async ({ data }): Promise<RadarColetasPage> => {
    const { readRadar, readRadarCollections } = await import("./radarContexto.server");
    const rows = await readRadar();
    if (!rows) return { bairros: null, bairro: null, coletas: null };
    const bairros = [...new Set(rows.map((r) => r.bairro))].sort((a, b) => a.localeCompare(b, "pt-BR"));
    const bairro = data.bairro && bairros.includes(data.bairro) ? data.bairro : null;
    if (!bairro) return { bairros, bairro: null, coletas: [] };
    const coletas = await readRadarCollections(bairro);
    return { bairros, bairro, coletas: coletas ? coletas.slice(0, 20) : null };
  });
