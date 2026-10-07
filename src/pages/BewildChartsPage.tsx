/**
 * BewildChartsPage — /graficos/<slug>. Reúne os gráficos SVG de um artigo
 * (versão larga e versão para celular) com título, download e endereço para copiar.
 */
import { useState } from "react";
import BwaNav from "@/components/BwaNav";
import BwaFooter from "@/components/BwaFooter";
import { useSeo } from "@/lib/useSeo";
import { chartSrc, chartsPagePath, type ChartSet } from "@/content/chartSets";
import "@/styles/conteudos.css";
import "@/styles/graficos.css";

export default function BewildChartsPage({ set }: { set: ChartSet }) {
  const [copied, setCopied] = useState<string | null>(null);

  useSeo({
    title: `${set.title} | Bewild`,
    description: set.description,
    canonicalPath: chartsPagePath(set.slug),
    ogType: "website",
    // Indexável: a rota está no sitemap e o seoHead do servidor já emite
    // "index, follow". Um noindex aqui fazia o Googlebot (que renderiza o JS)
    // recusar a indexação (Search Console, 07/10/2026).
  });

  const copy = async (id: string, path: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      setCopied(id);
      window.setTimeout(() => setCopied((c) => (c === id ? null : c)), 2000);
    } catch {
      /* sem permissão da área de transferência: o link de download continua disponível */
    }
  };

  return (
    <>
      <div className="bw-conteudos">
        <BwaNav />
        <main id="main" tabIndex={-1}>
          <section className="ct-hero">
            <div className="ct-wrap">
              <p className="ct-eyb">Conteúdos · gráficos</p>
              <h1>{set.title}</h1>
              <p className="gf-lead">
                Os {set.charts.length} gráficos do artigo, cada um em versão larga e versão para celular.
                Baixe o arquivo ou copie o endereço para reutilizar.
              </p>
              <p>
                <a className="ct-chip" href={`/conteudos/${set.slug}`}>← Voltar ao artigo</a>
              </p>
            </div>
          </section>

          <section className="ct-body">
            <div className="ct-wrap">
              <ol className="gf-list">
                {set.charts.map((chart, i) => {
                  const desktop = chartSrc(set, chart, "desktop");
                  const mobile = chartSrc(set, chart, "mobile");
                  return (
                    <li key={chart.id} id={chart.id} className="gf-item">
                      <figure className="gf-fig">
                        <picture>
                          <source media="(max-width: 640px)" srcSet={mobile} />
                          <img src={desktop} alt={chart.title} loading={i < 2 ? "eager" : "lazy"} decoding="async" />
                        </picture>
                        <figcaption>
                          <span className="gf-num">Gráfico {i + 1}</span> {chart.title}
                        </figcaption>
                      </figure>
                      <div className="gf-actions">
                        <a className="ct-chip" href={desktop} download>Baixar SVG largo</a>
                        <a className="ct-chip" href={mobile} download>Baixar SVG celular</a>
                        <button type="button" className="ct-chip" onClick={() => copy(chart.id, desktop)}>
                          {copied === chart.id ? "Endereço copiado" : "Copiar endereço"}
                        </button>
                        <span className="gf-live" role="status" aria-live="polite">
                          {copied === chart.id ? "Endereço copiado" : ""}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </section>
        </main>
      </div>
      <BwaFooter />
    </>
  );
}
