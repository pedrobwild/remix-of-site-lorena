export type QualityEvent = { lead_id: string; to_status: string; created_at: string };
export function qualityDaily(events: readonly QualityEvent[], now = new Date()) {
  const day = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  const today = day(now);
  const anchor = new Date(`${today}T12:00:00-03:00`);
  const rows = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(anchor); date.setUTCDate(date.getUTCDate() - 29 + i);
    return { day: day(date), qualified: 0, disqualified: 0 };
  });
  const map = new Map(rows.map(row => [row.day, row]));
  const seen = new Set<string>();
  for (const event of events) {
    const date = new Date(event.created_at);
    if (!Number.isFinite(date.getTime()) || !["qualificado", "descartado"].includes(event.to_status)) continue;
    const key = day(date), row = map.get(key), identity = `${key}:${event.lead_id}:${event.to_status}`;
    if (!row || seen.has(identity)) continue;
    seen.add(identity);
    if (event.to_status === "qualificado") row.qualified += 1;
    else row.disqualified += 1;
  }
  return rows;
}