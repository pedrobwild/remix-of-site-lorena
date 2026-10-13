/**
 * POST /api/public/crm-stage-sync — status dos leads a partir do funil do Bwild Engine.
 * Acesso: agendamento (header `x-crm-sync-secret` === CRM_SYNC_CRON_SECRET)
 * ou admin logado do painel (Bearer do usuário + public.is_admin()).
 * Agendamento: uma vez por dia (03:47 de São Paulo), job pg_cron `crm-stage-sync-full`,
 * com `{ full: true }`. O botão "Sincronizar agora" do painel segue disponível.
 * Corpo opcional `{ full: true }` = varredura completa (sem updated_since).
 * Resposta só com contagens — nunca dados pessoais.
 */
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function isAdminCaller(request: Request): Promise<boolean> {
  const auth = request.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return false;
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"];
  if (!url || !key) return false;
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        h.set("Authorization", auth);
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
  const { data: u } = await client.auth.getUser(auth.slice(7));
  if (!u?.user) return false;
  const { data, error } = await client.rpc("is_admin");
  return !error && data === true;
}

export const Route = createFileRoute("/api/public/crm-stage-sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["CRM_SYNC_CRON_SECRET"];
        const given = request.headers.get("x-crm-sync-secret");
        const byCron = !!secret && !!given && safeEqual(given, secret);
        if (!byCron && !(await isAdminCaller(request))) return json(401, { error: "não autorizado" });

        let full = false;
        try {
          const body = (await request.json()) as { full?: unknown };
          full = body?.full === true;
        } catch {
          /* sem corpo = incremental */
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { runCrmStageSync } = await import("@/lib/crmStageSync.server");
        const summary = await runCrmStageSync(supabaseAdmin, (n) => process.env[n], { full });
        return json(summary.ok ? 200 : 502, summary);
      },
    },
  },
});
