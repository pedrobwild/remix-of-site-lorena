// Edge function: px — pixel próprio (1×1) e links rastreados.
//
//   GET /functions/v1/px?c=campanha&s=origem&m=meio&n=conteudo&t=termo
//       → GIF transparente de 1×1 e um acesso "open" (e-mail). Com `e=view`,
//         conta como visualização (pixel numa página de fora do site).
//   GET /functions/v1/px/go?u=https://bewild.com.br/...&c=...&s=...
//       → 302 para o destino (só hosts da lista em _shared/tracking.ts; no
//         site, os parâmetros viram utm_*) e um acesso "click".
//
// Sem dados pessoais (ver _shared/tracking.ts): nada de IP, e-mail ou cookie.
// O IP só entra na chave do limite de gravações (hit_rate_limit) e não é
// guardado. Pública (verify_jwt = false): a resposta nunca depende do banco —
// se a gravação falhar, o GIF e o redirecionamento saem do mesmo jeito.

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.45.4";
import {
  FALLBACK_URL,
  type HitKind,
  hitRow,
  PIXEL_GIF,
  readTrackParams,
  safeDestination,
  withUtms,
} from "../_shared/tracking.ts";

const NO_STORE = "no-store, no-cache, must-revalidate, private, max-age=0";

let admin: SupabaseClient | null | undefined;
function adminClient(): SupabaseClient | null {
  if (admin !== undefined) return admin;
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  admin = url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
  return admin;
}

/** IP só para o limite de gravações (mesma ordem do notify-lead). */
function clientIp(req: Request): string {
  const edge = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-real-ip");
  if (edge) return edge.trim();
  return (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
}

async function record(req: Request, kind: HitKind, target: URL | null, url: URL): Promise<void> {
  const db = adminClient();
  if (!db) return;
  try {
    // Até 300 acessos gravados por IP a cada 10 min: um loop ou robô não
    // enche a tabela (a resposta ao visitante é a mesma).
    const { data: ok } = await db.rpc("hit_rate_limit", {
      p_key: `px:ip:${clientIp(req)}`,
      p_window_s: 600,
      p_max: 300,
    });
    if (ok === false) return;
    const row = hitRow(kind, readTrackParams(url), {
      userAgent: req.headers.get("user-agent"),
      country: req.headers.get("cf-ipcountry"),
      referer: req.headers.get("referer"),
      target,
    });
    const { error } = await db.from("tracking_hits").insert(row);
    if (error) console.warn("[px] insert failed", error.code ?? "unknown");
  } catch {
    /* gravar nunca atrasa nem quebra a resposta */
  }
}

/** Grava depois de responder, quando o runtime permite; senão, espera. */
async function inBackground(task: Promise<void>): Promise<void> {
  const runtime = (globalThis as { EdgeRuntime?: { waitUntil?: (p: Promise<unknown>) => void } }).EdgeRuntime;
  if (runtime?.waitUntil) {
    runtime.waitUntil(task);
    return;
  }
  await task;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS" },
    });
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    return new Response("method not allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const isGo = /\/go\/?$/.test(url.pathname);

  if (isGo) {
    const dest = safeDestination(url.searchParams.get("u"));
    const location = dest ? withUtms(dest, readTrackParams(url)).toString() : FALLBACK_URL;
    // Destino inválido não vira acesso: só manda para o site.
    if (dest && req.method === "GET") await inBackground(record(req, "click", dest, url));
    return new Response(null, {
      status: 302,
      headers: { Location: location, "Cache-Control": NO_STORE, "Referrer-Policy": "strict-origin-when-cross-origin" },
    });
  }

  const kind: HitKind = url.searchParams.get("e") === "view" ? "view" : "open";
  if (req.method === "GET") await inBackground(record(req, kind, null, url));
  return new Response(req.method === "HEAD" ? null : PIXEL_GIF, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": String(PIXEL_GIF.byteLength),
      "Cache-Control": NO_STORE,
      Pragma: "no-cache",
      Expires: "0",
      "Access-Control-Allow-Origin": "*",
      "Cross-Origin-Resource-Policy": "cross-origin",
    },
  });
});
