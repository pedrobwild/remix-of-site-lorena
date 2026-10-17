import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { answerFromRadar, formatRadarCollections, isCollectionQuestion, resolveRadarBairros, type RadarAnswer } from "./radarData";

/** Dados públicos somente leitura; consulta fresca em cada pergunta, sem números de fallback. */
export const askRadar = createServerFn({ method: "POST" })
  .inputValidator(z.object({ question: z.string().trim().min(1).max(500), previousBairros: z.array(z.string().max(100)).max(20).default([]), previousHistory: z.boolean().default(false) }))
  .handler(async ({ data }): Promise<RadarAnswer> => {
    const { readRadar, readRadarCollections } = await import("./radarContexto.server");
    const history = isCollectionQuestion(data.question) || (data.previousHistory && /^(e\s|na\s|no\s|em\s)/i.test(data.question));
    const rows = await readRadar();
    if (history) {
      const unavailable = "O histórico de coletas do Radar Bewild está indisponível agora.";
      if (!rows) return { market: true, history: true, bairros: data.previousBairros, text: unavailable };
      const bairros = resolveRadarBairros(data.question, [...new Set(rows.map((row) => row.bairro))], data.previousBairros, true);
      if (!bairros.length) return { market: true, history: true, bairros: [], text: "Qual bairro de São Paulo você quer consultar no histórico de coletas?" };
      const blocks: string[] = [];
      for (const bairro of bairros) {
        const observations = await readRadarCollections(bairro);
        if (!observations) return { market: true, history: true, bairros, text: unavailable };
        blocks.push(formatRadarCollections(bairro, observations));
      }
      return { market: true, history: true, bairros, text: blocks.join("\n\n") };
    }
    if (!rows) return { market: true, bairros: [], text: "Os dados de mercado do Radar Bewild estão indisponíveis agora. Consulte o Radar Bewild; não posso informar números sem a base atual." };
    return answerFromRadar(data.question, rows, data.previousBairros);
  });