import { useMemo, useState } from "react";
import { QUALITY_DIMENSIONS, summarizeAdsQuality, type QualityLead, type QualityDimension } from "@/lib/googleAdsQualityReport";

export default function GoogleAdsQualityPanel({ leads }: { leads: QualityLead[] }) {
  const [campaign, setCampaign] = useState("");
  const campaigns = useMemo(() => [...new Set(leads.map(lead => lead.utm_campaign || "Campanha não informada"))].sort(), [leads]);
  const rows = useMemo(() => summarizeAdsQuality(leads, campaign), [leads, campaign]);
  return <section aria-label="Desqualificação por perfil" className="border-t border-border mt-6 pt-5 min-w-0">
    <h2 className="font-semibold">Desqualificação por perfil</h2>
    <div className="form-leads__filters mt-3"><label>Campanha<select value={campaign} onChange={event => setCampaign(event.target.value)}><option value="">Todas as campanhas</option>{campaigns.map(value => <option key={value}>{value}</option>)}</select></label></div>
    <p className="text-sm text-muted-foreground my-3">Pedidos de orçamento atribuídos ao Google Ads no período. Status da última sincronização do CRM. Taxa calculada apenas entre leads com leitura; demais inclui leads ainda em andamento. Idade ausente não é deduzida pelas chaves. Amostras pequenas não comprovam causas.</p>
    {!rows.length ? <p>Nenhum pedido atribuído ao Google Ads no período selecionado.</p> : (Object.keys(QUALITY_DIMENSIONS) as QualityDimension[]).map(dimension => <div key={dimension} className="py-4 border-b border-border min-w-0">
      <h3 className="font-semibold">{QUALITY_DIMENSIONS[dimension]}</h3>
      {rows.filter(row => row.dimension === dimension).map(row => <div key={row.value} className="py-3 min-w-0">
        <p className="break-words">{row.value}</p>
        <dl className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-2 num">
          <div><dt className="text-sm text-muted-foreground">Leads</dt><dd>{row.leads}</dd></div>
          <div><dt className="text-sm text-muted-foreground">Desqualificados</dt><dd>{row.disqualified}</dd></div>
          <div><dt className="text-sm text-muted-foreground">Demais</dt><dd>{row.other}</dd></div>
          <div><dt className="text-sm text-muted-foreground">Sem leitura</dt><dd>{row.unavailable}</dd></div>
          <div><dt className="text-sm text-muted-foreground">Taxa de descarte</dt><dd>{row.rate === null ? "Sem leitura" : row.rate.toLocaleString("pt-BR", { style: "percent", maximumFractionDigits: 1 })}</dd></div>
        </dl>
      </div>)}
    </div>)}
  </section>;
}