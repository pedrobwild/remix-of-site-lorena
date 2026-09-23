/**
 * Telefone brasileiro — normalização, máscara e validação compartilhadas
 * pelos formulários de lead.
 *
 * Por que existe: cada formulário fazia `digits.slice(0, 11)`, que guarda os
 * 11 PRIMEIROS dígitos. Com autofill do iOS/Chrome ("+55 11 91234-5678") isso
 * gravava `55119123456` — um número que passa na validação e não existe.
 * Aqui o DDI 55 e o prefixo de tronco 0 são removidos antes do corte.
 *
 * A mesma regra roda no servidor (`supabase/functions/notify-lead`), porque o
 * payload pode vir de qualquer cliente.
 */

/** Só os dígitos nacionais (DDD + número), no máximo 11. */
export function normalizeBrPhoneDigits(input: string): string {
  let d = (input || "").replace(/\D/g, "");
  // DDI: "55" só é removido quando sobra um número nacional plausível —
  // "55 9xxxx-xxxx" (DDD 55, RS) tem 11 dígitos e fica intacto.
  if (d.length >= 12 && d.startsWith("55")) d = d.slice(2);
  // Prefixo de tronco ("011 9…"): DDD nunca começa com 0.
  d = d.replace(/^0+/, "");
  return d.slice(0, 11);
}

/** Máscara progressiva: "(11) 91234-5678" ou "(11) 1234-5678". */
export function formatBrPhone(input: string): string {
  const d = normalizeBrPhoneDigits(input);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/**
 * Número nacional válido: DDD sem zero (11–99) e
 * - 11 dígitos começando por 9 (celular), ou
 * - 10 dígitos começando por 2–8 (fixo / WhatsApp Business).
 */
export function isValidBrPhone(input: string): boolean {
  const d = normalizeBrPhoneDigits(input);
  if (!/^[1-9][1-9]/.test(d)) return false;
  if (d.length === 11) return d[2] === "9";
  if (d.length === 10) return /[2-8]/.test(d[2]);
  return false;
}
