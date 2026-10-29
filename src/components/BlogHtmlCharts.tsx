import { type CSSProperties, type ReactNode } from "react";
import parse, { domToReact, Element, type DOMNode, type HTMLReactParserOptions } from "html-react-parser";
import { chavesCharts, CHAVES_SLUG, chavesChartKeyFromUrl, type ChavesChartKey } from "@/content/chavesCharts";
import "@/styles/blog-charts.css";

const number = (value: number) => value.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
const money = (value: number) => `R$ ${number(value)}`;
const geometry = (values: Record<string, number>) => Object.fromEntries(Object.entries(values).map(([key, value]) => [`--${key}`, value])) as CSSProperties;
const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
// Mantém o arredondamento dos SVGs (12,5% → 12%) sem alterar as contagens reais.
export const chartPercent = (count: number, total: number) => total ? Math.round((count / total * 100) - Number.EPSILON * 100) : 0;

function Frame({ chartKey, children, subtitle }: { chartKey: ChavesChartKey; children: ReactNode; subtitle: string }) {
  const chart = chavesCharts[chartKey];
  return <figure className="blog-chart" data-chart={chart.id} aria-label={chart.title}>
    <header><h3>{chart.title}</h3><p>{subtitle}</p></header>
    {children}<figcaption>{chart.source}</figcaption>
  </figure>;
}

function RangePlot({ rows, max, monetary = false }: { rows: { label: string; median: number; count: number; q1?: number; q3?: number; above50?: number; bandTop?: number; bandHeight?: number }[]; max: number; monetary?: boolean }) {
  return <div className="blog-chart__ranges">
    {rows.map((row) => <div className="blog-chart__range" key={row.label}>
      <strong>{monetary ? money(row.median) : `${number(row.median)} m²`}</strong>
      <div className="blog-chart__plot" aria-hidden="true">
        <span className="blog-chart__band" style={geometry({ top: row.q3 !== undefined ? (1 - row.q3 / max) * 100 : ((row.bandTop ?? 70) - 70) / 2, height: row.q1 !== undefined && row.q3 !== undefined ? (row.q3 - row.q1) / max * 100 : (row.bandHeight ?? 0) / 2 })} />
        <span className="blog-chart__median" style={geometry({ top: (1 - row.median / max) * 100 })} />
      </div>
      <span>{row.label}</span><small>n = {row.count}{row.above50 !== undefined ? ` · ${row.above50}% acima de 50 m²` : ""}</small>
      {row.q1 !== undefined && row.q3 !== undefined ? <small>Q1–Q3: {number(row.q1)}–{number(row.q3)} m²</small> : null}
    </div>)}
  </div>;
}

export function BlogHtmlChart({ chartKey }: { chartKey: ChavesChartKey }) {
  if (chartKey === "pedidos") {
    const data = chavesCharts.pedidos; const total = sum(data.rows.map((row) => row.count));
    return <Frame chartKey={chartKey} subtitle={`${total} pedidos com resposta (${data.period})`}>
      <div className="blog-chart__bars">{data.rows.map((row, index) => <div className="blog-chart__bar-row" key={row.label}>
        <span>{row.label}</span><div className="blog-chart__track"><span className={`blog-chart__fill tone-${index === 0 ? 1 : 0}`} style={geometry({ width: row.count / total * 100 })} /></div><strong>{chartPercent(row.count, total)}% ({row.count})</strong>
      </div>)}</div><p>{data.missing} pedidos não informaram a situação.</p>
    </Frame>;
  }
  if (chartKey === "metragem") return <Frame chartKey={chartKey} subtitle={`Mediana e metade central (Q1–Q3), ${sum(chavesCharts.metragem.rows.map((row) => row.count))} pedidos com m²`}><RangePlot rows={chavesCharts.metragem.rows} max={80} /><p>Caixa = metade central; traço = mediana. Eixo de 0 a 80 m².</p></Frame>;
  if (chartKey === "objetivos") {
    const data = chavesCharts.objetivos;
    return <Frame chartKey={chartKey} subtitle={`Objetivo declarado por situação das chaves (${sum(data.rows.map((row) => sum(row.counts)))} pedidos)`}>
      <div className="blog-chart__bars">{data.rows.map((row) => <div className="blog-chart__stack-row" key={row.label}><span>{row.label}</span>
        <div className="blog-chart__stack">{row.counts.map((count, index) => count > 0 ? <span key={data.categories[index]} className={`tone-${index}`} style={geometry({ width: count / sum(row.counts) * 100 })} title={`${data.categories[index]}: ${chartPercent(count, sum(row.counts))}% (${count})`}>{count / sum(row.counts) >= .1 ? `${chartPercent(count, sum(row.counts))}%` : ""}</span> : null)}</div><strong>{sum(row.counts)}</strong>
        <ul className="blog-chart__details">{row.counts.map((count, index) => <li key={data.categories[index]}>{data.categories[index]}: {chartPercent(count, sum(row.counts))}% ({count})</li>)}</ul>
      </div>)}</div><div className="blog-chart__legend">{data.categories.map((label, index) => <span key={label}><i className={`tone-${index}`} />{label}</span>)}</div>
    </Frame>;
  }
  if (chartKey === "tempo") {
    const data = chavesCharts.tempo;
    return <Frame chartKey={chartKey} subtitle="Semanas em relação à entrega das chaves (semana 0); premissas da Bewild, não promessa">
      <div className="blog-chart__timelines">{data.rows.map((row) => {
        let start = row.start;
        return <div key={row.label}><strong>{row.label}</strong><div className="blog-chart__timeline"><span className="blog-chart__keys" aria-hidden="true" />
          {row.durations.map((duration, index) => { const left = start; start += duration + (index === 1 ? row.gapAfterProject : 0); return <span key={data.stages[index]} className={`blog-chart__stage tone-${index === 1 ? 0 : index === 4 ? 1 : index === 2 ? 2 : 3}`} style={geometry({ left: (left + 10) / 42 * 100, width: duration / 42 * 100 })} title={`${data.stages[index]}: ${duration} semana(s)`}>{index === 1 || index === 4 ? data.stages[index] : ""}</span>; })}
        </div><p>Pronto: semana {row.ready} · faixa de {row.range[0]} a {row.range[1]} semanas após as chaves.</p></div>;
      })}<div className="blog-chart__axis"><span>−8 semanas</span><span>Chaves (0)</span><span>+16</span><span>+32</span></div></div><p>{data.note}</p>
    </Frame>;
  }
  if (chartKey === "espera") {
    const data = chavesCharts.espera; const max = Math.max(...data.rows.map((row) => row.max));
    return <Frame chartKey={chartKey} subtitle={`Cenário ilustrativo: ${data.area} m², contrato mediano de ${money(data.contract)}`}>
      <div className="blog-chart__bars">{data.rows.map((row, index) => <div className="blog-chart__cost-row" key={row.label}><span>{row.label}</span><div className="blog-chart__track"><span className={`blog-chart__fill tone-${index === 0 ? 1 : index === 1 ? 0 : 2}`} style={geometry({ width: row.max / max * 100 })} /><span className="blog-chart__uncertainty" style={geometry({ left: row.min / max * 100, width: (row.max - row.min) / max * 100 })} /></div><strong>{money(row.min)}{row.max !== row.min ? ` a ${money(row.max)}` : ""}/mês</strong></div>)}</div><p>Para quem vai morar, troque o aluguel não recebido pelo aluguel que continua pagando.</p>
    </Frame>;
  }
  const data = chavesCharts.orcamento;
  return <Frame chartKey={chartKey} subtitle={`Mediana e metade central (Q1–Q3), ${sum(data.rows.map((row) => row.count))} contratos`}><RangePlot rows={data.rows} max={140000} monetary /><p>Reta ajustada: {money(data.fixed)} fixos + {money(data.perM2)} por m². Acima de 45 m² a base tem só {data.omitted} contratos. Eixo de R$ 0 a R$ 140 mil.</p></Frame>;
}

function imageKey(node: unknown): ChavesChartKey | undefined {
  if (!(node instanceof Element)) return undefined;
  if (node.name === "img") return chavesChartKeyFromUrl(node.attribs.src ?? "");
  for (const child of node.children) { const key = imageKey(child); if (key) return key; }
  return undefined;
}

/** Substitui somente as mídias registradas; nenhum HTML não sanitizado entra aqui. */
export function BlogArticleBody({ html, slug }: { html: string; slug: string }) {
  if (slug !== CHAVES_SLUG) return <div className="pt-body" dangerouslySetInnerHTML={{ __html: html }} />;
  const options: HTMLReactParserOptions = { replace(node) {
    if (!(node instanceof Element)) return;
    if (["figure", "picture", "p"].includes(node.name)) {
      const key = imageKey(node);
      const mediaOnly = node.name !== "p" || node.children.every((child) => child.type === "text" ? !child.data.trim() : child instanceof Element && ["img", "picture", "a"].includes(child.name));
      if (key && mediaOnly) return <><BlogHtmlChart chartKey={key} />{node.name === "figure" ? node.children.filter((child) => child instanceof Element && child.name === "figcaption").map((child, index) => <div key={index}>{domToReact(child instanceof Element ? child.children.filter((part): part is DOMNode => part.type !== "cdata") : [])}</div>) : null}</>;
    }
    if (node.name === "img") { const key = chavesChartKeyFromUrl(node.attribs.src ?? ""); if (key) return <BlogHtmlChart chartKey={key} />; }
  } };
  return <div className="pt-body">{parse(html, options)}</div>;
}