import type { QualityLead } from "@/lib/googleAdsQualityReport";
import { discardReasonLabel } from "@/lib/discardReason";
import { formatAreaM2 } from "@/lib/formatArea";

const NI = "Não informado";
type Lead = QualityLead & { id?: string; discard_reason?: string | null };

export default function DiscardedLeadsList({ leads }: { leads: Lead[] }) {
  const discarded = leads.filter(lead => lead.status === "descartado");
  return <section aria-label="Leads desqualificados e motivo registrado no CRM">
    <h2 className="font-display">Leads desqualificados ({discarded.length})</h2>
    {!discarded.length ? <p>Nenhum lead desqualificado no período.</p> : <>
      <div className="form-leads__header" aria-hidden><span>Finalidade</span><span>Bairro / metragem</span><span>Chaves</span><span>Motivo de descarte</span></div>
      {discarded.map((lead, index) => <article key={lead.id ?? index} className="form-leads__row">
        <div><span className="form-leads__mobile-label">Finalidade</span>{lead.objetivo?.trim() || NI}</div>
        <div><span className="form-leads__mobile-label">Bairro / metragem</span>{lead.location?.trim() || NI}<p className="num">{formatAreaM2(lead.area_m2) ?? `Metragem: ${NI}`}</p></div>
        <div><span className="form-leads__mobile-label">Chaves</span>{lead.chaves?.trim() || NI}</div>
        <div><span className="form-leads__mobile-label">Motivo de descarte</span><strong>{lead.discard_reason_unavailable ? "Consulta ao CRM indisponível" : discardReasonLabel(lead.discard_reason)}</strong></div>
      </article>)}
    </>}
  </section>;
}
