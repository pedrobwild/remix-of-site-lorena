/** Motivo de descarte: só o texto que o CRM registrou. Sem registro, nunca deduzir pelo perfil ou pelas etapas. */
export const MOTIVO_NAO_ENVIADO = "Não enviado pelo CRM";
export function discardReasonLabel(reason: string | null | undefined): string {
  const text = reason?.trim();
  return text ? text : MOTIVO_NAO_ENVIADO;
}
