import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { buildDeliveryEvent, deliveryRetryAt, type DeliveryEvent, type DeliveryConsent } from "@/lib/googleAdsDelivery";
import type { ExportRecord } from "../../supabase/functions/_shared/data-export";

type RpcDb = SupabaseClient<Database>;
export async function processGoogleAdsDelivery(db: RpcDb, id: string, token: string, env: (key: string) => string | undefined, fetchImpl = fetch) {
  const claimed = await db.rpc("claim_google_ads_delivery", { p_id: id, p_token: token });
  if (claimed.error) return { status: 503, outcome: "fila_indisponivel" };
  const event = Array.isArray(claimed.data) ? claimed.data[0] as DeliveryEvent | undefined : undefined;
  if (!event) return { status: 202, outcome: "sem_evento_autorizado_pendente" };
  let state = "pending", outcome = "envio_pendente", requestId: string | null = null;
  let retryAfter: string | null = null;
  try {
    const result = await db.from("leads").select("id,created_at,status,objetivo,form_path,gclid,consent_marketing,consent_record_id,consent_visitor_key").eq("id", event.lead_id).maybeSingle();
    if (result.error || !result.data) throw new Error("leitura_lead_indisponivel");
    const lead = result.data as ExportRecord;
    const records: DeliveryConsent[] = [];
    if (typeof lead.consent_visitor_key === "string") {
      for (let offset = 0; ; offset += 1000) {
        const consent = await db.from("ad_consent_records").select("id,visitor_key,advertising,notice_version,created_at").eq("visitor_key", lead.consent_visitor_key).order("created_at").order("id").range(offset, offset + 999);
        if (consent.error) throw new Error("leitura_aceite_indisponivel");
        records.push(...(consent.data ?? []));
        if (!consent.data || consent.data.length < 1000) break;
      }
    }
    const payload = buildDeliveryEvent(event, lead, records, Date.now());
    if ("blocked" in payload) { state = "blocked"; outcome = payload.blocked; }
    else {
      const key = env("LOVABLE_API_KEY"), ads = env("GOOGLE_ADS_API_KEY"), customer = env("GOOGLE_ADS_CUSTOMER_ID");
      if (!key || !ads || customer !== "8872806101") throw new Error("configuracao_google_indisponivel");
      const response = await fetchImpl("https://connector-gateway.lovable.dev/google_ads/datamanager/v1/events:ingest", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, "X-Connection-Api-Key": ads },
        body: JSON.stringify({ destinations: [{ operatingAccount: { accountType: "GOOGLE_ADS", accountId: customer }, productDestinationId: payload.destination }], events: [payload.event], encoding: "HEX" }), signal: AbortSignal.timeout(25000),
      });
      if (!response.ok) {
        retryAfter = response.headers.get("Retry-After");
        outcome = `google_http_${response.status}`;
        if (response.status !== 429 && response.status < 500) state = "failed";
      } else {
        const body = await response.json() as { requestId?: string };
        if (!body.requestId) throw new Error("confirmacao_google_ausente");
        requestId = body.requestId; state = "accepted"; outcome = "recebido_para_processamento";
      }
    }
  } catch { outcome = "tentativa_nao_confirmada"; }
  if (event.attempts >= 6 && state === "pending") { state = "failed"; outcome = "limite_de_tentativas"; }
  const saved = await db.rpc("finish_google_ads_delivery", { p_id: id, p_token: token, p_state: state, p_outcome: outcome, p_request_id: requestId ?? "", p_next: deliveryRetryAt(Date.now(), event.attempts, retryAfter) });
  return { status: saved.error ? 503 : 200, outcome: saved.error ? "resultado_nao_persistido" : outcome };
}