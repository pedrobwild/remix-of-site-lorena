import { useEffect, useRef, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { curveData } from "./workflowReplicaData";

/**
 * Gráfico da aba "Evolução de Obra" (Curva S) da réplica do portal.
 *
 * Fica num arquivo próprio para a biblioteca de gráficos (recharts, ~360 kB)
 * só ser baixada quando alguém abre a aba: antes ela entrava no carregamento
 * inicial da home, em todo celular, para um gráfico que nasce escondido.
 * A moldura (`.wf-chart-frame`) tem altura fixa no CSS, então a troca do
 * espaço vazio pelo gráfico não mexe no layout.
 */

function formatChartDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function CurveTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name?: string; value?: number }>; label?: number }) {
  if (!active || !payload?.length) return null;
  return <div className="wf-tooltip"><strong>{typeof label === "number" ? formatChartDate(label) : ""}</strong><span>Etapa em execução</span>{payload.map((item) => item.value === undefined ? null : <span key={item.name}>{item.name}: {item.value}%</span>)}</div>;
}

function TodayLabel({ viewBox }: { viewBox?: { x?: number } }) {
  const x = viewBox?.x;
  const textRef = useRef<SVGTextElement | null>(null);
  const [pillWidth, setPillWidth] = useState(78);

  // A pílula acompanha o texto medido (getComputedTextLength) + 6px de respiro em cada lado.
  useEffect(() => {
    if (textRef.current) {
      const measured = Math.ceil(textRef.current.getComputedTextLength());
      if (measured > 0) setPillWidth(measured + 12);
    }
  }, []);

  if (typeof x !== "number") return null;
  return (
    <g transform={`translate(${x - pillWidth / 2},8)`}>
      <rect className="wf-reference-pill" width={pillWidth} height={18} rx={9} />
      <text ref={textRef} className="wf-reference-label" x={pillWidth / 2} y={12} textAnchor="middle">52% Execução</text>
    </g>
  );
}

export type WorkflowCurveChartProps = {
  /** Janela do eixo X (timestamps). */
  domain: [number, number];
  isMobile: boolean;
  projectStart: number;
  today: number;
  projectEnd: number;
};

export default function WorkflowCurveChart({ domain, isMobile, projectStart, today, projectEnd }: WorkflowCurveChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={curveData} margin={{ top: 27, right: 15, left: -16, bottom: 28 }}>
        <CartesianGrid vertical={false} stroke="var(--wf-border)" strokeDasharray="3 3" />
        <XAxis dataKey="timestamp" type="number" domain={domain} allowDataOverflow tickFormatter={formatChartDate} tick={{ fontSize: 8, fill: "var(--wf-muted-foreground)" }} angle={-45} textAnchor="end" height={42} axisLine={false} tickLine={false} tickCount={7} />
        <YAxis domain={[0,100]} ticks={[0,25,50,75,100]} tickFormatter={(value) => `${value}%`} tick={{ fontSize: 9, fill: "var(--wf-muted-foreground)" }} axisLine={false} tickLine={false} />
        <Tooltip content={<CurveTooltip />} />
        <ReferenceLine x={projectStart} stroke="var(--wf-muted-foreground)" strokeDasharray="4 4" label={{ value: "Início", position: "insideTopLeft", fill: "var(--wf-muted-foreground)", fontSize: 9 }} />
        <ReferenceLine x={today} stroke="var(--wf-primary)" strokeDasharray="4 4" label={<TodayLabel />} />
        <ReferenceLine x={projectEnd} stroke="var(--wf-success)" strokeDasharray="4 4" label={{ value: "Entrega", position: "insideTopRight", fill: "var(--wf-success)", fontSize: 9 }} />
        <Line type="monotone" dataKey="previsto" name="Previsto" stroke="var(--wf-primary)" strokeWidth={2} strokeOpacity={0.5} strokeDasharray="6 4" dot={{ r: 2, fill: "var(--wf-primary)" }} isAnimationActive={false} />
        <Line type="monotone" dataKey="realizado" name="Realizado" stroke="#22c55e" strokeWidth={3.5} connectNulls={false} dot={{ r: isMobile ? 2 : 4, fill: "#22c55e", stroke: "#fff", strokeWidth: isMobile ? 1 : 2 }} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
