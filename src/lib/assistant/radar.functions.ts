import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { answerFromRadar, type RadarAnswer } from "./radarData";

/** Dados públicos somente leitura; consulta fresca em cada pergunta, sem números de fallback. */
export const askRadar = createServerFn({ method: "POST" })
  .inputValidator(z.object({ question: z.string().trim().min(1).max(500), previousBairros: z.array(z.string().max(100)).max(20).default([]) }))
  .handler(async ({ data }): Promise<RadarAnswer> => {
    const { readRadar } = await import("./radarContexto.server");
    const rows = await readRadar();
    if (!rows) return { market: true, bairros: [], text: "Os dados de mercado do Radar Bewild estão indisponíveis agora. Consulte o Radar Bewild; não posso informar números sem a base atual." };
    return answerFromRadar(data.question, rows, data.previousBairros);
  });