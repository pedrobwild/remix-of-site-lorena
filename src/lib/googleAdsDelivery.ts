import { canExportGoogleAdsAudienceLead, buildConsentByLead, GOOGLE_ADS_GCLID_WINDOW_DAYS, GOOGLE_ADS_QUALIFIED_VALUE, type ExportRecord } from "../../supabase/functions/_shared/data-export";
import { googleAdsLeadValue, isGoogleAdsQualifiedObjetivo } from "@/lib/googleAdsLeadValue";

export type DeliveryEvent = { id: string; lead_id: string; kind: "request" | "qualified"; event_at: string; transaction_id: string; attempts: number };
export type DeliveryConsent = { id: string; visitor_key: string; advertising: boolean; notice_version: string; created_at: string };
export const DELIVERY_ACTIONS = { request: "7805140492", qualified: "7851121159" };

export function buildDeliveryEvent(event: DeliveryEvent, lead: ExportRecord, records: DeliveryConsent[], now: number): { blocked: string } | { destination: string; event: Record<string, unknown> } {
  if (!isGoogleAdsQualifiedObjetivo(typeof lead.objetivo === "string" ? lead.objetivo : null)) return { blocked: "objetivo_nao_investidor" };
  if (!["/orcamento", "/diagnostico", "/contato", "/o", "/p"].includes(String(lead.form_path))) return { blocked: "formulario_nao_cliente" };
  const proof = buildConsentByLead([lead], records).get(String(lead.id));
  if (!canExportGoogleAdsAudienceLead(lead, proof, now)) return { blocked: "sem_autorizacao_atual" };
  const created = Date.parse(String(lead.created_at));
  const occurred = Date.parse(event.event_at);
  if (!Number.isFinite(occurred) || occurred > now || occurred < created) return { blocked: "data_invalida" };
  if (event.kind === "qualified" && lead.status !== "qualificado") return { blocked: "qualificacao_nao_vigente" };
  if (now - created > GOOGLE_ADS_GCLID_WINDOW_DAYS * 86400000) return { blocked: "fora_da_janela" };
  const gclid = typeof lead.gclid === "string" ? lead.gclid.trim() : "";
  if (!gclid) return { blocked: "sem_clique_google" };
  const value = event.kind === "qualified" ? GOOGLE_ADS_QUALIFIED_VALUE : googleAdsLeadValue(String(lead.objetivo)).value;
  return { destination: DELIVERY_ACTIONS[event.kind], event: {
    transactionId: event.transaction_id,
    eventTimestamp: new Date(occurred).toISOString(),
    eventSource: "WEB",
    adIdentifiers: { gclid },
    conversionValue: value,
    currency: "BRL",
    consent: { adUserData: "CONSENT_GRANTED", adPersonalization: "CONSENT_DENIED" },
  } };
}

export function deliveryRetryAt(now: number, attempts: number, retryAfter: string | null): string {
  const seconds = retryAfter && /^\d+$/.test(retryAfter) ? Number(retryAfter) : null;
  const date = retryAfter ? Date.parse(retryAfter) : NaN;
  const delay = seconds !== null ? seconds * 1000 : Number.isFinite(date) ? date - now : Math.min(3600000, 60000 * 2 ** Math.min(attempts, 6));
  return new Date(now + Math.max(60000, delay)).toISOString();
}