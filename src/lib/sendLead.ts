import { supabase } from "@/integrations/supabase/client";
import {
  fitLeadPayload,
  isLeadDelivered,
  timeoutAfter,
  type LeadPayload,
  type LeadTracking,
} from "@/lib/leadDelivery";

export type SendLeadResult = {
  /** Pelo menos um destino real (banco, Slack ou CRM) confirmou. */
  delivered: boolean;
  /** A função não respondeu dentro do prazo — o lead PODE ter sido gravado. */
  timedOut: boolean;
};

type InvokeResult = { data: unknown; error: unknown };

function httpStatusOf(error: unknown): number | null {
  const ctx = (error as { context?: { status?: unknown } } | null)?.context;
  return typeof ctx?.status === "number" ? ctx.status : null;
}

async function invokeWithTimeout(
  body: Record<string, unknown>,
  timeoutMs: number,
): Promise<InvokeResult | null> {
  try {
    return await Promise.race([
      supabase.functions.invoke("notify-lead", { body }) as Promise<InvokeResult>,
      timeoutAfter(timeoutMs),
    ]);
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Envia um lead para `notify-lead` e diz a verdade sobre a entrega.
 *
 * - `supabase-js` não lança em erro de API: o resultado é inspecionado por
 *   `isLeadDelivered`, nunca pelo `try/catch`.
 * - O payload é ajustado aos limites do schema do servidor antes do envio.
 * - Se a versão publicada da função ainda não conhece `form_path` (schema
 *   estrito → HTTP 400), reenvia uma vez sem o campo. Cobre a janela entre
 *   publicar o front e a função; depois disso nunca dispara.
 * - `tracking` (id do evento, aceite, `_fbp`/`_fbc`) vai junto no corpo:
 *   a função usa para a API de Conversões do Meta. Versões antigas da função
 *   ignoram chaves desconhecidas.
 */
export async function sendLead(
  payload: LeadPayload,
  { timeoutMs = 8000, tracking }: { timeoutMs?: number; tracking?: LeadTracking } = {},
): Promise<SendLeadResult> {
  const body = fitLeadPayload(tracking ? { ...payload, ...tracking } : payload);
  let result = await invokeWithTimeout(body, timeoutMs);
  if (result === null) return { delivered: false, timedOut: true };

  if (!isLeadDelivered(result) && httpStatusOf(result.error) === 400) {
    const { form_path: _formPath, ...legacyBody } = body;
    void _formPath;
    result = await invokeWithTimeout(legacyBody, timeoutMs);
    if (result === null) return { delivered: false, timedOut: true };
  }

  return { delivered: isLeadDelivered(result), timedOut: false };
}
