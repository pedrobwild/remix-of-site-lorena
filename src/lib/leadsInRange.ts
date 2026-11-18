/**
 * Pedidos (tabela `leads`) num intervalo, por canal — leitura do painel
 * /admin/analytics. Os pedidos não dependem do aceite de cookies: são a
 * contagem real, ao contrário das sessões do tracker próprio.
 *
 * - Canal pela regra única de `leadSource.ts` (`leadCanal`).
 * - Leads de teste do time (`isTestLead`) ficam fora do total e voltam
 *   contados à parte, para o painel dizer quantos tirou.
 * - Paginado de 1.000 em 1.000 (teto de 20.000), como o cartão antigo.
 */
import { supabase } from "@/integrations/supabase/client";
import { LEAD_CANAIS, isTestLead, leadCanal, type LeadCanal } from "@/lib/leadSource";

export type LeadCounts = {
  byCanal: Record<LeadCanal, number>;
  /** Pedidos válidos (sem os de teste). */
  total: number;
  /** Pedidos de teste deixados de fora. */
  tests: number;
};

const PAGE = 1000;
const COLS =
  "id,name,lead_source,gclid,fbclid,utm_source,utm_medium,utm_campaign,first_utm_source,first_utm_medium,referrer";

export function emptyLeadCounts(): LeadCounts {
  return { byCanal: Object.fromEntries(LEAD_CANAIS.map((c) => [c, 0])) as Record<LeadCanal, number>, total: 0, tests: 0 };
}

/** Soma pura (testável): canal por lead, testes à parte. */
export function countLeads(rows: readonly Record<string, string | null>[], acc: LeadCounts = emptyLeadCounts()): LeadCounts {
  for (const r of rows) {
    if (isTestLead(r)) {
      acc.tests++;
      continue;
    }
    acc.byCanal[leadCanal(r)]++;
    acc.total++;
  }
  return acc;
}

/**
 * Lê os pedidos criados em [from, until]. `untilInclusive` segue o cartão
 * antigo (`lte` no fim do dia escolhido); janelas "até agora" usam `lt`.
 */
export async function fetchLeadCounts(
  from: Date,
  until: Date,
  opts: { untilInclusive?: boolean; privacyOnly?: boolean } = {},
): Promise<LeadCounts> {
  const acc = emptyLeadCounts();
  for (let offset = 0; offset < 20_000; offset += PAGE) {
    let query = supabase.from("leads").select(COLS).gte("created_at", from.toISOString());
    query = opts.untilInclusive ? query.lte("created_at", until.toISOString()) : query.lt("created_at", until.toISOString());
    if (opts.privacyOnly) query = query.eq("form_path", "/orcamento").eq("privacy_visited_before_submit", true);
    const { data, error } = await query
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(offset, offset + PAGE - 1);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as unknown as Record<string, string | null>[];
    countLeads(rows, acc);
    if (rows.length < PAGE) break;
  }
  return acc;
}
