/**
 * Meta no painel — leitura do que a edge function `meta-sync` grava a cada
 * 30 minutos:
 *  - `meta_ads_daily`: métricas diárias por campanha (investimento, cliques,
 *    leads que a Meta atribui);
 *  - `meta_leads`: leads dos formulários instantâneos (Lead Ads);
 *  - `meta_sync_state`: última rodada de cada parte, para o painel dizer se a
 *    integração está no ar, desatualizada ou com erro.
 *
 * Aqui ficam as regras puras (somas, série por dia, rótulos, estado da
 * sincronização) e as consultas. As telas: bloco "Mídia paga" da Visão geral
 * (BewildOverviewPage), aba "Mídia paga" do Analytics (PaidMediaTab) e aba
 * "Formulários Meta" dos Leads (MetaLeadsPanel).
 *
 * Números da Meta, nunca estimados: sem sincronização, as telas mostram
 * "não conectado" em vez de zeros.
 */
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type MetaAdsDailyRow = Database["public"]["Tables"]["meta_ads_daily"]["Row"];
export type MetaLeadRecord = Database["public"]["Tables"]["meta_leads"]["Row"];
export type MetaSyncStateRow = Database["public"]["Tables"]["meta_sync_state"]["Row"];

type DailyInput = Pick<
  MetaAdsDailyRow,
  "date" | "campaign_id" | "campaign_name" | "currency" | "spend" | "impressions" | "clicks" | "link_clicks" | "leads" | "form_leads" | "site_leads" | "conversations"
>;

// ---------------------------------------------------------------------------
// Somas
// ---------------------------------------------------------------------------

export type AdsTotals = {
  spend: number;
  impressions: number;
  clicks: number;
  linkClicks: number;
  /** Total da Meta (formulário + site). */
  leads: number;
  formLeads: number;
  siteLeads: number;
  conversations: number;
  /** Cliques no link ÷ impressões, em %. */
  ctr: number | null;
  /** Investimento ÷ cliques no link. */
  cpc: number | null;
  cpm: number | null;
  /** Investimento ÷ leads (total da Meta). */
  cpl: number | null;
  currency: string;
};

function n(v: unknown): number {
  const x = typeof v === "number" ? v : Number(v);
  return Number.isFinite(x) ? x : 0;
}

export function sumAdsDaily(rows: readonly DailyInput[]): AdsTotals {
  let spend = 0;
  let impressions = 0;
  let clicks = 0;
  let linkClicks = 0;
  let leads = 0;
  let formLeads = 0;
  let siteLeads = 0;
  let conversations = 0;
  let currency: string | null = null;
  for (const r of rows) {
    spend += n(r.spend);
    impressions += n(r.impressions);
    clicks += n(r.clicks);
    linkClicks += n(r.link_clicks);
    leads += n(r.leads);
    formLeads += n(r.form_leads);
    siteLeads += n(r.site_leads);
    conversations += n(r.conversations);
    currency ??= r.currency;
  }
  spend = Math.round(spend * 100) / 100;
  return {
    spend,
    impressions,
    clicks,
    linkClicks,
    leads,
    formLeads,
    siteLeads,
    conversations,
    ctr: impressions ? (linkClicks / impressions) * 100 : null,
    cpc: linkClicks ? spend / linkClicks : null,
    cpm: impressions ? (spend / impressions) * 1000 : null,
    cpl: leads ? spend / leads : null,
    currency: currency ?? "BRL",
  };
}

export type CampaignTotals = AdsTotals & { campaignId: string; campaignName: string };

/** Uma linha por campanha, a de maior investimento primeiro. */
export function campaignsFromDaily(rows: readonly DailyInput[]): CampaignTotals[] {
  const groups = new Map<string, DailyInput[]>();
  for (const r of rows) {
    const list = groups.get(r.campaign_id);
    if (list) list.push(r);
    else groups.set(r.campaign_id, [r]);
  }
  return [...groups.entries()]
    .map(([campaignId, list]) => {
      // O nome mais recente (a campanha pode ter sido renomeada no período).
      const latest = [...list].sort((a, b) => (a.date < b.date ? 1 : -1)).find((r) => r.campaign_name)?.campaign_name;
      return { ...sumAdsDaily(list), campaignId, campaignName: latest ?? `Campanha ${campaignId}` };
    })
    .sort((a, b) => b.spend - a.spend || b.leads - a.leads);
}

export type DailyAdsPoint = { day: string; spend: number; leads: number; linkClicks: number; impressions: number };

/** Dia a dia de `fromDay` a `toDay` (inclusive), com zero nos dias sem entrega. */
export function dailyAdsSeries(rows: readonly DailyInput[], fromDay: string, toDay: string): DailyAdsPoint[] {
  const byDay = new Map<string, DailyAdsPoint>();
  for (const r of rows) {
    const p = byDay.get(r.date) ?? { day: r.date, spend: 0, leads: 0, linkClicks: 0, impressions: 0 };
    p.spend = Math.round((p.spend + n(r.spend)) * 100) / 100;
    p.leads += n(r.leads);
    p.linkClicks += n(r.link_clicks);
    p.impressions += n(r.impressions);
    byDay.set(r.date, p);
  }
  const out: DailyAdsPoint[] = [];
  for (let d = fromDay; d <= toDay; d = shiftDay(d, 1)) {
    out.push(byDay.get(d) ?? { day: d, spend: 0, leads: 0, linkClicks: 0, impressions: 0 });
    if (out.length > 800) break;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Datas
// ---------------------------------------------------------------------------

/** YYYY-MM-DD no fuso do navegador (o mesmo da conta de anúncios, São Paulo). */
export function localDayOf(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function shiftDay(day: string, delta: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + delta)).toISOString().slice(0, 10);
}

/** "2026-09-24" → "24/09". */
export function fmtDayShort(day: string): string {
  const [, m, d] = day.split("-");
  return `${d}/${m}`;
}

// ---------------------------------------------------------------------------
// Leads do site vindos da Meta
// ---------------------------------------------------------------------------

export const META_UTM_SOURCES = ["facebook", "fb", "instagram", "ig", "meta"] as const;

/** Lead do site que chegou por anúncio/link da Meta (utm_source ou clique de anúncio). */
export function isMetaSiteLead(l: { utm_source?: string | null; fbclid?: string | null }): boolean {
  if (l.fbclid) return true;
  const s = (l.utm_source ?? "").trim().toLowerCase();
  return (META_UTM_SOURCES as readonly string[]).includes(s);
}

/** Filtro PostgREST equivalente a `isMetaSiteLead` (para contagens no banco). */
export const META_SITE_LEAD_FILTER = [
  "fbclid.not.is.null",
  ...META_UTM_SOURCES.map((s) => `utm_source.ilike.${s}`),
].join(",");

// ---------------------------------------------------------------------------
// Estado da sincronização
// ---------------------------------------------------------------------------

export type SyncTone = "ok" | "warn" | "error" | "off";

export type MetaSyncSummary = {
  tone: SyncTone;
  /** Frase curta: "sincronizado há 12 min", "não conectado"… */
  label: string;
  /** O que fazer, quando há algo a fazer. */
  hint: string | null;
  connected: boolean;
  lastSuccessAt: string | null;
};

/** Sem sucesso há mais que isso (o cron roda a cada 30 min) = desatualizado. */
export const SYNC_STALE_MS = 2 * 3_600_000;

export function relativeTime(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return "—";
  const ms = now - new Date(iso).getTime();
  if (!Number.isFinite(ms)) return "—";
  const min = Math.round(ms / 60_000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 48) return `há ${h} h`;
  return `há ${Math.round(h / 24)} dias`;
}

/** "token_invalid: …" → "token_invalid"; "parcial: …" → "partial". */
export function metaErrorReason(lastError: string | null | undefined): string | null {
  if (!lastError) return null;
  if (lastError === "no_token") return "no_token";
  if (lastError.startsWith("parcial")) return "partial";
  const m = lastError.match(/^([a-z_]+):/);
  return m ? m[1] : "unknown";
}

export function metaErrorHint(reason: string | null): string | null {
  switch (reason) {
    case null:
      return null;
    case "no_token":
      return "Falta o token da Meta: salve o segredo META_ADS_ACCESS_TOKEN (token de usuário do sistema) no projeto.";
    case "token_invalid":
      return "O token da Meta expirou ou foi revogado: gere um novo token de usuário do sistema e atualize o segredo.";
    case "permission":
      return "O token não tem permissão: ads_read para as campanhas; leads_retrieval e acesso à Página para os formulários.";
    case "rate_limit":
      return "A Meta limitou as consultas por alguns minutos; a próxima rodada tenta de novo.";
    case "not_found":
      return "Conta de anúncios, Página ou formulário não encontrado com este token.";
    case "partial":
      return "Parte dos formulários não pôde ser lida; a próxima rodada relê o mesmo período.";
    case "timeout":
    case "network":
    case "server":
      return "A Meta não respondeu; a próxima rodada tenta de novo.";
    default:
      return "A Meta recusou a consulta; veja o detalhe do erro.";
  }
}

/** Resumo das duas partes ("ads" e "leads") para uma linha de status. */
export function metaSyncSummary(states: readonly MetaSyncStateRow[], now = Date.now()): MetaSyncSummary {
  if (!states.length) {
    return {
      tone: "off",
      label: "ainda não sincronizado",
      hint: "A sincronização roda a cada 30 min depois que o token da Meta é salvo no projeto.",
      connected: false,
      lastSuccessAt: null,
    };
  }
  const reasons = states.map((s) => metaErrorReason(s.last_error));
  const successes = states
    .map((s) => s.last_success_at)
    .filter((v): v is string => !!v)
    .sort();
  const lastSuccessAt = successes.length ? successes[successes.length - 1] : null;
  if (reasons.every((r) => r === "no_token")) {
    return { tone: "off", label: "não conectado", hint: metaErrorHint("no_token"), connected: false, lastSuccessAt };
  }
  const failing = states.filter((_, i) => reasons[i] && reasons[i] !== "no_token");
  if (failing.length) {
    const reason = reasons.find((r) => r && r !== "no_token") ?? null;
    const part = failing.length === states.length ? "" : failing[0].key === "ads" ? " (métricas)" : " (formulários)";
    return {
      tone: reason === "partial" || reason === "rate_limit" ? "warn" : "error",
      label: `erro na última sincronização${part}`,
      hint: metaErrorHint(reason),
      connected: !!lastSuccessAt,
      lastSuccessAt,
    };
  }
  if (!lastSuccessAt || now - new Date(lastSuccessAt).getTime() > SYNC_STALE_MS) {
    return {
      tone: "warn",
      label: lastSuccessAt ? `sem sincronizar ${relativeTime(lastSuccessAt, now)}` : "aguardando a primeira sincronização",
      hint: "O agendamento a cada 30 min pode estar parado. Use “Sincronizar agora”.",
      connected: !!lastSuccessAt,
      lastSuccessAt,
    };
  }
  return { tone: "ok", label: `sincronizado ${relativeTime(lastSuccessAt, now)}`, hint: null, connected: true, lastSuccessAt };
}

// ---------------------------------------------------------------------------
// Leads dos formulários — rótulos
// ---------------------------------------------------------------------------

export const META_PLATFORM_LABEL: Record<string, string> = {
  fb: "Facebook",
  ig: "Instagram",
  msg: "Messenger",
  an: "Audience Network",
  wa: "WhatsApp",
};

export function platformLabel(p: string | null | undefined): string | null {
  if (!p) return null;
  return META_PLATFORM_LABEL[p.toLowerCase()] ?? p;
}

/** "+5511912345678" → "(11) 91234-5678"; estrangeiro fica em E.164. */
export function displayMetaPhone(e164: string | null | undefined): string | null {
  if (!e164) return null;
  const d = e164.replace(/\D/g, "");
  if (d.startsWith("55") && (d.length === 12 || d.length === 13)) {
    const x = d.slice(2);
    return x.length === 11 ? `(${x.slice(0, 2)}) ${x.slice(2, 7)}-${x.slice(7)}` : `(${x.slice(0, 2)}) ${x.slice(2, 6)}-${x.slice(6)}`;
  }
  return e164;
}

export function metaWaLink(e164: string | null | undefined): string | null {
  const d = (e164 ?? "").replace(/\D/g, "");
  return d.length >= 10 && d.length <= 15 ? `https://wa.me/${d}` : null;
}

export type MetaLeadAnswer = { key: string; label: string; value: string };

export function leadAnswers(answers: unknown): MetaLeadAnswer[] {
  if (!Array.isArray(answers)) return [];
  return answers.flatMap((a) => {
    if (!a || typeof a !== "object") return [];
    const { key, label, value } = a as Record<string, unknown>;
    if (typeof value !== "string" || !value.trim()) return [];
    return [{ key: String(key ?? ""), label: typeof label === "string" && label ? label : String(key ?? ""), value }];
  });
}

const OUTCOME_LABEL: Record<string, string> = { sent: "✓", skipped: "—", error: "erro" };

/** O que aconteceu com o aviso deste lead (Slack, e-mail, CRM). */
export function notifySummary(notify: unknown): string {
  if (notify === null || notify === undefined) return "aviso pendente (sai na próxima sincronização)";
  if (typeof notify !== "object") return "—";
  const n = notify as Record<string, unknown>;
  if (n.skipped === "backfill") return "importado sem aviso (carga inicial)";
  if (n.skipped === "old") return "importado sem aviso (chegou com mais de 72h)";
  if (n.state === "sending") return "aviso em envio";
  const parts = (["slack", "email", "crm"] as const)
    .filter((k) => typeof n[k] === "string")
    .map((k) => `${k === "email" ? "e-mail" : k === "crm" ? "CRM" : "Slack"} ${OUTCOME_LABEL[String(n[k])] ?? String(n[k])}`);
  return parts.length ? parts.join(" · ") : "—";
}

// ---------------------------------------------------------------------------
// Consultas
// ---------------------------------------------------------------------------

const DAILY_COLS =
  "date, campaign_id, campaign_name, currency, spend, impressions, clicks, link_clicks, leads, form_leads, site_leads, conversations";

export async function fetchAdsDaily(fromDay: string, toDay: string): Promise<{ rows: DailyInput[]; error: string | null }> {
  const out: DailyInput[] = [];
  const PAGE = 1000;
  for (let from = 0; from < 20_000; from += PAGE) {
    const { data, error } = await supabase
      .from("meta_ads_daily")
      .select(DAILY_COLS)
      .gte("date", fromDay)
      .lte("date", toDay)
      .order("date", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) return { rows: out, error: error.message };
    out.push(...((data ?? []) as DailyInput[]));
    if (!data || data.length < PAGE) break;
  }
  return { rows: out, error: null };
}

export async function fetchMetaSyncStates(): Promise<{ states: MetaSyncStateRow[]; error: string | null }> {
  const { data, error } = await supabase.from("meta_sync_state").select("*");
  return { states: (data ?? []) as MetaSyncStateRow[], error: error?.message ?? null };
}

export type MetaPaidSummary = {
  totals: AdsTotals;
  hasRows: boolean;
  /** Leads recebidos pelos formulários instantâneos no período. */
  formLeads: number | null;
  /** Leads do site com utm_source da Meta ou clique de anúncio. */
  siteLeadsFromMeta: number | null;
  states: MetaSyncStateRow[];
  error: string | null;
};

/** Resumo do período para o bloco "Mídia paga" da Visão geral. */
export async function fetchMetaPaidSummary(since: Date, until: Date): Promise<MetaPaidSummary> {
  const sinceIso = since.toISOString();
  const untilIso = until.toISOString();
  const [daily, states, forms, site] = await Promise.all([
    fetchAdsDaily(localDayOf(since), localDayOf(until)),
    fetchMetaSyncStates(),
    supabase
      .from("meta_leads")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .eq("is_test", false)
      .gte("created_time", sinceIso)
      .lte("created_time", untilIso),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .gte("created_at", sinceIso)
      .lte("created_at", untilIso)
      .or(META_SITE_LEAD_FILTER),
  ]);
  return {
    totals: sumAdsDaily(daily.rows),
    hasRows: daily.rows.length > 0,
    formLeads: forms.error ? null : (forms.count ?? 0),
    siteLeadsFromMeta: site.error ? null : (site.count ?? 0),
    states: states.states,
    error: daily.error ?? states.error ?? forms.error?.message ?? null,
  };
}

/** Botão "Sincronizar agora": chama o `meta-sync` com o JWT do admin. */
export async function triggerMetaSync(): Promise<{ ok: boolean; message: string }> {
  try {
    const { data, error } = await supabase.functions.invoke("meta-sync", { body: {} });
    if (error) return { ok: false, message: error.message || "A sincronização falhou." };
    const d = (data ?? {}) as {
      ads?: { status?: string; rows?: number; reason?: string };
      leads?: { status?: string; inserted?: number; notified?: number; reason?: string };
    };
    if (d.ads?.reason === "no_token" && d.leads?.reason === "no_token") {
      return { ok: false, message: metaErrorHint("no_token") ?? "Token da Meta ausente." };
    }
    const parts: string[] = [];
    if (d.ads) {
      parts.push(
        d.ads.status === "ok"
          ? `métricas: ${d.ads.rows ?? 0} linha(s) atualizada(s)`
          : `métricas: ${metaErrorHint(d.ads.reason ?? "unknown") ?? d.ads.status}`,
      );
    }
    if (d.leads) {
      parts.push(
        d.leads.status === "ok" || d.leads.status === "partial"
          ? `formulários: ${d.leads.inserted ?? 0} lead(s) novo(s)${d.leads.notified ? `, ${d.leads.notified} avisado(s)` : ""}${d.leads.status === "partial" ? " (leitura parcial)" : ""}`
          : `formulários: ${metaErrorHint(d.leads.reason ?? "unknown") ?? d.leads.status}`,
      );
    }
    const ok = d.ads?.status !== "error" && d.leads?.status !== "error";
    return { ok, message: parts.join(" · ") || "Sincronização concluída." };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "A sincronização falhou." };
  }
}
