import { useNavigate } from "@tanstack/react-router";
import BwaFooter from "@/components/BwaFooter";
import BwaNav from "@/components/BwaNav";
import { formatRadarCollections } from "@/lib/assistant/radarData";
import type { RadarColetasPage } from "@/lib/assistant/radarColetas.functions";
import { useSeo } from "@/lib/useSeo";
import "@/styles/post.css";

/** /coletas-por-bairro — mesmo histórico público do assistente (noindex). */
export default function ColetasRadarPage({ data }: { data: RadarColetasPage }) {
  useSeo({
    title: "Coletas do Radar Bewild por bairro | Bewild",
    description: "Histórico público das coletas de diária média do Radar Bewild em cada bairro de São Paulo.",
    canonicalPath: "/coletas-por-bairro",
    ogType: "website",
    noindex: true,
  });
  const navigate = useNavigate();
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
