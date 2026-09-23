// Generates Portuguese alt-text for an image URL using Lovable AI (Gemini vision).
//
// Somente admin logado e só imagens do próprio storage: antes era um proxy de
// IA aberto (qualquer URL, qualquer `context`), cobrado na conta do projeto.

import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CONTEXT_MAX = 200;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Valida o JWT do usuário e `is_admin()` no banco. Devolve a resposta de erro ou null. */
async function requireAdmin(req: Request): Promise<Response | null> {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return json({ error: "não autorizado" }, 401);
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anonKey) return json({ error: "indisponível" }, 503);
  const client = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData } = await client.auth.getUser();
  if (!userData?.user) return json({ error: "não autorizado" }, 401);
  const { data: isAdmin, error } = await client.rpc("is_admin");
  if (error || isAdmin !== true) return json({ error: "somente administradores" }, 403);
  return null;
}

/** Só URLs https do storage deste projeto (nada de data:, IPs ou terceiros). */
function isOwnStorageUrl(raw: string): boolean {
  const base = Deno.env.get("SUPABASE_URL");
  if (!base) return false;
  try {
    const u = new URL(raw);
    return u.protocol === "https:" && u.host === new URL(base).host && u.pathname.startsWith("/storage/v1/");
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return json({ error: "LOVABLE_API_KEY not configured" }, 500);
    }

    const body = await req.json().catch(() => ({}));
    const imageUrl: unknown = body?.imageUrl;
    const context = typeof body?.context === "string" ? body.context.trim().slice(0, CONTEXT_MAX) : "";

    if (typeof imageUrl !== "string" || !isOwnStorageUrl(imageUrl)) {
      return json({ error: "imageUrl deve ser uma imagem do storage do site" }, 400);
    }

    const systemPrompt =
      "Você escreve alt-text em português para fotos de arquitetura e interiores. " +
      "Regras: descreva o que se vê de forma objetiva e visual (ambiente, materiais, luz, composição). " +
      "Máximo 140 caracteres, uma única frase, sem ponto final, sem aspas, sem prefixos como 'Foto de' ou 'Imagem de'. " +
      "Use letras minúsculas no estilo do site. Não invente nomes próprios.";

    const userText = context
      ? `Projeto: ${context}. Gere o alt-text desta imagem.`
      : "Gere o alt-text desta imagem.";

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userText },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(45_000),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return json({ error: "limite de requisições atingido, tente em instantes." }, 429);
      }
      if (aiResp.status === 402) {
        return json({ error: "créditos de IA esgotados, adicione créditos no workspace." }, 402);
      }
      console.error("AI gateway error:", aiResp.status);
      return json({ error: "falha ao gerar alt-text" }, 502);
    }

    const data = await aiResp.json();
    let alt: string = data?.choices?.[0]?.message?.content?.toString().trim() ?? "";
    alt = alt.replace(/^["'`]+|["'`]+$/g, "").replace(/\.$/, "").trim();
    if (alt.length > 160) alt = alt.slice(0, 157).trimEnd() + "…";

    return json({ alt });
  } catch (e) {
    console.error("generate-alt-text error:", e instanceof Error ? e.name : "unknown");
    return json({ error: "falha ao gerar alt-text" }, 500);
  }
});
