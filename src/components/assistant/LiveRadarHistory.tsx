import { useEffect, useState } from "react";
import { getRadarColetas } from "@/lib/assistant/radarColetas.functions";
import { formatRadarCollections } from "@/lib/assistant/radarData";
import { useRadarCollectionsUpdates } from "@/hooks/useRadarCollectionsUpdates";

export default function LiveRadarHistory({ bairros, initialAnswer }: { bairros: string[]; initialAnswer: string }) {
  const revision = useRadarCollectionsUpdates(bairros.length > 0);
  const [answer, setAnswer] = useState(initialAnswer);
  useEffect(() => {
    if (!revision || !bairros.length) return;
    let active = true;
    void Promise.all(bairros.map((bairro) => getRadarColetas({ data: { bairro } }))).then((results) => {
      if (!active) return;
      if (results.some((result) => !result.bairro || result.coletas === null)) {
        setAnswer("O histórico de coletas do Radar Bewild está indisponível agora.");
        return;
      }
      setAnswer(results.map((result) => result.bairro && result.coletas ? formatRadarCollections(result.bairro, result.coletas) : "").join("\n\n"));
    }).catch(() => { if (active) setAnswer("O histórico de coletas do Radar Bewild está indisponível agora."); });
    return () => { active = false; };
  }, [revision, bairros]);
  return <p className="bwa-radar-answer-text">{answer}</p>;
}