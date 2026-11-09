// Edge function: health
// Sonda pública para monitor externo (alerta de "site sem leads" no CRM,
// uptime): 200 {ok:true} se o banco respondeu a uma consulta trivial em até
// 3 s; 503 {ok:false} se não. Nenhum dado sai daqui.
//
// Por quê: de 06/11 a 08/11/2026 o backend da Lovable Cloud ficou pausado
// (~41 h, saldo) e ninguém percebeu — o formulário falhava em silêncio.
// Runbook: backend pausado → o owner faz top-up e "Wake up" em Cloud → Overview.
import { databaseResponds, healthResponse } from "./check.ts";

const headers: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers });
  if (req.method !== "GET" && req.method !== "HEAD") {
    return new Response(JSON.stringify({ ok: false, error: "method_not_allowed" }), { status: 405, headers });
  }
  const { status, body } = healthResponse(await databaseResponds((name) => Deno.env.get(name)));
  return new Response(req.method === "HEAD" ? null : JSON.stringify(body), { status, headers });
});
