/**
 * Lista "Exclusao desqualificados" do Google Ads (Customer Match, id 9232166736):
 * recebe e-mail e telefone (em hash SHA-256) dos leads marcados como não
 * qualificados — no painel do site ou pelo Engine.
 *
 * Mesma regra do envio de conversões: só entra quem aceitou anúncios no aviso
 * de cookies na captura E mantém esse aceite hoje no mesmo aparelho. Nunca usa
 * o flag legado `consent_marketing` sozinho.
 * Envio idempotente (Data Manager trata como inclusão); roda depois de cada
 * sincronização com o CRM. Registro em integration_log só com contagens.
 */
import {
  buildConsentByLead,
  canExportGoogleAdsAudienceLead,
  normalizeEmailForHash,
  normalizePhoneForHash,
  sha256Hex,
  type ExportRecord,
} from "../../supabase/functions/_shared/data-export.ts";
import type { ServiceDb } from "../../supabase/functions/_shared/lead-quality.ts";

export const DISQUALIFIED_LIST_ID = "9232166736";
const GATEWAY = "https://connector-gateway.lovable.dev/google_ads/datamanager/v1/audienceMembers:ingest";
const PAGE = 1000;

type Env = (name: string) => string | null | undefined;
type ConsentRow = { id: string; visitor_key: string; advertising: boolean; notice_version: string; created_at: string };

export type DisqualifiedMember = { emailHash: string | null; phoneHash: string | null };

/** Pura: quais leads entram na lista e com quais identificadores. */
export async function buildDisqualifiedMembers(
  leads: readonly ExportRecord[],
  records: readonly ConsentRow[],
  now: number,
): Promise<DisqualifiedMember[]> {
  const consent = buildConsentByLead(leads, records);
  const out: DisqualifiedMember[] = [];
  for (const lead of leads) {
    if (lead.status !== "descartado") continue;
    if (!canExportGoogleAdsAudienceLead(lead, consent.get(String(lead.id)), now)) continue;
    const email = normalizeEmailForHash(lead.email);
    const phone = normalizePhoneForHash(lead.whatsapp);
    if (!email && !phone) continue;
    out.push({ emailHash: email ? await sha256Hex(email) : null, phoneHash: phone ? await sha256Hex(phone) : null });
  }
  return out;
}

export async function syncDisqualifiedList(
  admin: ServiceDb,
  env: Env,
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: boolean; enviados: number; error?: string }> {
  const lovableKey = env("LOVABLE_API_KEY");
  const adsKey = env("GOOGLE_ADS_API_KEY");
  const customer = (env("GOOGLE_ADS_CUSTOMER_ID") ?? "").replace(/\D/g, "");
  let result: { ok: boolean; enviados: number; error?: string } = { ok: false, enviados: 0 };
  try {
    if (!lovableKey || !adsKey || !customer) throw new Error("google_ads_nao_conectado");
    const leads: ExportRecord[] = [];
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await admin
        .from("leads")
        .select("id, created_at, status, email, whatsapp, consent_marketing, consent_record_id, consent_visitor_key")
        .eq("status", "descartado")
        .eq("consent_marketing", true)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })
        .range(from, from + PAGE - 1);
      if (error) throw new Error(error.message);
      leads.push(...((data ?? []) as ExportRecord[]));
      if (!data || data.length < PAGE) break;
    }
    const keys = [...new Set(leads.map((l) => l.consent_visitor_key).filter((k): k is string => typeof k === "string" && k.length > 0))];
    const records: ConsentRow[] = [];
    for (let i = 0; i < keys.length; i += 200) {
      const { data, error } = await admin
        .from("ad_consent_records")
        .select("id, visitor_key, advertising, notice_version, created_at")
        .in("visitor_key", keys.slice(i, i + 200))
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })
        .limit(1000);
      if (error) throw new Error(error.message);
      records.push(...((data ?? []) as ConsentRow[]));
    }
    const members = await buildDisqualifiedMembers(leads, records, Date.now());
    if (members.length) {
      const res = await fetchImpl(GATEWAY, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${lovableKey}`,
          "X-Connection-Api-Key": adsKey,
        },
        body: JSON.stringify({
          destinations: [{ operatingAccount: { accountType: "GOOGLE_ADS", accountId: customer }, productDestinationId: DISQUALIFIED_LIST_ID }],
          audienceMembers: members.map((m) => ({
            userData: {
              userIdentifiers: [
                ...(m.emailHash ? [{ emailAddress: m.emailHash }] : []),
                ...(m.phoneHash ? [{ phoneNumber: m.phoneHash }] : []),
              ],
            },
            consent: { adUserData: "CONSENT_GRANTED", adPersonalization: "CONSENT_GRANTED" },
          })),
          encoding: "HEX",
          termsOfService: { customerMatchTermsOfServiceStatus: "ACCEPTED" },
        }),
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`google_ads_${res.status}: ${body.slice(0, 300)}`);
      }
    }
    result = { ok: true, enviados: members.length };
  } catch (err) {
    result = { ok: false, enviados: 0, error: err instanceof Error ? err.message : "erro" };
  }
  try {
    await admin.from("integration_log").insert({
      integration: "google_ads_disqualified_list",
      event_name: "sync",
      lead_id: null,
      status: result.ok ? "sent" : "error",
      http_status: null,
      detail: { ...result },
    });
  } catch {
    /* o registro nunca derruba a sincronização */
  }
  return result;
}
