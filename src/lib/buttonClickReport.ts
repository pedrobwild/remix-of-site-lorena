export type ButtonEvent = { path: string | null; event_type: string; session_id: string | null; value: unknown };
export type ButtonRow = { page: string; label: string; cta: string; clicks: number; sessions: number };

/** Cliques e sessões são separados; bairro informado não é clique. */
export function summarizeButtonClicks(events: ButtonEvent[]): ButtonRow[] {
  const groups = new Map<string, { row: ButtonRow; sessions: Set<string> }>();
  for (const event of events) {
    if (!event.path || event.path === "/admin" || event.path.startsWith("/admin/")) continue;
    const value = event.value && typeof event.value === "object" ? event.value as Record<string, unknown> : {};
    if (value.action === "bairro_interesse") continue;
    const cta = typeof value.cta === "string" ? value.cta : "";
    const label = typeof value.label === "string" ? value.label : cta || ({ click_whatsapp: "WhatsApp", click_phone: "Telefone", click_contact: "E-mail" } as Record<string, string>)[event.event_type];
    if (!label) continue;
    const key = JSON.stringify([event.path, cta || label]);
    let group = groups.get(key);
    if (!group) {
      group = { row: { page: event.path, cta: cta || label, label, clicks: 0, sessions: 0 }, sessions: new Set() };
      groups.set(key, group);
    }
    group.row.clicks++;
    if (event.session_id) group.sessions.add(event.session_id);
  }
  return [...groups.values()].map(({ row, sessions }) => ({ ...row, sessions: sessions.size }))
    .sort((a, b) => b.clicks - a.clicks || a.page.localeCompare(b.page) || a.cta.localeCompare(b.cta));
}