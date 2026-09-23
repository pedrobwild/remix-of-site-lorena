// Edge function: enviar-nutricao
// Envia o modelo `nutricao-conteudo` para os leads qualificados a partir da
// fila public.nutricao_envios. A fila é carregada e agendada fora daqui.
//
// Acesso:
//  - cron interno (header x-cron-key === INDEX_TRACKER_CRON_KEY)
//  - admin logado (JWT + public.is_admin())
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { EmailAPIError } from "npm:@lovable.dev/email-js@0.1.0";
import { sendTemplateEmail } from "../_shared/transactional-email-templates/send-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const CRON_KEY = Deno.env.get("INDEX_TRACKER_CRON_KEY");

const REPLY_TO = "contato@bewild.com.br";
const PAUSA_MS = 1200;
const TEMPO_MAX_MS = 100_000;
const MAX_TENTATIVAS = 3;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Confere se a capa responde 200 com content-type de imagem (timeout de 5 s). */
async function capaOk(url: string): Promise<boolean> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 5000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    const tipo = res.headers.get("content-type") ?? "";
    // Descarta o corpo para não deixar a conexão pendurada.
    await res.body?.cancel();
    return res.ok && res.status === 200 && tipo.toLowerCase().startsWith("image/");
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  // --- autorização ---
  const cronKey = req.headers.get("x-cron-key");
  if (CRON_KEY && cronKey && cronKey === CRON_KEY) {
    // cron interno
  } else {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json(401, { error: "não autorizado" });
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) return json(401, { error: "não autorizado" });
    const { data: isAdmin } = await userClient.rpc("is_admin");
    if (!isAdmin) return json(403, { error: "somente administradores" });
  }

  let limit = 12;
  try {
    const body = await req.json();
    if (body && Number.isFinite(body.limit)) limit = Math.min(30, Math.max(1, Number(body.limit)));
  } catch {
    // sem corpo: usa o padrão
  }

  const inicio = Date.now();

  const { data: fila, error: erroFila } = await admin
    .from("nutricao_envios")
    .select("id, email, template_data, idempotency_key, tentativas")
    .eq("status", "pendente")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (erroFila) return json(500, { error: `Falha ao ler a fila: ${erroFila.message}` });

  const linhas = fila ?? [];

  // --- checagem das capas (uma vez por URL distinta no lote) ---
  const cacheCapa = new Map<string, boolean>();
  for (const linha of linhas) {
    const dados = (linha.template_data ?? {}) as Record<string, unknown>;
    const capa = typeof dados.coverUrl === "string" ? dados.coverUrl : "";
    if (capa && !cacheCapa.has(capa)) cacheCapa.set(capa, await capaOk(capa));
  }

  let enviados = 0;
  let suprimidos = 0;
  let erros = 0;
  let parado_por_limite = false;

  for (const linha of linhas) {
    if (Date.now() - inicio > TEMPO_MAX_MS) break;

    // Trava a linha: só segue quem ainda estava 'pendente'.
    const { data: travada } = await admin
      .from("nutricao_envios")
      .update({ status: "enviando" })
      .eq("id", linha.id)
      .eq("status", "pendente")
      .select("id");
    if (!travada || travada.length === 0) continue;

    const dados = { ...((linha.template_data ?? {}) as Record<string, unknown>) };
    const capa = typeof dados.coverUrl === "string" ? dados.coverUrl : "";
    if (capa && cacheCapa.get(capa) === false) {
      const alternativa = dados.coverFallbackUrl;
      dados.coverUrl = typeof alternativa === "string" ? alternativa : undefined;
    }

    try {
      const resultado = await sendTemplateEmail("nutricao-conteudo", linha.email, {
        templateData: dados,
        idempotencyKey: linha.idempotency_key,
        replyTo: REPLY_TO,
      });

      if (resultado.sent) {
        enviados++;
        await admin
          .from("nutricao_envios")
          .update({ status: "enviado", enviado_em: new Date().toISOString(), erro: null })
          .eq("id", linha.id);
      } else {
        suprimidos++;
        await admin
          .from("nutricao_envios")
          .update({ status: "suprimido", erro: resultado.reason })
          .eq("id", linha.id);
      }
    } catch (e) {
      const limiteHora = e instanceof EmailAPIError && e.status === 429;
      if (limiteHora) {
        await admin.from("nutricao_envios").update({ status: "pendente" }).eq("id", linha.id);
        parado_por_limite = true;
        break;
      }
      erros++;
      const tentativas = (linha.tentativas ?? 0) + 1;
      await admin
        .from("nutricao_envios")
        .update({
          status: tentativas < MAX_TENTATIVAS ? "pendente" : "erro",
          tentativas,
          erro: e instanceof Error ? e.message : String(e),
        })
        .eq("id", linha.id);
    }

    await dormir(PAUSA_MS);
  }

  const { count } = await admin
    .from("nutricao_envios")
    .select("id", { count: "exact", head: true })
    .eq("status", "pendente");

  return json(200, {
    enviados,
    suprimidos,
    erros,
    parado_por_limite,
    pendentes_restantes: count ?? 0,
  });
});
