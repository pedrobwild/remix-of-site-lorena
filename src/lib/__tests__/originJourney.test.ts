import { describe, expect, it } from "vitest";
import { summarizeOriginJourney, type JourneyEvent, type JourneyLead } from "@/lib/originJourney";

const event = (overrides: Partial<JourneyEvent> = {}): JourneyEvent => ({ event_type: "pageview", path: "/orcamento", session_id: "s1", visitor_id: "v1", scroll_depth: null, duration_ms: null, ...overrides });
const lead = (overrides: Partial<JourneyLead> = {}): JourneyLead => ({ id: "l1", form_path: "/orcamento", status: "novo", crm_won: false, crm_lost: false, crm_stage_name: null, ...overrides });

describe("origins and contract cohorts", () => {
  it("counts repeat pageviews separately from visitors and sessions", () => {
    const row = summarizeOriginJourney([event(), event(), event({ session_id: "s2" })], [])[4];
    expect(row).toMatchObject({ visitors: 1, sessions: 2, pageviews: 3 });
  });
  it("only counts crm_won as a confirmed contract, not qualified or delivered", () => {
    const row = summarizeOriginJourney([], [lead({ status: "qualificado", crm_stage_name: "Entregue" }), lead({ id: "l2", crm_won: true })])[4];
    expect(row).toMatchObject({ requests: 2, contracts: 1, contractRate: 50 });
  });
  it("uses the canonical paid click attribution for requests", () => {
    const row = summarizeOriginJourney([], [lead({ gclid: "click", utm_source: "instagram" })])[0];
    expect(row.requests).toBe(1);
  });
  it("excludes other forms and unrelated behavior without an observed session", () => {
    const row = summarizeOriginJourney([event({ event_type: "click_whatsapp" }), event({ path: "/contato" })], [lead({ form_path: "/o" })])[4];
    expect(row).toMatchObject({ sessions: 0, whatsapp: 0, requests: 0 });
  });
  it("deduplicates behavior and reports recorded active time per session", () => {
    const row = summarizeOriginJourney([event(), event({ event_type: "scroll_depth", scroll_depth: 50 }), event({ event_type: "scroll_depth", scroll_depth: 75 }), event({ event_type: "engagement_time", duration_ms: 10000 })], [])[4];
    expect(row).toMatchObject({ scroll50: 1, engagementSeconds: 10 });
  });
  it("does not create a contract or infer a lead from a tracked submit", () => {
    const row = summarizeOriginJourney([event(), event({ event_type: "form_submit" })], [])[4];
    expect(row).toMatchObject({ submissions: 1, requests: 0, contracts: 0, contractRate: 0 });
  });
  it("reads the existing form-start and lead ad_event signals without treating them as saved requests", () => {
    const row = summarizeOriginJourney([event(), event({ event_type: "ad_event", value: { name: "IniciouFormulario" } }), event({ event_type: "ad_event", value: { name: "Lead" } })], [])[4];
    expect(row).toMatchObject({ starts: 1, submissions: 1, requests: 0 });
  });
});