// src/data/caseStudies.ts
//
// Prova social contextual: cases reais de studios operados pela Bewild,
// versionados em código (git-reviewable) em vez de inventados em runtime.
//
// ⚠️ REGRA DE INTEGRIDADE
// Só inclua aqui cases REAIS e verificados pela Bewild. Nunca publique métricas
// de performance (ADR, ocupação, yield) sem base real — marque `verified: true`
// apenas quando os números forem confirmados. Cases sem `verified` não são
// exibidos publicamente pelo `selectCaseStudies`.

import type { InvestorProfile } from "@/guia/lib/investorQuiz";

// ── Tipos ────────────────────────────────────────────────────────

/** Região (zona) de São Paulo — agrupamento geográfico factual, não métrica. */
export type CaseRegion =
  | "Zona Oeste"
  | "Zona Sul"
  | "Centro"
  | "Zona Norte"
  | "Zona Leste"
  | "São Paulo";

export interface CaseInvestment {
  imovel: number;
  reforma: number;
  decoracao: number;
}

export interface CaseTimelineStep {
  month: string;
  label: string;
  desc: string;
}

export interface CasePhoto {
  src: string;
  alt: string;
  /** Ex.: "Antes" / "Depois" */
  label?: string;
}

export interface CaseStudy {
  id: string;
  bairro: string;
  region: CaseRegion;
  /** Metragem do studio (m²). */
  metragem: number;
  investimento: CaseInvestment;
  investimentoTotal: number;
  /** ADR alcançado (diária média, R$). */
  diaria: number;
  /** Ocupação média (%). */
  ocupacao: number;
  receitaMensal: number;
  receitaAnual: number;
  /** Ex.: "29.1%". */
  yieldBruto: string;
  paybackMeses: number;
  timeline: CaseTimelineStep[];
  /** Antes/depois — opcional. Só preencher com material real da Bewild. */
  fotos?: CasePhoto[];
  /** Apenas cases confirmados pela Bewild são exibidos publicamente. */
  verified: boolean;
  /** Usado como fallback geral quando não há match de bairro/região. */
  featured?: boolean;
}

// ── Dados ────────────────────────────────────────────────────────

const PINHEIROS_TIMELINE: CaseTimelineStep[] = [
  { month: "Mês 1–2", label: "Compra + reforma", desc: "Aquisição, reforma inteligente e marcenaria planejada" },
  { month: "Mês 3", label: "Decoração + fotos", desc: "Design premium, enxoval e sessão fotográfica profissional" },
  { month: "Mês 4", label: "Lançamento", desc: "Anúncio otimizado + preço dinâmico + primeiras reservas" },
  { month: "Mês 5–10", label: "Ramp-up", desc: "Construção de reviews, ajustes de preço, ocupação crescente" },
  { month: "Mês 11+", label: "Cruzeiro", desc: "Operação estável, receita previsível, payback atingido" },
];

/**
 * Cases reais e verificados da Bewild.
 *
 * Hoje há um único case público (Studio em Pinheiros), os mesmos números que
 * já eram exibidos no guia. Para tornar a prova social mais contextual em mais
 * bairros, adicione novos cases REAIS aqui (com `verified: true`) — o
 * `selectCaseStudies` passa a priorizá-los automaticamente pelo bairro do lead.
 */
export const CASE_STUDIES: CaseStudy[] = [
  {
    id: "pinheiros-studio-28",
    bairro: "Pinheiros",
    region: "Zona Oeste",
    metragem: 28,
    investimento: { imovel: 325000, reforma: 32000, decoracao: 28000 },
    investimentoTotal: 385000,
    diaria: 380,
    ocupacao: 82,
    receitaMensal: 9348,
    receitaAnual: 112176,
    yieldBruto: "29.1%",
    paybackMeses: 7,
    timeline: PINHEIROS_TIMELINE,
    verified: true,
    featured: true,
  },
];

// ── Mapa de regiões (geografia factual de São Paulo) ─────────────

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();

/** Bairro (normalizado) → zona. Apenas agrupamento geográfico, sem métricas. */
const BAIRRO_REGIONS: Record<string, CaseRegion> = {
  // Zona Oeste
  "pinheiros": "Zona Oeste",
  "alto de pinheiros": "Zona Oeste",
  "vila madalena": "Zona Oeste",
  "fradique coutinho": "Zona Oeste",
  "faria lima": "Zona Oeste",
  "oscar freire": "Zona Oeste",
  "perdizes": "Zona Oeste",
  "barra funda": "Zona Oeste",
  "palmeiras-barra funda": "Zona Oeste",
  // Centro
  "consolacao": "Centro",
  "bela vista": "Centro",
  "republica": "Centro",
  "se": "Centro",
  "santa cecilia": "Centro",
  "higienopolis": "Centro",
  "trianon-masp": "Centro",
  "brigadeiro": "Centro",
  // Zona Sul
  "itaim bibi": "Zona Sul",
  "jardim paulista": "Zona Sul",
  "moema": "Zona Sul",
  "vila mariana": "Zona Sul",
  "campo belo": "Zona Sul",
  "brooklin": "Zona Sul",
  "vila olimpia": "Zona Sul",
  "eucaliptos": "Zona Sul",
  "saude": "Zona Sul",
  "paraiso": "Zona Sul",
  "ibirapuera": "Zona Sul",
  // Zona Norte
  "santana": "Zona Norte",
  "mandaqui": "Zona Norte",
  // Zona Leste
  "itaquera": "Zona Leste",
  "tatuape": "Zona Leste",
  "mooca": "Zona Leste",
};

export function getRegion(bairro: string): CaseRegion {
  return BAIRRO_REGIONS[normalize(bairro)] ?? "São Paulo";
}

// ── Seleção contextual ───────────────────────────────────────────

export type MatchLevel = "bairro" | "regiao" | "geral";

export interface CaseSelection {
  cases: CaseStudy[];
  matchLevel: MatchLevel;
  /** Bairro do lead usado para o match (ou null). */
  leadBairro: string | null;
  /** Região resolvida do bairro do lead (ou null). */
  region: CaseRegion | null;
}

/**
 * Ordena cases empatados no mesmo nível de match conforme o perfil do investidor:
 * dá peso ao indicador mais relevante para a estratégia dominante do lead.
 */
function makeProfileSorter(profile?: InvestorProfile | null) {
  if (!profile) return () => 0;
  const w = profile.weights;
  const dominant = (Object.keys(w) as (keyof typeof w)[]).reduce(
    (best, key) => (w[key] > w[best] ? key : best),
    "retorno" as keyof typeof w,
  );
  const metric = (c: CaseStudy): number => {
    switch (dominant) {
      case "retorno":
        return parseFloat(c.yieldBruto) || 0;
      case "demanda":
        return c.ocupacao;
      case "operacao":
        return -c.paybackMeses; // payback menor = melhor
      case "futuro":
        return c.receitaAnual;
      default:
        return 0;
    }
  };
  return (a: CaseStudy, b: CaseStudy) => metric(b) - metric(a);
}

/**
 * Seleciona e prioriza cases pelo bairro/perfil do lead, com fallback gracioso:
 *   1. `bairro` — cases no mesmo bairro do lead;
 *   2. `regiao` — cases na mesma zona, quando não há case no bairro exato;
 *   3. `geral`  — cases em destaque (featured), quando não há bairro/região.
 *
 * Considera apenas cases verificados (`verified: true`).
 */
export function selectCaseStudies(opts: {
  bairro?: string | null;
  profile?: InvestorProfile | null;
  source?: CaseStudy[];
}): CaseSelection {
  const pool = (opts.source ?? CASE_STUDIES).filter((c) => c.verified);
  const leadBairro = opts.bairro?.trim() || null;
  const sortByProfile = makeProfileSorter(opts.profile);

  if (leadBairro && pool.length) {
    const key = normalize(leadBairro);
    const exact = pool.filter((c) => normalize(c.bairro) === key);
    if (exact.length) {
      return { cases: [...exact].sort(sortByProfile), matchLevel: "bairro", leadBairro, region: getRegion(leadBairro) };
    }
    const region = getRegion(leadBairro);
    if (region !== "São Paulo") {
      const near = pool.filter((c) => c.region === region);
      if (near.length) {
        return { cases: [...near].sort(sortByProfile), matchLevel: "regiao", leadBairro, region };
      }
    }
  }

  const featured = pool.filter((c) => c.featured);
  const general = (featured.length ? featured : pool);
  return {
    cases: [...general].sort(sortByProfile),
    matchLevel: "geral",
    leadBairro,
    region: leadBairro ? getRegion(leadBairro) : null,
  };
}
