// Edge function: data-export — exportação para planilha e BI (CSV ou JSON).
//
//   GET /functions/v1/data-export?dataset=meta_ads_daily&key=bwx_…
//       [&days=90 | &from=AAAA-MM-DD&to=AAAA-MM-DD] [&format=csv|json]
//       [&sep=comma|semicolon] [&dec=comma|dot]
//
// Conjuntos: leads, meta_leads, meta_ads_daily, analytics_daily e
// tracking_daily — todos SEM dados pessoais — e google_ads_offline
// (conversões offline do Google Ads: e-mail e telefone SÓ em hash SHA-256,
// gclid como está). Colunas em _shared/data-export.ts; uso em
// docs/INTEGRACOES.md › Exportação.
//
// Pública (verify_jwt = false): quem autoriza é a chave criada no painel
// (/admin/integracoes), guardada só como hash SHA-256 em `export_keys`. A
// chave vale só para os conjuntos escolhidos e pode ser revogada; vem no
// cabeçalho `x-export-key`, em `Authorization: Bearer …` ou no parâmetro
// `key` (o IMPORTDATA do Google Sheets não manda cabeçalho). Limites:
// 240 exportações por hora por chave e 60 tentativas com chave errada por
// hora por IP (o IP não é guardado).

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.45.4";
import {
  DATASETS,
  type ExportDataset,
  type ExportRecord,
  type ExportRequest,
  buildGoogleAdsOfflineRows,
  exportFilename,
  GOOGLE_ADS_GCLID_WINDOW_DAYS,
  GOOGLE_ADS_OFFLINE_SELECT,
  keyAllowsDataset,
  LEADS_SELECT,
  MAX_ROWS,
  META_ADS_SELECT,
  META_LEADS_SELECT,
  parseExportRequest,
  readExportKey,
  sha256Hex,
  toCsv,
  toExportRecord,
  toJson,
} from "../_shared/data-export.ts";

const PAGE = 1000;
const KEY_LIMIT_PER_HOUR = 240;
const BAD_KEY_LIMIT_PER_HOUR = 60;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-export-key, content-type",
};

let admin: SupabaseClient | null | undefined;
function adminClient(): SupabaseClient | null {
  if (admin !== undefined) return admin;
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  admin = url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
  return admin;
}

/** IP só para o limite de tentativas (mesma ordem do px e do notify-lead). */
function clientIp(req: Request): string {
  const edge = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-real-ip");
  if (edge) return edge.trim();
  return (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
}

function fail(status: number, message: string, json: boolean): Response {
  return new Response(json ? JSON.stringify({ error: message }) : `${message}\n`, {
    status,
    headers: {
      ...CORS,
      "Content-Type": json ? "application/json; charset=utf-8" : "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}

/** true = pode seguir. Se o limitador falhar, não bloqueia. */
async function allowed(db: SupabaseClient, key: string, max: number): Promise<boolean> {
  const { data, error } = await db.rpc("hit_rate_limit", { p_key: key, p_window_s: 3600, p_max: max });
  return error ? true : data !== false;
}

type Page = { data: unknown; error: { message: string } | null };
type KeyRow = { id: string; datasets: string[]; revoked_at: string | null };

/** Lê de 1000 em 1000 até uma página vazia (não depende do limite de linhas da API). */
async function readPaged(page: (from: number, to: number) => PromiseLike<Page>): Promise<{ rows: ExportRecord[]; error: string | null }> {
  const rows: ExportRecord[] = [];
  while (rows.length <= MAX_ROWS) {
    const { data, error } = await page(rows.length, rows.length + PAGE - 1);
    if (error) return { rows, error: error.message };
    const batch = Array.isArray(data) ? (data as ExportRecord[]) : [];
    if (!batch.length) break;
    rows.push(...batch);
  }
  return { rows, error: null };
}

async function readDataset(db: SupabaseClient, r: ExportRequest): Promise<{ rows: ExportRecord[]; error: string | null }> {
  switch (r.dataset as ExportDataset) {
    case "leads":
      return readPaged((a, b) =>
        db
          .from("leads")
          .select(LEADS_SELECT)
          .gte("created_at", r.since)
          .lt("created_at", r.until)
          .order("created_at", { ascending: true })
          .order("id", { ascending: true })
          .range(a, b),
      );
    case "meta_leads":
      return readPaged((a, b) =>
        db
          .from("meta_leads")
          .select(META_LEADS_SELECT)
          .is("deleted_at", null)
          .gte("created_time", r.since)
          .lt("created_time", r.until)
          .order("created_time", { ascending: true })
          .order("id", { ascending: true })
          .range(a, b),
      );
    case "meta_ads_daily":
      return readPaged((a, b) =>
        db
          .from("meta_ads_daily")
          .select(META_ADS_SELECT)
          .gte("date", r.from)
          .lte("date", r.to)
          .order("date", { ascending: true })
          .order("account_id", { ascending: true })
          .order("campaign_id", { ascending: true })
          .range(a, b),
      );
    case "google_ads_offline":
      return readGoogleAdsOffline(db, r);
    case "analytics_daily":
    case "tracking_daily": {
      const fn = r.dataset === "analytics_daily" ? "export_analytics_daily" : "export_tracking_daily";
      const { data, error } = await db.rpc(fn, { p_since: r.since, p_until: r.until });
      if (error) return { rows: [], error: error.message };
      return { rows: Array.isArray(data) ? (data as ExportRecord[]) : [], error: null };
    }
  }
}

/**
 * Leads qualificados ou ganhos (até 90 dias, o máximo que o Google aceita e
 * dentro do período pedido) + a primeira passagem de cada um para
 * `qualificado`. O hash e as regras ficam em buildGoogleAdsOfflineRows.
 */
async function readGoogleAdsOffline(db: SupabaseClient, r: ExportRequest): Promise<{ rows: ExportRecord[]; error: string | null }> {
  const floor = new Date(Date.now() - GOOGLE_ADS_GCLID_WINDOW_DAYS * 86_400_000).toISOString();
  const since = r.since > floor ? r.since : floor;
  const leads = await readPaged((a, b) =>
    db
      .from("leads")
      .select(GOOGLE_ADS_OFFLINE_SELECT)
      .or("status.eq.qualificado,crm_won.eq.true")
      .gte("created_at", since)
      .lt("created_at", r.until)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(a, b),
  );
  if (leads.error) return leads;

  const qualifiedAt = new Map<string, string>();
  const ids = leads.rows.filter((l) => l.status === "qualificado").map((l) => String(l.id));
  for (let i = 0; i < ids.length; i += 200) {
    const { data, error } = await db
      .from("lead_qualification_log")
      .select("lead_id, created_at")
      .in("lead_id", ids.slice(i, i + 200))
      .eq("to_status", "qualificado")
      .order("created_at", { ascending: true });
    if (error) return { rows: [], error: error.message };
    for (const row of (data ?? []) as { lead_id: string; created_at: string }[]) {
      if (!qualifiedAt.has(row.lead_id)) qualifiedAt.set(row.lead_id, row.created_at);
    }
  }
  const wonIds = leads.rows.filter((l) => l.crm_won === true).map((l) => String(l.id));
  const contracts = await readCrmContractValues(wonIds);
  return { rows: await buildGoogleAdsOfflineRows({ leads: leads.rows, qualifiedAt, contracts: contracts ?? undefined }), error: null };
}

const ENGINE_STAGES_URL = "https://pieenhgjulsrjlioozsy.supabase.co/functions/v1/site-lead-stages";
type RealContract = { total: number | null; closed_at: string | null };

/** Valor e data reais dos contratos no CRM. Qualquer falha → null (valor fica vazio). */
async function readCrmContractValues(leadIds: string[]): Promise<Map<string, RealContract[]> | null> {
  const key = Deno.env.get("BWILD_ENGINE_INTEGRATION_KEY");
  if (!key || !leadIds.length) return null;
  const out = new Map<string, RealContract[]>();
  try {
    for (let i = 0; i < leadIds.length; i += 500) {
      const ids = leadIds.slice(i, i + 500);
      const allowed = new Set(ids);
      const seen = new Set<string>();
      let cursor: string | null = null;
      do {
        const res = await fetch(ENGINE_STAGES_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-integration-key": key },
          body: JSON.stringify({ mode: "contracts", lead_ids: ids, cursor }),
          signal: AbortSignal.timeout(30_000),
        });
        if (!res.ok) {
          console.error("[data-export] crm contracts non-2xx", res.status);
          return null;
        }
        const body = (await res.json()) as { contracts?: unknown; next_cursor?: unknown };
        if (!Array.isArray(body.contracts)) return null;
        for (const raw of body.contracts as Record<string, unknown>[]) {
          const leadId = String(raw.lead_id ?? "");
          if (!allowed.has(leadId)) return null;
          const total = typeof raw.total === "number" && Number.isFinite(raw.total) ? raw.total : null;
          const closed = typeof raw.closed_at === "string" ? raw.closed_at : null;
          out.set(leadId, [...(out.get(leadId) ?? []), { total, closed_at: closed }]);
        }
        cursor = typeof body.next_cursor === "string" ? body.next_cursor : null;
        if (cursor && seen.has(cursor)) return null;
        if (cursor) seen.add(cursor);
      } while (cursor);
    }
    return out;
  } catch (err) {
    console.error("[data-export] crm contracts failed", err instanceof Error ? err.name : "unknown");
    return null;
  }
}

/** Marca o uso depois de responder, quando o runtime permite. */
function inBackground(task: Promise<unknown>): void {
  const runtime = (globalThis as { EdgeRuntime?: { waitUntil?: (p: Promise<unknown>) => void } }).EdgeRuntime;
  if (runtime?.waitUntil) runtime.waitUntil(task);
  else void task;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  const url = new URL(req.url);
  const json = url.searchParams.get("format") === "json";
  if (req.method !== "GET") return fail(405, "Use GET.", json);

  const db = adminClient();
  if (!db) return fail(503, "Exportação indisponível no momento.", json);

  const { key, provided } = readExportKey(req);
  let keyRow: KeyRow | null = null;
  if (key) {
    const { data, error } = await db
      .from("export_keys")
      .select("id, datasets, revoked_at")
      .eq("key_hash", await sha256Hex(key))
      .maybeSingle();
    if (error) {
      console.error("[data-export] key lookup failed", error.code ?? "unknown");
      return fail(500, "Não foi possível conferir a chave. Tente de novo em instantes.", json);
    }
    keyRow = data as KeyRow | null;
  }
  if (!keyRow || keyRow.revoked_at) {
    if (!(await allowed(db, `export:bad:${clientIp(req)}`, BAD_KEY_LIMIT_PER_HOUR))) {
      return fail(429, "Muitas tentativas com chave inválida. Tente mais tarde.", json);
    }
    return fail(
      401,
      provided || key
        ? "Chave inválida ou revogada. Crie outra em /admin/integracoes."
        : "Informe a chave: parâmetro key=bwx_… ou cabeçalho Authorization: Bearer bwx_…",
      json,
    );
  }

  const parsed = parseExportRequest(url);
  if (!parsed.ok) return fail(400, parsed.error, json);
  const r = parsed.value;
  if (!keyAllowsDataset(keyRow.datasets, r.dataset)) {
    return fail(403, `Esta chave não dá acesso a "${DATASETS[r.dataset].label}" (${r.dataset}).`, json);
  }
  if (!(await allowed(db, `export:key:${keyRow.id}`, KEY_LIMIT_PER_HOUR))) {
    return fail(429, `Limite de ${KEY_LIMIT_PER_HOUR} exportações por hora para esta chave. Tente mais tarde.`, r.format === "json");
  }

  const { rows, error } = await readDataset(db, r);
  if (error) {
    console.error("[data-export] read failed", r.dataset, error.slice(0, 200));
    return fail(500, "Não foi possível ler os dados agora. Tente de novo em instantes.", r.format === "json");
  }
  const truncated = rows.length > MAX_ROWS;
  const records = (truncated ? rows.slice(0, MAX_ROWS) : rows).map((row) => toExportRecord(r.dataset, row));

  inBackground(
    Promise.resolve(db.rpc("export_key_touch", { p_id: keyRow.id }))
      .then(({ error: e }) => {
        if (e) console.warn("[data-export] touch failed", e.code ?? "unknown");
      })
      .catch(() => undefined),
  );

  const body =
    r.format === "json" ? toJson(r, records, { generatedAt: new Date(), truncated }) : toCsv(r.dataset, records, { sep: r.sep, dec: r.dec });
  return new Response(body, {
    status: 200,
    headers: {
      ...CORS,
      "Content-Type": r.format === "json" ? "application/json; charset=utf-8" : "text/csv; charset=utf-8",
      "Content-Disposition": `inline; filename="${exportFilename(r)}"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
      "X-Export-Rows": String(records.length),
      ...(truncated ? { "X-Export-Truncated": "1" } : {}),
    },
  });
});
