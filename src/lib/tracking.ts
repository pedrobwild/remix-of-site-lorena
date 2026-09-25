/**
 * Pixel próprio (1×1) e links rastreados — montagem dos endereços que o painel
 * entrega para copiar e leitura do resumo por campanha.
 *
 * Quem grava é a edge function `px`. As regras (campos aceitos e destinos
 * permitidos) vêm do mesmo módulo que a função usa
 * (supabase/functions/_shared/tracking.ts): o que o painel monta é
 * exatamente o que a função aceita.
 *
 * Sem dados pessoais: a contagem é por campanha. Nunca coloque e-mail, nome
 * ou id de pessoa nos campos.
 */
import { supabase } from "@/integrations/supabase/client";
import { cleanParam, REDIRECT_HOSTS, safeDestination } from "../../supabase/functions/_shared/tracking";

export { REDIRECT_HOSTS };

export type TrackingFields = {
  campaign: string;
  source: string;
  medium: string;
  content: string;
  term: string;
};

export const EMPTY_TRACKING_FIELDS: TrackingFields = { campaign: "", source: "", medium: "", content: "", term: "" };

/** Endereço da função `px` neste projeto. */
export function pxBase(supabaseUrl: string | undefined = import.meta.env.VITE_SUPABASE_URL): string {
  return `${(supabaseUrl ?? "").replace(/\/+$/, "")}/functions/v1/px`;
}

/** Campo inválido (caractere fora da regra) é apontado para o usuário corrigir. */
export function invalidFields(f: TrackingFields): (keyof TrackingFields)[] {
  return (Object.keys(f) as (keyof TrackingFields)[]).filter((k) => f[k].trim() !== "" && cleanParam(f[k]) === null);
}

function query(f: TrackingFields, extra: Record<string, string> = {}): string {
  const q = new URLSearchParams(extra);
  const pairs: [string, string][] = [
    ["c", f.campaign],
    ["s", f.source],
    ["m", f.medium],
    ["n", f.content],
    ["t", f.term],
  ];
  for (const [k, v] of pairs) {
    const clean = cleanParam(v);
    if (clean) q.set(k, clean);
  }
  return q.toString();
}

/**
 * Pixel: `open` para e-mail, `view` para página de fora do site. Exige a
 * campanha — sem ela, a contagem não diz nada.
 */
export function buildPixelUrl(f: TrackingFields, kind: "open" | "view", base = pxBase()): string | null {
  if (!cleanParam(f.campaign)) return null;
  return `${base}?${query(f, kind === "view" ? { e: "view" } : {})}`;
}

export function buildPixelTag(url: string): string {
  const safe = url.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  return `<img src="${safe}" width="1" height="1" alt="" style="display:block;border:0;width:1px;height:1px" />`;
}

export type TrackedLink = { ok: true; url: string } | { ok: false; error: string };

/** Link rastreado: conta o clique e manda para o destino (só hosts permitidos). */
export function buildTrackedLink(destination: string, f: TrackingFields, base = pxBase()): TrackedLink {
  const dest = safeDestination(destination);
  if (!dest) {
    return {
      ok: false,
      error: `Destino inválido: use um endereço https de ${REDIRECT_HOSTS.join(", ")}.`,
    };
  }
  if (!cleanParam(f.campaign)) return { ok: false, error: "Informe a campanha." };
  return { ok: true, url: `${base}/go?${query(f, { u: dest.toString() })}` };
}

// ---------------------------------------------------------------------------
// Resumo
// ---------------------------------------------------------------------------

export type HitSummaryRow = {
  campaign: string | null;
  source: string | null;
  medium: string | null;
  content: string | null;
  opens: number;
  views: number;
  clicks: number;
  bots: number;
  first_at: string;
  last_at: string;
};

export async function fetchHitSummary(since: Date, until: Date): Promise<{ rows: HitSummaryRow[]; error: string | null }> {
  const { data, error } = await supabase.rpc("tracking_hits_summary", {
    p_since: since.toISOString(),
    p_until: until.toISOString(),
  });
  if (error) return { rows: [], error: error.message };
  const rows = ((data ?? []) as Record<string, unknown>[]).map((r) => ({
    campaign: (r.campaign as string | null) ?? null,
    source: (r.source as string | null) ?? null,
    medium: (r.medium as string | null) ?? null,
    content: (r.content as string | null) ?? null,
    opens: Number(r.opens ?? 0),
    views: Number(r.views ?? 0),
    clicks: Number(r.clicks ?? 0),
    bots: Number(r.bots ?? 0),
    first_at: String(r.first_at ?? ""),
    last_at: String(r.last_at ?? ""),
  }));
  return { rows, error: null };
}

/** Último acesso gravado e quantos nos últimos 7 dias (sem robôs). */
export async function fetchPixelActivity(now = new Date()): Promise<{ lastAt: string | null; last7d: number | null; error: string | null }> {
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000).toISOString();
  const [last, count] = await Promise.all([
    supabase.from("tracking_hits").select("created_at").eq("is_bot", false).order("created_at", { ascending: false }).limit(1),
    supabase.from("tracking_hits").select("id", { count: "exact", head: true }).eq("is_bot", false).gte("created_at", weekAgo),
  ]);
  const lastRow = (last.data ?? [])[0] as { created_at?: string } | undefined;
  return {
    lastAt: lastRow?.created_at ?? null,
    last7d: count.error ? null : (count.count ?? 0),
    error: last.error?.message ?? count.error?.message ?? null,
  };
}
