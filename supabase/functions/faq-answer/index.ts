// Edge function: faq-answer
// Responde perguntas livres de visitantes da página /faq usando a mesma IA
// de /escopo (Lovable AI Gateway, Responses API com streaming consumido no
// servidor). Nunca fecha preço nem promete prazo: tudo é referência e o
// próximo passo é sempre diagnóstico ou WhatsApp.

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
    resposta: { type: "string" },
    pontos: { type: "array", items: { type: "string" } },
    proximo_passo: { type: "string" },
    fora_do_escopo: { type: "boolean" },
  },
  required: ["resposta", "pontos", "proximo_passo", "fora_do_escopo"],
} as const;

const SYSTEM = [
  "Você responde dúvidas de clientes no site da Bewild (arquitetura e reforma de apartamentos e studios em São Paulo-SP).",
  "Como a Bewild trabalha: projeto, obra, marcenaria e mobília em um único contrato, com preço e prazo fechados antes do início; se o custo passar do combinado, a diferença é da Bewild.",
  "Reforma turnkey (chave na mão), garantia de 5 anos em contrato para obra e marcenaria, acompanhamento pelo Bwild Workflow, sem o cliente precisar ir à obra.",
  "Prazo em contrato: se a obra atrasar por conta da Bewild, ela paga multa por dia de atraso. O valor só muda se o cliente pedir uma alteração ou se surgir um imprevisto do prédio que não dava para ver na vistoria.",
  "Para quem mora fora de São Paulo: vistoria por procuração, ligação de energia na Enel, contratação e instalação de internet, manutenção preventiva e chamados de emergência ficam com a Bewild.",
  "Atuação: obras só em São Paulo capital, com reformas entregues em mais de 27 bairros; a Bewild não atende a Grande São Paulo nem o interior. O dono do imóvel pode morar em qualquer cidade ou país.",
  "Números reais: +188 reformas entregues e +200 projetos executados. Custo: nas 58 obras completas da base de 2025 (fevereiro a outubro), em imóveis de 21 a 35 m², mediana de R$ 63.763 por obra, ou R$ 2.389/m², com metade entre R$ 2.107 e R$ 2.716/m² (projeto, obra, marcenaria, mobília e eletros). Prazo: cerca de 60 dias úteis de obra para imóveis de até 30 m², contados depois da autorização do condomínio, das chaves e da energia ligada; imóveis maiores ou com integração de varanda levam mais.",
  "Reformamos para morar, para alugar (curta ou longa temporada) e para vender; o projeto muda conforme o objetivo.",
  "Escreva em português do Brasil, em tom direto e acolhedor, sem jargão técnico e sem promessas exageradas.",
  "Regras: 'resposta' com 2 a 5 frases; 'pontos' com 0 a 3 complementos curtos (deixe vazio se não agregar); 'proximo_passo' com uma frase convidando a pedir um orçamento ou a falar no WhatsApp.",
  "Nunca invente preço fechado, prazo garantido, nome de cliente, endereço ou serviço que a Bewild não ofereça. Se não souber, diga que o time confirma na proposta.",
  "Se a pergunta não tiver relação com reforma, arquitetura, obra ou com a Bewild, marque 'fora_do_escopo' como true e responda apenas que esse tema foge do assunto do site.",
].join(" ");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY não configurada" }, 500);

  const body = await readJsonBody(req, 16 * 1024);
  if (!body) return json({ error: "Pergunta inválida." }, 400);
  const pergunta = String(body.pergunta ?? "").trim();
  // O site não envia `contexto`; se vier, é cortado (antes não tinha teto).
  const contexto = String(body.contexto ?? "").trim().slice(0, 300);

  if (pergunta.length < 8) {
    return json({ error: "Escreva sua pergunta com um pouco mais de detalhe." }, 400);
  }
  if (pergunta.length > 1000) {
    return json({ error: "Pergunta muito longa." }, 400);
  }

  const prompt = [
    contexto ? `Contexto informado pelo visitante: ${contexto}` : "",
    `Pergunta do visitante: ${pergunta}`,
    "Responda no formato pedido.",
  ]
    .filter(Boolean)
    .join("\n");

  if (!(await withinRateLimit(req, "faq-answer", { windowS: 3600, max: 20 }, 400))) {
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
            name: "resposta_faq",
            strict: true,
            schema: SCHEMA,
          },
        },
      }),
      signal: AbortSignal.timeout(60_000),
    });
  } catch (err) {
    console.error("faq-answer: falha de rede no gateway", err);
    return json({ error: "Não conseguimos responder agora." }, 502);
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    console.error("faq-answer: gateway", upstream.status, detail.slice(0, 500));
    if (upstream.status === 429) {
      return json({ error: "Muitas perguntas agora. Tente de novo em instantes." }, 429);
    }
    if (upstream.status === 402) {
      return json({ error: "Créditos de IA esgotados. Fale com a Bewild pelo WhatsApp." }, 402);
    }
    return json({ error: "Não conseguimos responder agora." }, 502);
  }

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
      return json({ error: "Não conseguimos responder agora." }, 504);
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
          } else if (
            evt?.type === "response.completed" &&
            typeof evt?.response?.output_text === "string"
          ) {
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
    console.error("faq-answer: resposta não-JSON", text.slice(0, 300));
    return json({ error: "Não conseguimos responder agora." }, 502);
  }

  return json({ resposta: parsed });
});
