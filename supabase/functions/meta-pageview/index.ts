// Edge function: meta-pageview
// Recebe do navegador (src/lib/metaCapiBeacon.ts) o PageView / ViewContent de
// cada página vista e manda à API de Conversões da Meta, para TODA visita
// humana, com ou sem aceite de cookies (decisão de 27/10/2026: o Pixel só
// rodava após o aceite e o conjunto "Dados bwild" recebia ~6% dos PageViews).
//
// Deduplicação: o navegador gera um `event_id` por página vista e manda o
// mesmo id aqui e no `fbq('track', ..., { eventID })` do Pixel (quando há
// aceite) — a Meta junta os dois e conta um.
//
// Identificadores: só IP + user-agent (`allowIpUaOnly`) e, quando os cookies
// `_fbp`/`_fbc` já existem (só após aceite), os dois. Nenhum dado pessoal e
// nada gravado no banco: `integration_log` recebe só falhas (volume ~1k/dia).
//
// Chave de desligamento: segredo `META_CAPI_PAGEVIEW_ENABLED=false` → 204 sem
// enviar. Token/Pixel/código de teste: `resolveMetaCapiConfig` (_shared).
//
// verify_jwt=false (supabase/config.toml): a chamada é anônima, por `fetch`
// com keepalive. A proteção é a validação estrita do corpo, o filtro de bots,
// a lista de origens do CORS e o rate limit em memória por IP.

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.45.4";
import { logIntegration } from "../_shared/integration-log.ts";
import { capiLogEntry, resolveMetaCapiConfig, sendMetaEvents, type MetaCapiConfig } from "../_shared/meta-capi.ts";
import {
  buildPageviewEvent,
  clientCountryFrom,
  clientIpFrom,
  corsHeadersFor,
  isAdminPath,
  isAllowedOrigin,
  isBotUserAgent,
  MAX_BODY_BYTES,
  pageviewCapiEnabled,
  parsePageviewRequest,
} from "../_shared/meta-pageview.ts";

const env = (name: string) => Deno.env.get(name);

/** Rate limit em memória: uma pessoa não vê mais de ~60 páginas por minuto. */
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 60;
const ipBuckets = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const fresh = (ipBuckets.get(ip) ?? []).filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
  if (fresh.length >= RATE_LIMIT_MAX) {
    ipBuckets.set(ip, fresh);
    return true;
  }
  fresh.push(now);
  ipBuckets.set(ip, fresh);
  if (ipBuckets.size > 5000) {
    for (const [k, v] of ipBuckets) {
      if (now - (v[v.length - 1] ?? 0) > RATE_LIMIT_WINDOW_MS) ipBuckets.delete(k);
    }
  }
  return false;
}

/**
 * Configuração da CAPI com memo de 60 s por instância: o Pixel e o código de
 * teste do admin vêm de `site_settings` (como em `notify-lead`), mas não vale
 * uma ida ao banco por página vista.
 */
let configMemo: { at: number; config: MetaCapiConfig | null; reason: string | null } | null = null;
const CONFIG_TTL_MS = 60_000;

async function resolveConfig(admin: SupabaseClient | null): Promise<{ config: MetaCapiConfig | null; reason: string | null }> {
  if (configMemo && Date.now() - configMemo.at < CONFIG_TTL_MS) return configMemo;
  let settings: Record<string, unknown> | null = null;
  if (admin) {
    try {
      const { data } = await admin
        .from("site_settings")
        .select("meta_pixel_id, meta_capi_test_event_code")
        .eq("id", 1)
        .maybeSingle();
      settings = (data ?? null) as Record<string, unknown> | null;
    } catch {
      settings = null;
    }
  }
  const resolved = resolveMetaCapiConfig(env, settings);
  configMemo = { at: Date.now(), config: resolved.config, reason: resolved.reason };
  return configMemo;
}

function adminClient(): SupabaseClient | null {
  const url = env("SUPABASE_URL");
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  return url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
}

Deno.serve(async (req) => {
  const cors = corsHeadersFor(req.headers.get("origin"));
  const respond = (status: number, body?: unknown) =>
    new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: body === undefined ? cors : { ...cors, "Content-Type": "application/json" },
    });

  if (req.method === "OPTIONS") return respond(204);
  if (req.method !== "POST") return respond(405, { error: "method_not_allowed" });
  // Navegador de outra origem: o CORS já esconderia a resposta, mas o evento
  // não pode nem chegar à Meta. (Chamada sem Origin passa pelos outros portões.)
  const origin = req.headers.get("origin");
  if (origin && !isAllowedOrigin(origin)) return respond(403, { error: "origin_not_allowed" });

  // Bots e chamadas sem user-agent: 204 silencioso, nada vai à Meta.
  const userAgent = (req.headers.get("user-agent") ?? "").trim();
  if (!userAgent || isBotUserAgent(userAgent)) return respond(204);

  if (!pageviewCapiEnabled(env)) return respond(204);

  const declared = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) return respond(413, { error: "payload_too_large" });

  let body: unknown;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY_BYTES) return respond(413, { error: "payload_too_large" });
    body = JSON.parse(text);
  } catch {
    return respond(400, { error: "invalid_json" });
  }

  const parsed = parsePageviewRequest(body);
  if (!parsed.ok) return respond(400, { error: parsed.error });
  if (isAdminPath(parsed.value.path)) return respond(204);

  const ip = clientIpFrom(req.headers);
  if (isRateLimited(ip ?? "unknown")) return respond(429, { error: "rate_limited" });

  const admin = adminClient();
  const { config, reason } = await resolveConfig(admin);
  if (!config) {
    // Sem token/Pixel a função não tem o que fazer; um aviso por instância basta.
    console.warn("[meta-pageview] sem configuração da CAPI:", reason);
    return respond(204);
  }

  const event = buildPageviewEvent(parsed.value, { ip, userAgent, country: clientCountryFrom(req.headers) });
  const result = await sendMetaEvents(config, [event], { allowIpUaOnly: true });

  if (result.status !== "sent") {
    // Só falhas vão ao integration_log (sem dados pessoais: nem IP nem UA).
    console.error("[meta-pageview] envio falhou", result.status === "error" ? result.httpStatus ?? result.reason : result.reason);
    await logIntegration(admin, {
      integration: "meta_capi",
      event_name: parsed.value.event,
      lead_id: null,
      ...capiLogEntry(result, { test: !!config.testEventCode }),
    });
  }

  return respond(204);
});
