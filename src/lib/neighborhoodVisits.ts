import { leadCanal, type LeadSourceInput } from "@/lib/leadSource";

export const VISIT_PATHS = ["/coletas-por-bairro", "/orcamento"] as const;
export type VisitPath = typeof VISIT_PATHS[number];
export type NeighborhoodEvent = LeadSourceInput & {
  id?: string; created_at?: string | null;
  event_type: string; path: string | null; session_id: string | null;
  visitor_id: string | null; value: unknown;
};

/** Bairro de interesse, nunca localização física; sem conteúdo livre além do bairro. */
export function interestNeighborhood(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim().replace(/\s+/g, " ");
  if (text.length < 2 || text.length > 120 || !/^[\p{L}\p{M}\s.'’()-]+$/u.test(text)) return null;
  return text.toLocaleLowerCase("pt-BR") === "brooklin paulista" ? "Brooklin" : text;
}

function neighborhoodFrom(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return interestNeighborhood((value as Record<string, unknown>).bairro_interesse);
}

/** Chegada por sessão e página; bairro e origem nunca são unidos a pedidos. */
export function neighborhoodVisitorArrivals(events: NeighborhoodEvent[]) {
  const ordered = events.filter((e) => VISIT_PATHS.some((path) => path === e.path))
    .sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? "") || (a.id ?? "").localeCompare(b.id ?? ""));
  const labels = new Map<string, Map<string, string>>();
  const scope = (e: NeighborhoodEvent) => JSON.stringify([e.path, e.session_id, e.visitor_id]);
  for (const e of ordered) {
    if (!e.session_id || !e.visitor_id || !["pageview", "click_cta"].includes(e.event_type)) continue;
    const bairro = neighborhoodFrom(e.value);
    if (!bairro) continue;
    const group = labels.get(scope(e)) ?? new Map<string, string>();
    group.set(bairro.toLocaleLowerCase("pt-BR"), bairro);
    labels.set(scope(e), group);
  }
  const arrivals = new Map<string, NeighborhoodEvent>();
  const identities = new Map<string, number>();
  for (const [index, e] of ordered.entries()) {
    if (e.event_type !== "pageview") continue;
    const key = e.session_id && e.visitor_id ? scope(e) : `event:${e.id ?? index}`;
    if (!arrivals.has(key)) arrivals.set(key, e);
    if (e.visitor_id && !identities.has(e.visitor_id)) identities.set(e.visitor_id, identities.size + 1);
  }
  return [...arrivals.entries()].map(([key, e]) => {
    let reference = "Não informada";
    try { if (e.referrer) reference = new URL(e.referrer).hostname; } catch { /* Não mostrar URLs inválidas. */ }
    const hasOrigin = Boolean(e.gclid || e.fbclid || e.utm_source || e.utm_medium || e.referrer);
    return { key, path: e.path, visitor: e.visitor_id ? `Visitante ${identities.get(e.visitor_id)}` : "Sem identificador",
      bairros: e.session_id && e.visitor_id ? [...(labels.get(scope(e))?.values() ?? [])] : [],
      createdAt: e.created_at, canal: hasOrigin ? leadCanal(e) : null,
      source: e.utm_source || "Não informada", medium: e.utm_medium || "Não informado", reference };
  }).reverse();
}

export function neighborhoodVisitTime(value: string | null | undefined): string {
  if (!value || !Number.isFinite(new Date(value).getTime())) return "Data não informada";
  return new Date(value).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit",
    year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function summarizeNeighborhoodVisits(events: NeighborhoodEvent[]) {
  return VISIT_PATHS.map((path) => {
    const views = events.filter((e) => e.path === path && e.event_type === "pageview");
    const interests = new Map<string, Map<string, string>>();
    for (const event of events) {
      if (event.path !== path || !event.session_id) continue;
      if (event.event_type !== "pageview" && event.event_type !== "click_cta") continue;
      const label = neighborhoodFrom(event.value);
      if (!label) continue;
      const labels = interests.get(event.session_id) ?? new Map<string, string>();
      labels.set(label.toLocaleLowerCase("pt-BR"), label);
      interests.set(event.session_id, labels);
    }
    const visitors = new Set<string>();
    const unknown = new Set<string>();
    const groups = new Map<string, { bairro: string; visitors: Set<string> }>();
    for (const view of views) {
      // Sem identificador real não se inventa visitante a partir de timestamp/id de evento.
      const id = view.visitor_id;
      if (!id) continue;
      visitors.add(id);
      const labels = view.session_id ? interests.get(view.session_id) : undefined;
      if (!labels?.size) { unknown.add(id); continue; }
      for (const [key, bairro] of labels) {
        const group = groups.get(key) ?? { bairro, visitors: new Set<string>() };
        group.visitors.add(id);
        groups.set(key, group);
      }
    }
    return {
      path, visitors: visitors.size, pageviews: views.length, unknown: unknown.size,
      bairros: [...groups.values()].map((g) => ({ bairro: g.bairro, visitors: g.visitors.size }))
        .sort((a, b) => b.visitors - a.visitors || a.bairro.localeCompare(b.bairro, "pt-BR")),
    };
  });
}