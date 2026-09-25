/**
 * Exportação para planilha e BI — chaves (criar, listar, revogar) e os
 * endereços que o painel entrega para copiar.
 *
 * Quem entrega os dados é a edge function `data-export`; os conjuntos e as
 * colunas vêm do mesmo módulo que ela usa (supabase/functions/_shared/data-export.ts).
 * A chave completa só existe no momento da criação — o banco guarda o hash.
 */
import { supabase } from "@/integrations/supabase/client";
import { DATASETS, EXPORT_DATASETS, type ExportDataset } from "../../supabase/functions/_shared/data-export";

export { DATASETS, EXPORT_DATASETS, type ExportDataset };

export type ExportKeyRow = {
  id: string;
  name: string;
  prefix: string;
  datasets: string[];
  created_at: string;
  created_by_email: string | null;
  last_used_at: string | null;
  use_count: number;
  revoked_at: string | null;
};

export type CreatedExportKey = { id: string; token: string; prefix: string; name: string; datasets: ExportDataset[] };

/** Endereço da função `data-export` neste projeto. */
export function exportBase(supabaseUrl: string | undefined = import.meta.env.VITE_SUPABASE_URL): string {
  return `${(supabaseUrl ?? "").replace(/\/+$/, "")}/functions/v1/data-export`;
}

export type ExportLinkKind = "csv" | "excel" | "json";

/**
 * - csv: Google Sheets (IMPORTDATA), Looker Studio (pela planilha), Power BI
 *   e Excel em "Obter dados › Da Web" — vírgula e decimal com vírgula.
 * - excel: arquivo para abrir direto no Excel em português (ponto e vírgula).
 * - json: Power BI e integrações.
 */
export function buildExportUrl(dataset: ExportDataset, token: string, kind: ExportLinkKind = "csv", base = exportBase()): string {
  const q = new URLSearchParams({ dataset });
  if (kind === "excel") q.set("sep", "semicolon");
  if (kind === "json") q.set("format", "json");
  q.set("key", token);
  return `${base}?${q.toString()}`;
}

/** Fórmula do Google Sheets — um argumento só, funciona em planilha em português ou inglês. */
export function importDataFormula(url: string): string {
  return `=IMPORTDATA("${url.replace(/"/g, "%22")}")`;
}

export function datasetLabel(d: string): string {
  return (DATASETS as Record<string, { label: string }>)[d]?.label ?? d;
}

export async function fetchExportKeys(): Promise<{ keys: ExportKeyRow[]; error: string | null }> {
  const { data, error } = await supabase
    .from("export_keys")
    .select("id, name, prefix, datasets, created_at, created_by_email, last_used_at, use_count, revoked_at")
    .order("created_at", { ascending: false });
  return {
    keys: ((data ?? []) as ExportKeyRow[]).map((k) => ({ ...k, use_count: Number(k.use_count ?? 0) })),
    error: error?.message ?? null,
  };
}

export async function createExportKey(
  name: string,
  datasets: readonly ExportDataset[],
): Promise<{ key: CreatedExportKey | null; error: string | null }> {
  const clean = name.trim();
  if (!clean) return { key: null, error: "Dê um nome à chave (para quem ou para qual planilha ela é)." };
  if (clean.length > 80) return { key: null, error: "Nome com até 80 caracteres." };
  const picked = EXPORT_DATASETS.filter((d) => datasets.includes(d));
  if (!picked.length) return { key: null, error: "Escolha pelo menos um conjunto de dados." };
  const { data, error } = await supabase.rpc("create_export_key", { p_name: clean, p_datasets: [...picked] });
  if (error) return { key: null, error: error.message };
  const row = (Array.isArray(data) ? data[0] : data) as { id?: string; token?: string; prefix?: string } | null;
  if (!row?.id || !row.token || !row.prefix) return { key: null, error: "A chave não voltou do banco. Tente de novo." };
  return { key: { id: row.id, token: row.token, prefix: row.prefix, name: clean, datasets: picked }, error: null };
}

export async function revokeExportKey(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc("revoke_export_key", { p_id: id });
  return { error: error?.message ?? null };
}
