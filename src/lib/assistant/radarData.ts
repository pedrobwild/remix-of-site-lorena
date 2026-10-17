import { z } from "zod";

export const radarRowSchema = z.object({
  indicador: z.string(), bairro: z.string(), cidade: z.string(), valor: z.number().finite(),
  amostra_n: z.number().nullable(), periodo_inicio: z.string().nullable(), periodo_fim: z.string().nullable(),
  fonte_nome: z.string(), fonte_tipo: z.string(), url_origem: z.string().nullable(), coletado_em: z.string(),
  confianca: z.enum(["alta", "media", "baixa"]), idade_dias: z.number().nullable(),
});
export type RadarRow = z.infer<typeof radarRowSchema>;
export type RadarAnswer = { text: string; market: boolean; bairros: string[]; history?: boolean };

export const radarObservationSchema = z.object({
  coletado_em: z.string(), periodo_inicio: z.string().nullable(), periodo_fim: z.string().nullable(),
  fonte_nome: z.string(), amostra_n: z.number().nullable(), ativo: z.boolean(),
});
export type RadarObservation = z.infer<typeof radarObservationSchema>;
export function isCollectionQuestion(question: string): boolean {
  return /\b(coleta|coletas|historico)\b/.test(normalize(question));
}

const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
export function isMarketQuestion(question: string, previousMarket = false): boolean {
  const text = normalize(question);
  return isCollectionQuestion(question) || /\b(diaria|diarias|ocupacao|adr|receita|rendimento|rentabilidade|mercado|anuncios|radar|airbnb|short stay|mediana|percentil)\b/.test(text)
    || (previousMarket && /^(e |e$|na |no |em |quanto |qual |como |compar)/.test(text));
}
const nf = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
const date = (iso: string) => iso.slice(0, 10).split("-").reverse().join("/");
const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
function period(row: Pick<RadarRow, "periodo_inicio" | "periodo_fim">): string {
  if (!row.periodo_inicio || !row.periodo_fim) return "período não informado";
  const [a, m] = row.periodo_inicio.split("-").map(Number);
  const [b, n] = row.periodo_fim.split("-").map(Number);
  return a === b ? `${months[m - 1]}–${months[n - 1]}/${b}` : `${months[m - 1]}/${a}–${months[n - 1]}/${b}`;
}
export function resolveRadarBairros(question: string, available: string[], previousBairros: string[] = [], history = false): string[] {
  const text = ` ${normalize(question)} `;
  const explicit = available.filter((bairro) => text.includes(` ${normalize(bairro)} `));
  if (explicit.length) return explicit;
  if (/\b(la|nesse bairro|neste bairro|ali)\b/.test(text) || (history && !/\b(em|na|no|do bairro|da)\b/.test(text)))
    return previousBairros.filter((bairro) => available.includes(bairro));
  return [];
}
export function formatRadarCollections(bairro: string, rows: RadarObservation[]): string {
  if (!rows.length) return `${bairro}\nNão há coletas disponíveis no Radar Bewild para este bairro.`;
  return `${bairro}\n${rows.slice(0, 20).map((row) =>
    `Coleta: ${date(row.coletado_em)}\nPeríodo: ${period(row)}\nFonte: ${row.fonte_nome}\nAmostra: n=${row.amostra_n === null ? "não informado" : nf.format(row.amostra_n)}\nStatus: ${row.ativo ? "ativa" : "substituída"}`
  ).join("\n\n")}`;
}
export function radarLabels(row: RadarRow): string[] {
  const labels: string[] = [];
  if (row.fonte_tipo === "estimativa") labels.push("estimativa");
  if (row.fonte_tipo === "publica" && row.confianca === "baixa" && row.amostra_n !== null && row.amostra_n < 200)
    labels.push(`amostra pequena · ${nf.format(row.amostra_n)} anúncios`);
  if (row.fonte_tipo === "publica" && row.idade_dias !== null && row.idade_dias > 240)
    labels.push(`dado desatualizado · coleta ${date(row.coletado_em)}`);
  return labels;
}
const indicators: Record<string, { label: string; unit: "brl" | "pct" | "count" }> = {
  adr_medio_brl: { label: "Diária média", unit: "brl" },
  ocupacao_media_pct: { label: "Ocupação média", unit: "pct" },
  adr_p25_brl: { label: "Diária (25%)", unit: "brl" },
  adr_mediana_brl: { label: "Diária mediana", unit: "brl" },
  adr_p75_brl: { label: "Diária (75%)", unit: "brl" },
  receita_anual_brl: { label: "Receita anual", unit: "brl" },
  anuncios_ativos: { label: "Anúncios ativos", unit: "count" },
};
function formatRow(row: RadarRow): string {
  const indicator = indicators[row.indicador];
  if (!indicator) return "";
  const value = nf.format(row.valor);
  const source = `${row.fonte_nome} · ${period(row)} · coleta ${date(row.coletado_em)} · n=${row.amostra_n === null ? "não informado" : nf.format(row.amostra_n)} · confiança ${row.confianca === "media" ? "média" : row.confianca}`;
  const labels = radarLabels(row);
  return `${indicator.label}: ${indicator.unit === "brl" ? `R$ ${value}` : indicator.unit === "pct" ? `${value}%` : value}\nFonte: ${source}${labels.length ? `\n${labels.join("; ")}` : ""}`;
}
export function answerFromRadar(question: string, rows: RadarRow[], previousBairros: string[] = []): RadarAnswer {
  const text = ` ${normalize(question)} `;
  const available = [...new Set(rows.map((row) => row.bairro))];
  const bairros = resolveRadarBairros(question, available, previousBairros);
  if (!bairros.length) return { market: true, bairros: [], text: "Não há dado no Radar Bewild para o bairro informado. Qual bairro você quer consultar?" };
  let wanted = ["adr_medio_brl", "ocupacao_media_pct"];
  if (/receita|rendimento|rentabilidade/.test(text)) wanted = ["receita_anual_brl"];
  else if (/anuncios/.test(text)) wanted = ["anuncios_ativos"];
  else if (/mediana|percentil|25|75/.test(text)) wanted = ["adr_p25_brl", "adr_mediana_brl", "adr_p75_brl"];
  const blocks = bairros.map((bairro) => {
    const lines = wanted.map((key) => {
      const row = rows.find((r) => r.bairro === bairro && r.indicador === key);
      return row ? formatRow(row) : `${indicators[key]?.label ?? key}: não há dado no Radar.`;
    });
    return `${bairro}\n${lines.join("\n\n")}`;
  });
  return { market: true, bairros, text: `${blocks.join("\n\n")}\n\nDados do Radar Bewild, não uma promessa de resultado.` };
}