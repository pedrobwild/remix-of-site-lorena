import { topoVarianteDaBusca, type TopoVariante } from "@/lib/googleAdsVariant";

export type ButtonEvent = { path: string | null; event_type: string; session_id: string | null; value: unknown; utm_source?: string | null; utm_medium?: string | null; utm_campaign?: string | null; utm_content?: string | null };
export type ButtonRow = { page: string; label: string; cta: string; clicks: number; sessions: number };
export type ServiceButtonRow = ButtonRow & { variant: TopoVariante | "sem-atribuicao" };

export const SERVICE_VARIANT_LABELS: Record<ServiceButtonRow["variant"], string> = {
  padrao: "Padrão", studio: "Studio e apartamento pequeno", arquitetura: "Arquitetura e reforma",
  custo: "Custo e orçamento", investidor: "Investidor / Airbnb", planta: "Comprou na planta", "sem-atribuicao": "Sem atribuição ao Google Ads",
};

const SERVICE_CTA_BY_PAGE: Record<string, string> = {
  "/reforma-de-studio-sao-paulo": "servico-reforma-studio-sp-topo",
  "/reforma-de-apartamento-sao-paulo": "servico-reforma-apartamento-sp-topo",
};

/** Só os CTAs de topo solicitados; UTMs vêm do próprio clique consentido. */
export function summarizeServiceButtonClicks(events: ButtonEvent[]): ServiceButtonRow[] {
  const groups = new Map<string, { row: ServiceButtonRow; sessions: Set<string> }>();
  for (const event of events) {
    if (event.event_type !== "click_cta" || !event.path) continue;
    const cta = SERVICE_CTA_BY_PAGE[event.path];
    const value = event.value && typeof event.value === "object" ? event.value as Record<string, unknown> : {};
    if (!cta || value.cta !== cta) continue;
    const isGoogleAds = event.utm_source?.trim().toLowerCase() === "google"
      && ["cpc", "ppc", "paid", "paidsearch", "paid_search"].includes(event.utm_medium?.trim().toLowerCase() ?? "");
    const variant = isGoogleAds ? topoVarianteDaBusca({ utm_content: event.utm_content, utm_campaign: event.utm_campaign }) : "sem-atribuicao";
    const key = JSON.stringify([event.path, cta, variant]);
    let group = groups.get(key);
    if (!group) {
      group = { row: { page: event.path, label: "Peça seu orçamento", cta, variant, clicks: 0, sessions: 0 }, sessions: new Set() };
      groups.set(key, group);
    }
    group.row.clicks++;
    if (event.session_id) group.sessions.add(event.session_id);
  }
  return [...groups.values()].map(({ row, sessions }) => ({ ...row, sessions: sessions.size }))
    .sort((a, b) => b.clicks - a.clicks || a.page.localeCompare(b.page) || a.variant.localeCompare(b.variant));
}

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