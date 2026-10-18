import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { RefreshCw } from "lucide-react";
import BewildAdminShell from "@/components/admin/BewildAdminShell";
import { Button } from "@/guia/components/ui/button";
import { getFormLeads } from "@/lib/formLeads.functions";
import { PROFILE_DIMENSIONS, summarizeCampaignProfiles, type ProfileDimension } from "@/lib/campaignProfiles";
import "@/styles/form-leads.css";

export default function CampaignProfilesPage() {
  const fetchLeads = useServerFn(getFormLeads);
  const report = useQuery({ queryKey: ["form-leads-crm"], queryFn: () => fetchLeads(), refetchInterval: 60_000 });
  const [dim, setDim] = useState<ProfileDimension>("finalidade");
  const [campaign, setCampaign] = useState("");
  const rows = report.data?.rows;
  const all = useMemo(() => summarizeCampaignProfiles(rows ?? [], dim), [rows, dim]);
  const campaigns = useMemo(() => [...new Set(all.map(r => r.campaign))].sort(), [all]);
  const filtered = all.filter(r => !campaign || r.campaign === campaign);
  return <BewildAdminShell active="perfiscampanha" title="Perfis por campanha" actions={<Button variant="outline" className="min-h-11" disabled={report.isFetching} onClick={() => void report.refetch()}><RefreshCw aria-hidden />Atualizar</Button>}>
    <section className="form-leads" aria-label="Leads e desqualificações por perfil e campanha">
      <div className="form-leads__filters">
        <label>Perfil por<select value={dim} onChange={e => setDim(e.target.value as ProfileDimension)}>{Object.entries(PROFILE_DIMENSIONS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
        <label>Campanha<select value={campaign} onChange={e => setCampaign(e.target.value)}><option value="">Todas</option>{campaigns.map(c => <option key={c}>{c}</option>)}</select></label>
      </div>
      {report.isPending ? <p role="status">Consultando leads e CRM…</p> : report.isError ? <p role="alert">Não foi possível carregar os leads. Tente atualizar.</p> : <>
        <div className="form-leads__summary"><strong className="num">{filtered.reduce((t, r) => t + r.leads, 0)} leads · {filtered.reduce((t, r) => t + r.desqualificados, 0)} desqualificados</strong><span>Desqualificado = “Perdido” no CRM. Taxa só entre leads com leitura do CRM. São associações, não causas.</span></div>
        {!filtered.length ? <p>Nenhum lead encontrado.</p> : <>
          <div className="form-leads__header" aria-hidden><span>Campanha</span><span>{PROFILE_DIMENSIONS[dim]}</span><span>Leads</span><span>Desqualificados</span></div>
          {filtered.map(r => { const lidos = r.leads - r.semLeitura; return <article key={`${r.campaign}|${r.perfil}`} className="form-leads__row">
            <div><h2>{r.campaign}</h2></div>
            <div><span className="form-leads__mobile-label">{PROFILE_DIMENSIONS[dim]}</span>{r.perfil}</div>
            <div className="num"><span className="form-leads__mobile-label">Leads</span>{r.leads}{r.semLeitura > 0 && <p>{r.semLeitura} sem leitura do CRM</p>}</div>
            <div className="num"><span className="form-leads__mobile-label">Desqualificados</span><strong>{r.desqualificados}</strong>{lidos > 0 && <p>{Math.round((r.desqualificados / lidos) * 100)}% dos lidos</p>}</div>
          </article>; })}
        </>}
      </>}
    </section>
  </BewildAdminShell>;
}
