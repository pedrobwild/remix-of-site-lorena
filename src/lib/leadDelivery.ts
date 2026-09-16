/**
 * Interpretação do resultado da edge function `notify-lead`.
 *
 * A função responde HTTP 200 com `{ ok: true, lead_insert, slack, crm }`
 * mesmo quando TODAS as etapas falharam (ela nunca lança para o cliente).
 * "Sucesso na interface" não pode significar "lead entregue": só
 * consideramos entregue quando pelo menos um destino real confirmou —
 * gravação no banco (`lead_insert.status === "sent"`), Slack ou CRM.
 */
export type NotifyLeadResponse = {
  ok?: boolean;
  lead_insert?: { status?: string; id?: string; error?: string } | null;
  slack?: string | null;
  crm?: string | null;
};

export function isLeadDelivered(
  result: { data?: unknown; error?: unknown } | null | undefined,
): boolean {
  if (!result || result.error) return false;
  const data = result.data as NotifyLeadResponse | null | undefined;
  if (!data || typeof data !== "object") return false;
  return (
    data.lead_insert?.status === "sent" || data.slack === "sent" || data.crm === "sent"
  );
}

/** Promise que resolve `null` após `ms` — usada como corrida contra o invoke. */
export function timeoutAfter(ms: number): Promise<null> {
  return new Promise((resolve) => setTimeout(() => resolve(null), ms));
}
