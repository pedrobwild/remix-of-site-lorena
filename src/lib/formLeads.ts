import { leadCanal, LEAD_CANAL_LABEL, type LeadSourceInput } from "@/lib/leadSource";
import { topoVarianteDaBusca } from "@/lib/googleAdsVariant";
import type { CrmLeadItem } from "@/lib/crmStage";

export type FormLead = LeadSourceInput & {
  id: string;
  name: string;
  created_at: string;
  utm_campaign: string | null;
  utm_content: string | null;
  objetivo: string | null;
};

export function formLeadRow(lead: FormLead, item: CrmLeadItem | undefined, checked: boolean) {
  const canal = leadCanal(lead);
  const status = !checked ? "CRM indisponível"
    : !item || item.deal_count === 0 ? "Sem negócio no CRM"
    : item.won === true ? "Contrato fechado"
    : item.all_closed_lost === true ? "Perdido"
    : item.current_stage_name || "Etapa não informada";
  return {
    id: lead.id, name: lead.name, createdAt: lead.created_at,
    variant: canal === "google_ads" ? topoVarianteDaBusca({ utm_campaign: lead.utm_campaign, utm_content: lead.utm_content }) : "sem-atribuicao" as const,
    origin: LEAD_CANAL_LABEL[canal], campaign: lead.utm_campaign,
    objetivo: lead.objetivo, status,
  };
}

export type FormLeadRow = ReturnType<typeof formLeadRow>;