import { canExportGoogleAdsLead, GOOGLE_ADS_GCLID_WINDOW_DAYS, GOOGLE_ADS_QUALIFIED_VALUE, type ExportRecord } from "../../supabase/functions/_shared/data-export";
import { googleAdsLeadValue, isGoogleAdsQualifiedObjetivo } from "@/lib/googleAdsLeadValue";

export type DeliveryEvent = { id: string; lead_id: string; kind: "request" | "qualified"; event_at: string; transaction_id: string; attempts: number };
export type DeliveryConsent = { id: string; visitor_key: string; advertising: boolean; notice_version: string; created_at: string };
export const DELIVERY_ACTIONS = { request: "7805140492", qualified: "7851121159" };

/** O aparelho do pedido tem registro no aviso de cookies e a escolha mais recente é recusa. */
function withdrewAdConsent(lead: ExportRecord, records: readonly DeliveryConsent[]): boolean {
  const key = typeof lead.consent_visitor_key === "string" ? lead.consent_visitor_key : "";
  if (!key) return false;
  let latest: DeliveryConsent | undefined;
  for (const record of records) {
    if (record.visitor_key !== key) continue;
    if (!latest || Date.parse(record.created_at) > Date.parse(latest.created_at)) latest = record;
  }
  return latest !== undefined && latest.advertising !== true;
}

export function buildDeliveryEvent(event: DeliveryEvent, lead: ExportRecord, records: DeliveryConsent[], now: number): { blocked: string } | { destination: string; event: Record<string, unknown> } {
  if (!isGoogleAdsQualifiedObjetivo(typeof lead.objetivo === "string" ? lead.objetivo : null)) return { blocked: "objetivo_nao_investidor" };
  if (!["/orcamento", "/diagnostico", "/contato", "/o", "/p"].includes(String(lead.form_path))) return { blocked: "formulario_nao_cliente" };
  // Mesma regra da exportação offline (Pedro, 29/10/2026 19h30; envio direto em
  // 25/11/2026): autoriza o aceite de marketing do formulário, com ou sem
  // resposta ao aviso de cookies. Retirada posterior no aviso segue bloqueando.
  if (!canExportGoogleAdsLead(lead)) return { blocked: "sem_aceite_no_formulario" };
  if (withdrewAdConsent(lead, records)) return { blocked: "aceite_retirado_no_aviso" };
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