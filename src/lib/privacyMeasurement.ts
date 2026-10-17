/** Medição anônima da visita anterior ao pedido, limitada à sessão consentida. */
export const PRIVACY_VISIT_KEY = "bewild_privacy_visit_session";
export function privacyVisitState(consented: boolean, session: string | null, visitedSession: string | null): boolean | null {
  if (!consented || !session) return null;
  return session === visitedSession;
}