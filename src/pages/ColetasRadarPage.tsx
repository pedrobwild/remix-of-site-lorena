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
  const revision = useRadarCollectionsUpdates();
  useEffect(() => {
    if (!revision) return;
    let active = true;
    void getRadarColetas({ data: { bairro: initialData.bairro ?? undefined } }).then((value) => {
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
              <p className="mb-6">As coletas registram as observações de diária média por bairro usadas pelo Radar Bewild, com a fonte, a data e a amostra consultada. Uma coleta ativa pode ser substituída por uma atualização; os dados não são uma promessa de resultado.</p>
              {data.resumo && data.resumo.length > 0 && (
                <div className="pt-body mb-8 max-w-full">
                  <h2>Última coleta por bairro</h2>
                  <table aria-label="Última coleta do Radar Bewild por bairro" className="!table table-fixed [&_th]:[overflow-wrap:anywhere] [&_td]:[overflow-wrap:anywhere]">
                    <thead><tr>{["Bairro", "Última coleta", "Fonte", "Amostra", "Status"].map((label) => <th key={label} scope="col" className="break-words !px-1 !text-xs sm:!px-3 sm:!text-sm">{label}</th>)}</tr></thead>
                    <tbody>{data.resumo.map((row) => (
                      <tr key={row.bairro}>
                        <th scope="row" className="break-words !px-1 !text-xs sm:!px-3 sm:!text-sm">{row.bairro}</th>
                        <td className="break-words !px-1 !text-xs sm:!px-3 sm:!text-sm"><time dateTime={row.coletado_em.slice(0, 10)}>{row.coletado_em.slice(0, 10).split("-").reverse().join("/")}</time></td>
                        <td className="break-words !px-1 !text-xs sm:!px-3 sm:!text-sm">{row.fonte_nome}</td>
                        <td className="break-words !px-1 !text-xs sm:!px-3 sm:!text-sm">{row.amostra_n === null ? "Não informada" : `n=${row.amostra_n.toLocaleString("pt-BR")}`}</td>
                        <td className="break-words !px-1 !text-xs sm:!px-3 sm:!text-sm">{row.ativo ? "Ativa" : "Substituída"}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
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
