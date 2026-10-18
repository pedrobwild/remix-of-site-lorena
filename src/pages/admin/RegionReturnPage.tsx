import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { RefreshCw } from "lucide-react";
import BewildAdminShell from "@/components/admin/BewildAdminShell";
import { Button } from "@/guia/components/ui/button";
import { getFormLeads } from "@/lib/formLeads.functions";
import { summarizeRegionReturn } from "@/lib/regionReturn";
import "@/styles/form-leads.css";

export default function RegionReturnPage() {
  const fetchLeads = useServerFn(getFormLeads);
  const report = useQuery({ queryKey: ["form-leads-crm"], queryFn: () => fetchLeads(), refetchInterval: 60_000 });
  const [campaign, setCampaign] = useState("");
  const [search, setSearch] = useState("");
  const rows = report.data?.rows;
  const all = useMemo(() => summarizeRegionReturn(rows ?? []), [rows]);
  const campaigns = useMemo(() => [...new Set(all.map(r => r.campaign))].sort(), [all]);
  const filtered = all.filter(r => (!campaign || r.campaign === campaign) && (!search || r.bairro.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR"))));
  const totals = filtered.reduce((t, r) => ({ leads: t.leads + r.leads, contratos: t.contratos + r.contratos, semLeitura: t.semLeitura + r.semLeitura }), { leads: 0, contratos: 0, semLeitura: 0 });
  return <BewildAdminShell active="retornoregiao" title="Retorno por região" actions={<Button variant="outline" className="min-h-11" disabled={report.isFetching} onClick={() => void report.refetch()}><RefreshCw aria-hidden />Atualizar</Button>}>
    <section className="form-leads" aria-label="Contratos assinados por bairro e campanha">
      <div className="form-leads__filters">
        <label>Bairro<input type="search" value={search} onChange={e => setSearch(e.target.value)} /></label>
        <label>Campanha<select value={campaign} onChange={e => setCampaign(e.target.value)}><option value="">Todas</option>{campaigns.map(c => <option key={c}>{c}</option>)}</select></label>
      </div>
      {report.isPending ? <p role="status">Consultando leads e CRM…</p> : report.isError ? <p role="alert">Não foi possível carregar os leads. Tente atualizar.</p> : <>
        <div className="form-leads__summary"><strong className="num">{totals.contratos} contratos assinados de {totals.leads} leads</strong><span>Contrato assinado = negócio ganho no CRM. Bairro como o cliente escreveu. {totals.semLeitura > 0 && `${totals.semLeitura} leads sem leitura do CRM (não contam como zero).`}</span></div>
        {!filtered.length ? <p>Nenhum lead encontrado.</p> : <>
          <div className="form-leads__header" aria-hidden><span>Bairro</span><span>Campanha</span><span>Leads</span><span>Contratos assinados</span></div>
          {filtered.map(r => <article key={`${r.bairro}|${r.campaign}`} className="form-leads__row">
            <div><h2>{r.bairro}</h2></div>
            <div><span className="form-leads__mobile-label">Campanha</span>{r.campaign}</div>
            <div className="num"><span className="form-leads__mobile-label">Leads</span>{r.leads}{r.semLeitura > 0 && <p>{r.semLeitura} sem leitura do CRM</p>}</div>
            <div className="num"><span className="form-leads__mobile-label">Contratos assinados</span><strong>{r.contratos}</strong>{r.leads - r.semLeitura > 0 && <p>{Math.round((r.contratos / (r.leads - r.semLeitura)) * 100)}% dos lidos</p>}</div>
          </article>)}
        </>}
      </>}
    </section>
  </BewildAdminShell>;
}
