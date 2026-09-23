// Edge function: scope-plan
// Recebe a descrição do apartamento + objetivo do proprietário e devolve
// uma recomendação personalizada de escopo e próximos passos, gerada via
// Lovable AI Gateway (Responses API, streaming consumido no servidor).
//
// Nada de preço fechado: o texto sempre trata a estimativa como faixa de
// referência, e o fechamento acontece no diagnóstico/WhatsApp.

import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

/**
 * Rate limit durável (RPC `hit_rate_limit`, só service role): por IP e um
 * orçamento diário global — cada chamada gasta créditos de IA. Fail-open se a
 * RPC não existir: a página não pode quebrar por causa do limitador.
 */
async function withinRateLimit(req: Request, scope: string, perIp: { windowS: number; max: number }, perDay: number): Promise<boolean> {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return true;
  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    ((req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown");
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const hit = async (k: string, windowS: number, max: number) => {
    try {
      const { data, error } = await admin.rpc("hit_rate_limit", { p_key: k, p_window_s: windowS, p_max: max });
      return error ? true : data !== false;
    } catch {
      return true;
    }
  };
  const day = new Date().toISOString().slice(0, 10);
  const [ipOk, dayOk] = await Promise.all([
    hit(`${scope}:ip:${ip}`, perIp.windowS, perIp.max),
    hit(`${scope}:day:${day}`, 86_400, perDay),
  ]);
  return ipOk && dayOk;
}

/** Lê o corpo com teto de tamanho; null se passar do limite ou não for JSON. */
async function readJsonBody(req: Request, maxBytes: number): Promise<Record<string, unknown> | null> {
  const declared = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > maxBytes) return null;
  const text = await req.text().catch(() => "");
  if (text.length > maxBytes) return null;
  try {
    const parsed = JSON.parse(text || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    resumo: { type: "string" },
    escopo: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          titulo: { type: "string" },
          detalhe: { type: "string" },
          prioridade: { type: "string", enum: ["essencial", "recomendado", "opcional"] },
        },
        required: ["titulo", "detalhe", "prioridade"],
      },
    },
    prazo_referencia: { type: "string" },
    faixa_investimento: { type: "string" },
    atencao: { type: "array", items: { type: "string" } },
    proximos_passos: { type: "array", items: { type: "string" } },
  },
  required: [
    "resumo",
    "escopo",
    "prazo_referencia",
    "faixa_investimento",
    "atencao",
    "proximos_passos",
  ],
} as const;

const SYSTEM = [
  "Você é a equipe de arquitetura e obra da Bewild (São Paulo-SP).",
  "A Bewild entrega apartamentos e studios prontos para morar ou render: projeto, obra, marcenaria e mobília em um único contrato, com preço e prazo fechados, garantia de 5 anos e acompanhamento a distância.",
  "Referências reais: ticket médio ~R$ 63,5 mil, ~R$ 2.369/m², imóveis de 21 a 35 m², prazo de referência de 60 dias úteis para obra de até 30 m².",
  "Escreva em português do Brasil, direto, sem jargão técnico e sem promessas exageradas.",
  "Regras: de 4 a 7 itens de escopo; cada detalhe com no máximo 2 frases; a faixa de investimento é sempre uma estimativa de referência (nunca um orçamento fechado) em reais;",
  "o prazo é sempre apresentado como referência em dias úteis; 3 a 5 pontos de atenção; 3 a 4 próximos passos, sendo o último sempre falar com a Bewild pelo diagnóstico ou WhatsApp.",
  "Nunca invente medidas, materiais ou valores que contradigam o que o proprietário descreveu.",
].join(" ");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY não configurada" }, 500);

  const body = await readJsonBody(req, 32 * 1024);
  if (!body) return json({ error: "Requisição inválida." }, 400);
  const descricao = String(body.descricao ?? "").trim();
  // Campos curtos do formulário: cortados (antes iam sem teto para o prompt).
  const objetivo = String(body.objetivo ?? "").trim().slice(0, 80);
  const area = String(body.area ?? "").trim().slice(0, 20);
  const local = String(body.local ?? "").trim().slice(0, 120);
  const orcamento = String(body.orcamento ?? "").trim().slice(0, 60);

  if (descricao.length < 20) {
    return json({ error: "Descreva o apartamento com pelo menos 20 caracteres." }, 400);
  }
  if (descricao.length > 4000) {
    return json({ error: "Descrição muito longa." }, 400);
  }

  const prompt = [
    `Objetivo do proprietário: ${objetivo || "não informado"}.`,
    `Metragem aproximada: ${area || "não informada"}.`,
    `Localização: ${local || "não informada"}.`,
    `Faixa de investimento pretendida: ${orcamento || "não informada"}.`,
    "Descrição do apartamento e do que a pessoa deseja:",
    descricao,
    "Gere a recomendação de escopo e os próximos passos no formato pedido.",
  ].join("\n");

  if (!(await withinRateLimit(req, "scope-plan", { windowS: 3600, max: 10 }, 200))) {
    return json({ error: "Muitas solicitações agora. Tente de novo em alguns minutos." }, 429);
  }

  let upstream: Response;
  try {
    upstream = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": LOVABLE_API_KEY,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        instructions: SYSTEM,
        input: prompt,
        reasoning: { effort: "low" },
        text: {
          format: {
            type: "json_schema",
            name: "recomendacao_escopo",
            strict: true,
            schema: SCHEMA,
          },
        },
      }),
      signal: AbortSignal.timeout(60_000),
    });
  } catch (err) {
    console.error("scope-plan: falha de rede no gateway", err);
    return json({ error: "Não conseguimos gerar a recomendação agora." }, 502);
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    console.error("scope-plan: gateway", upstream.status, detail.slice(0, 500));
    if (upstream.status === 429) {
      return json({ error: "Muitas solicitações agora. Tente de novo em instantes." }, 429);
    }
    if (upstream.status === 402) {
      return json({ error: "Créditos de IA esgotados. Fale com a Bewild pelo WhatsApp." }, 402);
    }
    return json({ error: "Não conseguimos gerar a recomendação agora." }, 502);
  }

  // Consome o SSE no servidor: só o texto final importa para esta tela.
  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";

  while (true) {
    let chunk: ReadableStreamReadResult<Uint8Array>;
    try {
      chunk = await reader.read();
    } catch {
      // Timeout ou queda do gateway no meio do streaming.
      return json({ error: "Não conseguimos gerar a recomendação agora." }, 504);
    }
    const { done, value } = chunk;
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const part of parts) {
      for (const line of part.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const evt = JSON.parse(payload);
          if (evt?.type === "response.output_text.delta" && typeof evt.delta === "string") {
            text += evt.delta;
          } else if (evt?.type === "response.completed" && typeof evt?.response?.output_text === "string") {
            text = evt.response.output_text || text;
          }
        } catch {
          // evento parcial/desconhecido: ignora
        }
      }
    }
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    console.error("scope-plan: resposta não-JSON", text.slice(0, 300));
    return json({ error: "Não conseguimos gerar a recomendação agora." }, 502);
  }

  return json({ recomendacao: parsed });
});
