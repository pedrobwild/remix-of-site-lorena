/**
 * /admin/integracoes — o que está ligado entre o site, a Meta, o Google e o
 * CRM, e o último sinal de cada integração. Regras puras (testadas) + a
 * leitura do `integration_log`.
 *
 * Fontes: `site_settings` (IDs de Pixel/Google Ads/GA4/GTM), `integration_log`
 * (cada envio à API de Conversões e cada rodada do meta-sync, sem dados
 * pessoais), `meta_sync_state` e `tracking_hits` (pixel próprio).
 */
import { supabase } from "@/integrations/supabase/client";
import { metaSyncSummary, relativeTime, type MetaSyncStateRow } from "@/lib/metaAds";

export type Tone = "ok" | "warn" | "error" | "off";

export type IntegrationStatus = {
  key: string;
  label: string;
  tone: Tone;
  /** Palavra curta do estado: "Ativo", "Falta o token"… */
  value: string;
  detail: string;
  href?: string;
  hrefLabel?: string;
};

export type IntegrationSettings = {
  meta_pixel_id: string | null;
  meta_capi_test_event_code: string | null;
  google_ads_conversion_id: string | null;
  google_ads_lead_label: string | null;
  google_ads_contact_label: string | null;
  google_analytics_id: string | null;
  google_tag_manager_id: string | null;
};

export type IntegrationLogRow = {
  id: number;
  created_at: string;
  integration: string;
  event_name: string | null;
  lead_id: string | null;
  status: string;
  http_status: number | null;
  detail: unknown;
};

const SEO_PIXELS = "/admin/seo";

function filled(v: string | null | undefined): v is string {
  return typeof v === "string" && v.trim() !== "";
}

export function pixelStatus(s: IntegrationSettings): IntegrationStatus {
  return filled(s.meta_pixel_id)
    ? {
        key: "meta_pixel",
        label: "Meta — Pixel (navegador)",
        tone: "ok",
        value: "Ativo",
        detail: `Pixel ${s.meta_pixel_id}: PageView, ViewContent, Contact e Lead, só após o aceite de cookies.`,
        href: SEO_PIXELS,
        hrefLabel: "configurar",
      }
    : {
        key: "meta_pixel",
        label: "Meta — Pixel (navegador)",
        tone: "off",
        value: "Não configurado",
        detail: "Sem ID do Pixel em SEO › Analytics & Pixels.",
        href: SEO_PIXELS,
        hrefLabel: "configurar",
      };
}

function detailOf(row: IntegrationLogRow): Record<string, unknown> {
  return row.detail && typeof row.detail === "object" ? (row.detail as Record<string, unknown>) : {};
}

const CAPI_SKIP_REASON: Record<string, string> = {
  no_token: "Falta o token: salve META_CAPI_ACCESS_TOKEN (ou META_ADS_ACCESS_TOKEN) nos segredos do projeto.",
  no_pixel: "Falta o ID do Pixel em SEO › Analytics & Pixels.",
  no_user_agent: "Envio sem navegador identificado (não conta como erro).",
  no_user_data: "Lead sem e-mail nem telefone válidos para a Meta.",
};

/** Últimos 30 dias do `integration_log` da API de Conversões (mais recente primeiro). */
export function capiStatus(s: IntegrationSettings, logs: readonly IntegrationLogRow[], now = Date.now()): IntegrationStatus {
  const base = { key: "meta_capi", label: "Meta — API de Conversões", href: SEO_PIXELS, hrefLabel: "código de teste" };
  const capi = logs.filter((l) => l.integration === "meta_capi");
  if (!filled(s.meta_pixel_id)) {
    return { ...base, tone: "off", value: "Sem Pixel", detail: "A API de Conversões usa o mesmo Pixel do site — configure o ID primeiro." };
  }
  const test = filled(s.meta_capi_test_event_code) ? " · modo de teste LIGADO (apague o código depois de homologar)" : "";
  if (!capi.length) {
    return {
      ...base,
      tone: "off",
      value: "Aguardando",
      detail: `Nenhum envio ainda: começa no primeiro lead de cliente com cookies aceitos${test}.`,
    };
  }
  const last = capi[0];
  const sent30 = capi.filter((l) => l.status === "sent" && now - new Date(l.created_at).getTime() <= 30 * 86_400_000).length;
  if (last.status === "sent") {
    return {
      ...base,
      tone: test ? "warn" : "ok",
      value: "Enviando",
      detail: `Último envio ${relativeTime(last.created_at, now)} · ${sent30} evento(s) aceito(s) em 30 dias${test}.`,
    };
  }
  const reason = String(detailOf(last).reason ?? "");
  if (last.status === "skipped") {
    return {
      ...base,
      tone: reason === "no_user_agent" || reason === "no_user_data" ? "ok" : "warn",
      value: reason === "no_token" ? "Falta o token" : "Pulado",
      detail: CAPI_SKIP_REASON[reason] ?? `Último envio pulado (${reason || "sem motivo"}).`,
    };
  }
  const code = detailOf(last).error_code;
  return {
    ...base,
    tone: "error",
    value: "Com erro",
    detail: `Último envio falhou ${relativeTime(last.created_at, now)}${code ? ` (código ${String(code)} da Meta)` : ""}; os leads seguem chegando normalmente.`,
  };
}

export function metaAdsStatus(states: readonly MetaSyncStateRow[], now = Date.now()): IntegrationStatus {
  const sync = metaSyncSummary(states, now);
  return {
    key: "meta_sync",
    label: "Meta — campanhas e formulários",
    tone: sync.tone,
    value: sync.tone === "ok" ? "Sincronizado" : sync.tone === "off" ? "Não conectado" : sync.tone === "warn" ? "Atenção" : "Com erro",
    detail: sync.hint ? `${sync.label} · ${sync.hint}` : `${sync.label} · a cada 30 min.`,
    href: "/admin/analytics?tab=paid",
    hrefLabel: "mídia paga",
  };
}

export function googleAdsStatus(s: IntegrationSettings): IntegrationStatus {
  const base = { key: "google_ads", label: "Google Ads", href: SEO_PIXELS, hrefLabel: "configurar" };
  if (!filled(s.google_ads_conversion_id)) {
    return { ...base, tone: "off", value: "Não configurado", detail: "Sem ID da conta (AW-…) em SEO › Analytics & Pixels." };
  }
  if (!filled(s.google_ads_lead_label)) {
    return {
      ...base,
      tone: "warn",
      value: "Sem conversão de lead",
      detail: `Tag ${s.google_ads_conversion_id} no ar, mas falta o rótulo da conversão de lead.`,
    };
  }
  return {
    ...base,
    tone: "ok",
    value: "Ativo",
    detail: `Tag ${s.google_ads_conversion_id} · lead ✓ · contato ${filled(s.google_ads_contact_label) ? "✓" : "— (sem rótulo)"}.`,
  };
}

export function googleAnalyticsStatus(s: IntegrationSettings): IntegrationStatus {
  const ids = [s.google_analytics_id, s.google_tag_manager_id].filter(filled);
  return ids.length
    ? {
        key: "google_analytics",
        label: "Google Analytics / Tag Manager",
        tone: "ok",
        value: "Ativo",
        detail: `${ids.join(" · ")} — carregados só após o aceite de cookies.`,
        href: SEO_PIXELS,
        hrefLabel: "configurar",
      }
    : {
        key: "google_analytics",
        label: "Google Analytics / Tag Manager",
        tone: "off",
        value: "Não configurado",
        detail: "Sem ID do GA4 nem do GTM (o site continua medindo com o analytics próprio).",
        href: SEO_PIXELS,
        hrefLabel: "configurar",
      };
}

export function pixelProprioStatus(lastAt: string | null, last7d: number | null, now = Date.now()): IntegrationStatus {
  const base = { key: "px", label: "Pixel próprio e links rastreados" };
  if (!lastAt) {
    return { ...base, tone: "off", value: "Sem acessos", detail: "Monte um pixel ou link abaixo e use num e-mail, página ou QR code." };
  }
  return {
    ...base,
    tone: "ok",
    value: "Recebendo",
    detail: `Último acesso ${relativeTime(lastAt, now)}${last7d != null ? ` · ${last7d} nos últimos 7 dias` : ""}.`,
  };
}

// ---------------------------------------------------------------------------
// Registro
// ---------------------------------------------------------------------------

export const INTEGRATION_LABEL: Record<string, string> = {
  meta_capi: "Meta · API de Conversões",
  meta_sync: "Meta · sincronização",
};

const REASON_LABEL: Record<string, string> = {
  no_token: "sem token",
  no_pixel: "sem Pixel",
  no_user_agent: "sem navegador",
  no_user_data: "sem e-mail/telefone",
  token_invalid: "token expirado ou inválido",
  permission: "sem permissão",
  rate_limit: "limite da Meta",
  not_found: "não encontrado",
  bad_request: "pedido recusado",
  server: "Meta fora do ar",
  timeout: "tempo esgotado",
  network: "falha de rede",
  internal: "erro interno",
};

/** Uma linha curta para o detalhe de cada envio (sem dados pessoais — só o que a tabela guarda). */
export function logDetail(row: IntegrationLogRow): string {
  const d = detailOf(row);
  const parts: string[] = [];
  if (typeof d.reason === "string") parts.push(REASON_LABEL[d.reason] ?? d.reason);
  if (d.error_code != null) parts.push(`código ${String(d.error_code)}`);
  if (typeof d.events_received === "number") parts.push(`${d.events_received} evento(s) aceito(s)`);
  if (typeof d.rows === "number") parts.push(`${d.rows} linha(s)`);
  if (typeof d.inserted === "number") parts.push(`${d.inserted} lead(s) novo(s)`);
  if (typeof d.notified === "number" && d.notified > 0) parts.push(`${d.notified} avisado(s)`);
  if (d.backfill === true) parts.push("carga inicial");
  if (d.test === true) parts.push("modo de teste");
  if (Array.isArray(d.failures) && d.failures.length) parts.push(`falhas: ${d.failures.slice(0, 3).join(", ")}`);
  if (typeof d.fbtrace_id === "string") parts.push(`fbtrace ${d.fbtrace_id}`);
  return parts.join(" · ") || "—";
}

export async function fetchIntegrationLog(limit = 200): Promise<{ rows: IntegrationLogRow[]; error: string | null }> {
  const { data, error } = await supabase
    .from("integration_log")
    .select("id, created_at, integration, event_name, lead_id, status, http_status, detail")
    .order("created_at", { ascending: false })
    .limit(limit);
  return { rows: (data ?? []) as IntegrationLogRow[], error: error?.message ?? null };
}

export async function fetchIntegrationSettings(): Promise<{ settings: IntegrationSettings | null; error: string | null }> {
  const { data, error } = await supabase
    .from("site_settings")
    .select(
      "meta_pixel_id, meta_capi_test_event_code, google_ads_conversion_id, google_ads_lead_label, google_ads_contact_label, google_analytics_id, google_tag_manager_id",
    )
    .eq("id", 1)
    .maybeSingle();
  return { settings: (data ?? null) as IntegrationSettings | null, error: error?.message ?? null };
}
