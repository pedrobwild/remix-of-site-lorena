/** Prova do aceite do aviso de cookies ligada ao lead (envio ao Google Ads). */
import { describe, expect, it } from "vitest";
import { buildConsentByLead, canExportGoogleAdsLead } from "../../../supabase/functions/_shared/data-export";

const KEY = "11111111-1111-1111-1111-111111111111";
const lead = { id: "L1", created_at: "2026-10-20T12:00:00Z", consent_marketing: true, consent_record_id: "R1", consent_visitor_key: KEY };
const aceite = { id: "R1", visitor_key: KEY, advertising: true, notice_version: "v2", created_at: "2026-10-20T11:59:00Z" };
const now = Date.parse("2026-10-25T00:00:00Z");

describe("prova do aceite publicitário", () => {
  it("aceite antes do pedido e ainda vigente libera o envio", () => {
    const map = buildConsentByLead([lead], [aceite]);
    expect(canExportGoogleAdsLead(lead, map.get("L1"), now)).toBe(true);
  });

  it("recusa posterior no mesmo aparelho bloqueia", () => {
    const recusa = { ...aceite, id: "R2", advertising: false, created_at: "2026-10-21T00:00:00Z" };
    const map = buildConsentByLead([lead], [aceite, recusa]);
    expect(canExportGoogleAdsLead(lead, map.get("L1"), now)).toBe(false);
  });

  it("registro de outro aparelho não vale", () => {
    const outro = { ...lead, consent_visitor_key: "22222222-2222-2222-2222-222222222222" };
    expect(buildConsentByLead([outro], [aceite]).has("L1")).toBe(false);
  });

  it("lead sem registro fica bloqueado", () => {
    const semProva = { ...lead, consent_record_id: null };
    expect(canExportGoogleAdsLead(semProva, buildConsentByLead([semProva], [aceite]).get("L1"), now)).toBe(false);
  });
});
