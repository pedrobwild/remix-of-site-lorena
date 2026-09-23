/**
 * Checklist do Investidor — itens e faixas de pontuação. Fonte ÚNICA para a
 * seção interativa (ChecklistSection) e para o HTML pré-renderizado
 * (scripts/prerenderGuia.ts, em Node): por isso é dado puro, sem imports.
 */

export const CHECKLIST_ITEMS: readonly string[] = [
  "Localização com demanda comprovada",
  "Condomínio permite short stay",
  "Análise de concorrência feita",
  "Orçamento de reforma definido",
  "Projeção financeira validada",
  "Fotos profissionais planejadas",
  "Mobília funcional selecionada",
  "Plano de precificação dinâmica",
  "Gestão operacional definida",
  "Documentação fiscal em ordem",
];

export interface ChecklistTier {
  min: number;
  max: number;
  label: string;
  desc: string;
}

export const SCORE_TIERS: readonly ChecklistTier[] = [
  { min: 0, max: 3, label: "Iniciante", desc: "Você precisa amadurecer o projeto antes de investir." },
  { min: 4, max: 6, label: "Em progresso", desc: "Bom começo. Resolva os itens pendentes para reduzir riscos." },
  { min: 7, max: 8, label: "Quase pronto", desc: "Quase lá! Poucos itens faltam para investir com segurança." },
  { min: 9, max: 10, label: "Pronto para investir", desc: "Seu projeto está maduro. Hora de executar." },
];

/** Faixa correspondente à pontuação (fora das faixas → a primeira). */
export function tierDoScore(score: number): ChecklistTier {
  return SCORE_TIERS.find((t) => score >= t.min && score <= t.max) ?? SCORE_TIERS[0];
}

/** Texto corrido das faixas, para o HTML pré-renderizado. */
export function textoFaixasChecklist(): string {
  const partes = SCORE_TIERS.map((t) => {
    const faixa = t.min === 0 ? `Até ${t.max} itens` : t.min === t.max ? `Com ${t.min} itens` : `De ${t.min} a ${t.max} itens`;
    return `${faixa}, ${t.label} — ${t.desc}`;
  });
  return `A pontuação mostra o nível de preparação. ${partes.join(" ")}`;
}
