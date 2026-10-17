export const VISIT_PATHS = ["/coletas-por-bairro", "/orcamento"] as const;
export type VisitPath = typeof VISIT_PATHS[number];
export type NeighborhoodEvent = {
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