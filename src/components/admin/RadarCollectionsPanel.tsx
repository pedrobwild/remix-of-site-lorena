import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/guia/components/ui/button";
import { getRadarColetas, type RadarColetasPage } from "@/lib/assistant/radarColetas.functions";
import { formatRadarCollections } from "@/lib/assistant/radarData";
import { useRadarCollectionsUpdates } from "@/hooks/useRadarCollectionsUpdates";

export default function RadarCollectionsPanel() {
  const [bairro, setBairro] = useState("");
  const [refresh, setRefresh] = useState(0);
  const revision = useRadarCollectionsUpdates();
  const [data, setData] = useState<RadarColetasPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(false); setData(null);
    void getRadarColetas({ data: { bairro: bairro || undefined } }).then((result) => {
      if (!active) return;
      setData(result);
      setError(result.bairros === null || (Boolean(result.bairro) && result.coletas === null));
      setLoading(false);
    }).catch(() => { if (active) { setError(true); setLoading(false); } });
    return () => { active = false; };
  }, [bairro, refresh, revision]);
  const blocks = data?.bairro && data.coletas ? formatRadarCollections(data.bairro, data.coletas).split("\n\n") : [];
  return <section aria-label="Histórico de coletas" className="min-w-0 space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h2>Histórico de coletas</h2>
      <Button variant="outline" className="min-h-11" disabled={loading} onClick={() => setRefresh((value) => value + 1)}>
        <RefreshCw aria-hidden="true" className={loading ? "animate-spin motion-reduce:animate-none" : ""} />
        {loading ? "Consultando…" : "Atualizar do Radar"}
      </Button>
    </div>
    <label className="flex flex-wrap items-center gap-3">Bairro
      <select className="min-h-11 max-w-full" disabled={loading || !data?.bairros} value={bairro} onChange={(event) => setBairro(event.target.value)}>
        <option value="">Selecione</option>
        {data?.bairros?.map((name) => <option key={name} value={name}>{name}</option>)}
      </select>
    </label>
    {loading ? <p role="status">Consultando histórico do Radar…</p> : error ? <p role="alert">O histórico de coletas está indisponível agora.</p> : <div aria-live="polite" className="space-y-4">
      {!bairro ? <p>Selecione um bairro.</p> : !data?.bairro ? <p>Este bairro não está disponível na base atual do Radar.</p> : <>
        <h3>{data.bairro}</h3>
        <ul className="grid min-w-0 gap-4 lg:grid-cols-2">{blocks.map((block, index) => <li key={index} className="min-w-0 whitespace-pre-line break-words border-t border-border pt-4">{index === 0 ? block.split("\n").slice(1).join("\n") : block}</li>)}</ul>
      </>}
    </div>}
  </section>;
}