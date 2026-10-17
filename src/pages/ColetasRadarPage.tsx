import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import BwaFooter from "@/components/BwaFooter";
import BwaNav from "@/components/BwaNav";
import { formatRadarCollections } from "@/lib/assistant/radarData";
import { getRadarColetas, type RadarColetasPage } from "@/lib/assistant/radarColetas.functions";
import { useRadarCollectionsUpdates } from "@/hooks/useRadarCollectionsUpdates";
import { useSeo } from "@/lib/useSeo";
import { useNeighborhoodInterest } from "@/hooks/useNeighborhoodInterest";
import "@/styles/post.css";

/** /coletas-por-bairro — mesmo histórico público do assistente. */
export default function ColetasRadarPage({ data: initialData }: { data: RadarColetasPage }) {
  const [liveData, setLiveData] = useState<{ initial: RadarColetasPage; value: RadarColetasPage } | null>(null);
  const data = liveData?.initial === initialData ? liveData.value : initialData;
  const revision = useRadarCollectionsUpdates(Boolean(initialData.bairro));
  useEffect(() => {
    if (!revision || !initialData.bairro) return;
    let active = true;
    void getRadarColetas({ data: { bairro: initialData.bairro } }).then((value) => {
      if (active) setLiveData({ initial: initialData, value });
    }).catch(() => {
      if (active) setLiveData({ initial: initialData, value: { ...initialData, coletas: null } });
    });
    return () => { active = false; };
  }, [revision, initialData]);
  useSeo({
    title: "Coletas do Radar Bewild por bairro | Bewild",
    description: "Histórico público das coletas de diária média do Radar Bewild em cada bairro de São Paulo.",
    canonicalPath: "/coletas-por-bairro",
    ogType: "website",
  });
  const navigate = useNavigate();
  useNeighborhoodInterest(data.bairro);
  const blocks = data.bairro && data.coletas
    ? formatRadarCollections(data.bairro, data.coletas).split("\n\n")
    : [];

  return (
    <div className="bw-home bw-post">
      <BwaNav />
      <main id="main" tabIndex={-1}>
        <section className="pt-hero">
          <div className="container">
            <div className="pt-cat">Radar Bewild · Diária média</div>
            <h1 className="pt-title">Coletas por bairro.</h1>
            <p className="pt-excerpt">Escolha um bairro de São Paulo para ver as últimas 20 coletas: data, período, fonte, amostra e status.</p>
          </div>
        </section>
        <section className="container" style={{ paddingBottom: 64 }}>
          {data.bairros === null ? (
            <p role="alert">O histórico de coletas está indisponível agora.</p>
          ) : (
            <>
              <label style={{ display: "block", marginBottom: 24 }}>
                Bairro{" "}
                <select
                  aria-label="Bairro"
                  value={data.bairro ?? ""}
                  onChange={(e) => navigate({ to: "/coletas-por-bairro", search: { bairro: e.target.value || undefined } })}
                  style={{ minHeight: 44, maxWidth: "100%" }}
                >
                  <option value="">Selecione</option>
                  {data.bairros.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </label>
              {data.bairro && data.coletas === null && <p role="alert">O histórico de coletas está indisponível agora.</p>}
              {data.bairro && data.coletas && (
                <div aria-live="polite">
                  <h2>{blocks[0]?.split("\n")[0]}</h2>
                  <ul style={{ listStyle: "none", padding: 0 }}>
                    {blocks.map((block, i) => {
                      const lines = (i === 0 ? block.split("\n").slice(1) : block.split("\n"));
                      return <li key={i} style={{ marginBottom: 16, whiteSpace: "pre-line" }}>{lines.join("\n")}</li>;
                    })}
                  </ul>
                </div>
              )}
            </>
          )}
        </section>
      </main>
      <BwaFooter />
    </div>
  );
}
