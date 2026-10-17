import { leadCanal, LEAD_CANAIS, type LeadSourceInput } from "@/lib/leadSource";

export type JourneyEvent = LeadSourceInput & {
  id?: string; created_at?: string | null; utm_campaign?: string | null; landing_path?: string | null;
  event_type: string; path: string | null; session_id: string | null;
  visitor_id: string | null; scroll_depth: number | null; duration_ms: number | null;
  value?: unknown;
};

/** Uma chegada por sessão; sem sessão, preservar o registro sem inferir identidade. */
export function budgetVisitorArrivals(events: JourneyEvent[]) {
  const arrivals = new Map<string, JourneyEvent>();
  const ordered = events.filter((event) => event.path === "/orcamento" && event.event_type === "pageview")
    .sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? "") || (a.id ?? "").localeCompare(b.id ?? ""));
  for (const [index, event] of ordered.entries()) {
    const key = event.session_id ? `session:${event.session_id}` : `event:${event.id ?? index}`;
    if (!arrivals.has(key)) arrivals.set(key, event);
  }
  const visitors = new Map<string, number>();
  return [...arrivals.entries()].map(([key, event]) => {
    const identity = event.visitor_id || event.session_id;
    if (identity && !visitors.has(identity)) visitors.set(identity, visitors.size + 1);
    let reference = "Não informada";
    try { if (event.referrer) reference = new URL(event.referrer).hostname; } catch { /* Não exibir URL inválida. */ }
    return { key, visitor: identity ? `Visitante ${visitors.get(identity)}` : "Sem identificador", createdAt: event.created_at,
      canal: leadCanal(event), source: event.utm_source || "Não informada", medium: event.utm_medium || "Não informado",
      campaign: event.utm_campaign || "Não informada", reference };
  }).reverse();
}
export type JourneyLead = LeadSourceInput & {
  id: string; form_path: string | null; status: string; crm_won: boolean | null;
  crm_lost: boolean | null; crm_stage_name: string | null;
};

/** Visits and lead cohorts remain separate: no individual analytics-to-lead key exists. */
export function summarizeOriginJourney(events: JourneyEvent[], leads: JourneyLead[]) {
  return LEAD_CANAIS.map((canal) => {
    const visits = events.filter((event) => event.path === "/orcamento" && event.event_type === "pageview");
    const sessions = new Map<string, JourneyEvent>();
    for (const visit of visits) {
      if (visit.session_id && !sessions.has(visit.session_id)) sessions.set(visit.session_id, visit);
    }
    const selected = [...sessions.entries()].filter(([, visit]) => leadCanal(visit) === canal);
    const sessionIds = new Set(selected.map(([id]) => id));
    const behavior = events.filter((event) => event.path === "/orcamento" && event.session_id && sessionIds.has(event.session_id));
    const countSessions = (predicate: (event: JourneyEvent) => boolean) => new Set(behavior.filter(predicate).map((event) => event.session_id)).size;
    const requests = leads.filter((lead) => lead.form_path === "/orcamento" && leadCanal(lead) === canal);
    const contracts = requests.filter((lead) => lead.crm_won === true).length;
    const stages = new Map<string, number>();
    for (const lead of requests) {
      const name = lead.crm_won === true ? "Contrato confirmado" : lead.crm_stage_name || "Sem etapa informada";
      stages.set(name, (stages.get(name) ?? 0) + 1);
    }
    return {
      canal, visitors: new Set(selected.map(([id, visit]) => visit.visitor_id || `session:${id}`)).size,
      sessions: selected.length,
      pageviews: visits.filter((visit) => visit.session_id && sessionIds.has(visit.session_id)).length,
      scroll50: countSessions((event) => event.event_type === "scroll_depth" && (event.scroll_depth ?? 0) >= 50),
      whatsapp: countSessions((event) => event.event_type === "click_whatsapp"),
      starts: countSessions((event) => event.event_type === "ad_event" && event.value !== null && typeof event.value === "object" && "name" in event.value && event.value.name === "IniciouFormulario"),
      submissions: countSessions((event) => event.event_type === "form_submit" || (event.event_type === "ad_event" && event.value !== null && typeof event.value === "object" && "name" in event.value && event.value.name === "Lead")),
      engagementSeconds: selected.length ? behavior.reduce((sum, event) => sum + (event.event_type === "engagement_time" ? Math.max(0, event.duration_ms ?? 0) : 0), 0) / selected.length / 1000 : 0,
      requests: requests.length, contracts,
      lost: requests.filter((lead) => lead.crm_won !== true && (lead.crm_lost === true || lead.status === "descartado")).length,
      qualified: requests.filter((lead) => lead.crm_won !== true && lead.crm_lost !== true && lead.status === "qualificado").length,
      stages: [...stages.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      contractRate: requests.length ? contracts / requests.length * 100 : 0,
    };
  });
}