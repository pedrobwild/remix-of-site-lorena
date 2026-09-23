/**
 * Bairros do /guia-do-investidor — fonte ÚNICA de dados por bairro.
 *
 * Alimenta TUDO o que mostra número de bairro no guia: a tabela de diária e
 * ocupação, "Mercado e Precificação", o simulador, os pinos, cards, ranking e
 * comparador do mapa e os polígonos (public/geo/neighborhoods.geojson, cujas
 * propriedades numéricas são IGNORADAS — o polígono só empresta o desenho).
 * Também é lido pelo pré-render (scripts/prerenderGuia.ts, em Node): por isso
 * é dado puro, sem imports.
 *
 * Antes existiam três bases com valores diferentes para o mesmo bairro
 * (guide-data.ts, districtMetrics.ts e o geojson). A consolidação seguiu uma
 * regra fixa, sem inventar número:
 *  - Diária e ocupação: valores da tabela publicada no guia (antiga
 *    BAIRRO_DATA, a mesma do HTML pré-renderizado). Para os bairros que só
 *    existiam no mapa (Barra Funda, Campo Belo, Itaquera, Jardim Paulista,
 *    Santana), valores da antiga districtMetrics.ts, sem recorte por metragem.
 *  - Score, chips de demanda, concorrência, anúncios e ROI estimado: antiga
 *    districtMetrics.ts. Liberdade e Vila Olímpia não têm esse perfil e por
 *    isso não viram pino no mapa (aparecem na tabela e no simulador).
 *  - Receita mensal NÃO é armazenada: é sempre diária média × 30 × ocupação,
 *    calculada na hora — assim nunca contradiz a diária e a ocupação exibidas.
 *
 * `fonte: "seed"` marca número provisório, a substituir por dado real. Esse
 * rótulo é só para quem mantém a base: nunca é exibido ao visitante.
 */

export const FAIXAS_METRAGEM = ["20–25 m²", "26–35 m²", "36–50 m²"] as const;
export type FaixaMetragem = (typeof FAIXAS_METRAGEM)[number];

export type ChipDemanda =
  | "Misto"
  | "Corporativo"
  | "Turismo"
  | "Turismo Premium"
  | "Eventos"
  | "Hospitais"
  | "Universidades"
  | "Próximo ao metrô";

export type Concorrencia = "Baixa" | "Média" | "Alta";

/** Origem declarada dos números (uso interno — nunca exibida). */
export type FonteDados = "guia" | "bewild-airdna-2025" | "seed";

export interface BairroMercado {
  /** Faixa de diária observada para studios no bairro (R$/noite). */
  diariaMin: number;
  diariaMax: number;
  /** Diária média (R$/noite). Ausente = ponto médio da faixa. */
  diariaMedia?: number;
  /** Ocupação média observada (%). */
  ocupacao: number;
  /** Diária média por faixa de metragem; null quando a base não tem o recorte. */
  diariaPorMetragem: Readonly<Record<FaixaMetragem, number>> | null;
  fonte: FonteDados;
}

export interface BairroPerfil {
  /** Score de rentabilidade (0–100) usado nas cores do mapa. */
  score: number;
  chips: readonly ChipDemanda[];
  concorrencia: Concorrencia;
  /** Número aproximado de studios anunciados no bairro. */
  anunciosAtivos: number;
  /**
   * ROI anual estimado (%). Estimativa ilustrativa — só pode aparecer na tela
   * acompanhada de ROI_AVISO.
   */
  roiEstimado: number;
  fonte: FonteDados;
}

export interface Bairro {
  /** Slug ASCII estável (usado como chave e no join com os polígonos). */
  id: string;
  nome: string;
  /** Centro aproximado do bairro — posição do pino no mapa. */
  centro: { lat: number; lng: number };
  mercado: BairroMercado;
  /** null = bairro sem perfil de mapa (não vira pino nem entra no ranking). */
  perfil: BairroPerfil | null;
}

/** Aviso obrigatório ao lado de qualquer ROI exibido. */
export const ROI_AVISO =
  "ROI est. é uma estimativa ilustrativa de retorno anual sobre o investimento, não uma projeção nem promessa de resultado. Confirme com os números do seu imóvel.";

const porMetragem = (a: number, b: number, c: number) =>
  ({ "20–25 m²": a, "26–35 m²": b, "36–50 m²": c }) as const;

export const BAIRROS: readonly Bairro[] = [
  {
    id: "barra-funda",
    nome: "Barra Funda",
    centro: { lat: -23.5265, lng: -46.681 },
    mercado: { diariaMin: 260, diariaMax: 420, diariaMedia: 340, ocupacao: 68, diariaPorMetragem: null, fonte: "seed" },
    perfil: { score: 80, chips: ["Eventos", "Próximo ao metrô"], concorrencia: "Média", anunciosAtivos: 1200, roiEstimado: 14.8, fonte: "seed" },
  },
  {
    id: "bela-vista",
    nome: "Bela Vista",
    centro: { lat: -23.558, lng: -46.6442 },
    mercado: { diariaMin: 240, diariaMax: 370, ocupacao: 74, diariaPorMetragem: porMetragem(220, 290, 360), fonte: "guia" },
    perfil: { score: 82, chips: ["Turismo", "Próximo ao metrô"], concorrencia: "Alta", anunciosAtivos: 2100, roiEstimado: 15.4, fonte: "seed" },
  },
  {
    id: "brooklin",
    nome: "Brooklin",
    // Centro do polígono "brooklin" de public/geo/neighborhoods.geojson.
    centro: { lat: -23.613, lng: -46.6965 },
    mercado: { diariaMin: 290, diariaMax: 430, ocupacao: 75, diariaPorMetragem: porMetragem(270, 350, 420), fonte: "guia" },
    perfil: { score: 80, chips: ["Corporativo", "Misto"], concorrencia: "Média", anunciosAtivos: 2800, roiEstimado: 12.1, fonte: "bewild-airdna-2025" },
  },
  {
    id: "campo-belo",
    nome: "Campo Belo",
    centro: { lat: -23.62, lng: -46.665 },
    mercado: { diariaMin: 300, diariaMax: 460, diariaMedia: 370, ocupacao: 69, diariaPorMetragem: null, fonte: "seed" },
    perfil: { score: 84, chips: ["Corporativo"], concorrencia: "Média", anunciosAtivos: 1100, roiEstimado: 15.0, fonte: "seed" },
  },
  {
    id: "consolacao",
    nome: "Consolação",
    centro: { lat: -23.553, lng: -46.6562 },
    mercado: { diariaMin: 260, diariaMax: 390, ocupacao: 76, diariaPorMetragem: porMetragem(240, 310, 380), fonte: "guia" },
    perfil: { score: 86, chips: ["Turismo", "Próximo ao metrô"], concorrencia: "Alta", anunciosAtivos: 2400, roiEstimado: 16.6, fonte: "seed" },
  },
  {
    id: "itaim-bibi",
    nome: "Itaim Bibi",
    centro: { lat: -23.5863, lng: -46.6762 },
    mercado: { diariaMin: 350, diariaMax: 520, ocupacao: 78, diariaPorMetragem: porMetragem(330, 420, 510), fonte: "guia" },
    perfil: { score: 91, chips: ["Corporativo", "Próximo ao metrô"], concorrencia: "Alta", anunciosAtivos: 2600, roiEstimado: 18.1, fonte: "bewild-airdna-2025" },
  },
  {
    id: "itaquera",
    nome: "Itaquera",
    centro: { lat: -23.54, lng: -46.455 },
    mercado: { diariaMin: 190, diariaMax: 320, diariaMedia: 260, ocupacao: 62, diariaPorMetragem: null, fonte: "seed" },
    perfil: { score: 78, chips: ["Eventos", "Próximo ao metrô"], concorrencia: "Baixa", anunciosAtivos: 450, roiEstimado: 13.2, fonte: "seed" },
  },
  {
    id: "jardim-paulista",
    nome: "Jardim Paulista",
    centro: { lat: -23.5636, lng: -46.6682 },
    mercado: { diariaMin: 360, diariaMax: 520, diariaMedia: 440, ocupacao: 70, diariaPorMetragem: null, fonte: "bewild-airdna-2025" },
    perfil: { score: 87, chips: ["Turismo Premium", "Turismo", "Próximo ao metrô"], concorrencia: "Alta", anunciosAtivos: 2800, roiEstimado: 17.4, fonte: "bewild-airdna-2025" },
  },
  {
    id: "liberdade",
    nome: "Liberdade",
    centro: { lat: -23.558, lng: -46.634 },
    mercado: { diariaMin: 220, diariaMax: 340, ocupacao: 73, diariaPorMetragem: porMetragem(200, 270, 330), fonte: "guia" },
    perfil: null,
  },
  {
    id: "moema",
    nome: "Moema",
    centro: { lat: -23.6013, lng: -46.6662 },
    mercado: { diariaMin: 300, diariaMax: 450, ocupacao: 77, diariaPorMetragem: porMetragem(280, 360, 440), fonte: "guia" },
    perfil: { score: 85, chips: ["Misto", "Próximo ao metrô"], concorrencia: "Média", anunciosAtivos: 1800, roiEstimado: 15.8, fonte: "seed" },
  },
  {
    id: "pinheiros",
    nome: "Pinheiros",
    centro: { lat: -23.5613, lng: -46.6917 },
    mercado: { diariaMin: 320, diariaMax: 480, ocupacao: 82, diariaPorMetragem: porMetragem(300, 380, 470), fonte: "guia" },
    perfil: { score: 92, chips: ["Misto", "Turismo", "Próximo ao metrô"], concorrencia: "Alta", anunciosAtivos: 3200, roiEstimado: 19.2, fonte: "bewild-airdna-2025" },
  },
  {
    id: "republica",
    nome: "República",
    centro: { lat: -23.543, lng: -46.643 },
    mercado: { diariaMin: 200, diariaMax: 310, ocupacao: 72, diariaPorMetragem: porMetragem(185, 245, 300), fonte: "guia" },
    perfil: { score: 79, chips: ["Turismo", "Próximo ao metrô"], concorrencia: "Alta", anunciosAtivos: 1900, roiEstimado: 13.6, fonte: "seed" },
  },
  {
    id: "santana",
    nome: "Santana",
    centro: { lat: -23.505, lng: -46.628 },
    mercado: { diariaMin: 240, diariaMax: 390, diariaMedia: 310, ocupacao: 66, diariaPorMetragem: null, fonte: "seed" },
    perfil: { score: 81, chips: ["Misto", "Próximo ao metrô"], concorrencia: "Média", anunciosAtivos: 900, roiEstimado: 14.0, fonte: "seed" },
  },
  {
    id: "vila-mariana",
    nome: "Vila Mariana",
    centro: { lat: -23.589, lng: -46.635 },
    mercado: { diariaMin: 280, diariaMax: 420, ocupacao: 80, diariaPorMetragem: porMetragem(260, 330, 410), fonte: "guia" },
    perfil: { score: 83, chips: ["Hospitais", "Universidades", "Próximo ao metrô"], concorrencia: "Média", anunciosAtivos: 1600, roiEstimado: 15.2, fonte: "seed" },
  },
  {
    id: "vila-olimpia",
    nome: "Vila Olímpia",
    // Centro do polígono "vila-olimpia" de public/geo/neighborhoods.geojson.
    centro: { lat: -23.598, lng: -46.678 },
    mercado: { diariaMin: 330, diariaMax: 500, ocupacao: 79, diariaPorMetragem: porMetragem(310, 400, 490), fonte: "guia" },
    perfil: null,
  },
];

/**
 * Polígonos de public/geo/neighborhoods.geojson (chave = `id` da feature) →
 * `id` do bairro desta base. O geojson usa recortes populares; aqui cada um
 * aponta para o distrito cujos números devem aparecer.
 */
export const POLIGONO_PARA_BAIRRO: Readonly<Record<string, string>> = {
  pinheiros: "pinheiros",
  "vila-madalena": "pinheiros", // Vila Madalena pertence ao distrito de Pinheiros
  jardins: "jardim-paulista",
  "itaim-bibi": "itaim-bibi",
  "vila-olimpia": "vila-olimpia",
  paulista: "consolacao", // "Paulista / Consolação"
  "bela-vista": "bela-vista",
  moema: "moema",
  "vila-clementino": "vila-mariana", // Vila Clementino pertence ao distrito de Vila Mariana
  "barra-funda": "barra-funda",
  brooklin: "brooklin",
};

/** Diária média do bairro (R$/noite): valor informado ou ponto médio da faixa. */
export function diariaMediaDe(m: BairroMercado): number {
  return m.diariaMedia ?? Math.round((m.diariaMin + m.diariaMax) / 2);
}

/** Receita mensal bruta de referência: diária média × 30 noites × ocupação. */
export function receitaMensalDe(m: BairroMercado): number {
  return Math.round(diariaMediaDe(m) * 30 * (m.ocupacao / 100));
}

/** Bairros em ordem alfabética (pt-BR) — ordem da tabela e dos seletores. */
export const BAIRROS_ORDENADOS: readonly Bairro[] = [...BAIRROS].sort((a, b) =>
  a.nome.localeCompare(b.nome, "pt-BR"),
);

/** Bairro pré-selecionado no simulador e em "Mercado e Precificação". */
export const BAIRRO_PADRAO_ID = "vila-mariana";
