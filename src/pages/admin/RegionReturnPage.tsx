import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { RefreshCw } from "lucide-react";
import BewildAdminShell from "@/components/admin/BewildAdminShell";
import { Button } from "@/guia/components/ui/button";
import { getFormLeads } from "@/lib/formLeads.functions";
import { summarizeRegionReturn } from "@/lib/regionReturn";
import { getClosedContracts } from "@/lib/crmContracts.functions";
import "@/styles/form-leads.css";

export default function RegionReturnPage() {
  const fetchLeads = useServerFn(getFormLeads);
  const report = useQuery({ queryKey: ["form-leads-crm"], queryFn: () => fetchLeads(), refetchInterval: 60_000 });
  const fetchContracts = useServerFn(getClosedContracts);
  const contracts = useQuery({ queryKey: ["region-closed-contracts"], queryFn: () => fetchContracts(), refetchInterval: 60_000 });
  const [campaign, setCampaign] = useState("");
  const [search, setSearch] = useState("");
  const rows = report.data?.rows;
  const realContracts = contracts.data?.available === true && !contracts.isError ? contracts.data.contracts : null;
  const all = useMemo(() => summarizeRegionReturn(rows ?? [], realContracts), [rows, realContracts]);
  const campaigns = useMemo(() => [...new Set(all.map(r => r.campaign))].sort(), [all]);
  const filtered = all.filter(r => (!campaign || r.campaign === campaign) && (!search || r.bairro.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR"))));
  const totals = filtered.reduce((t, r) => ({ leads: t.leads + r.leads, contratos: t.contratos + r.contratos, semLeitura: t.semLeitura + r.semLeitura }), { leads: 0, contratos: 0, semLeitura: 0 });
  const loading = report.isPending || contracts.isPending;
  const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  return <BewildAdminShell active="retornoregiao" title="Retorno por região" actions={<Button variant="outline" className="min-h-11" disabled={report.isFetching || contracts.isFetching} onClick={() => { void report.refetch(); void contracts.refetch(); }}><RefreshCw aria-hidden />Atualizar</Button>}>
    <section className="form-leads form-leads--region" aria-label="Contratos assinados por bairro e campanha">
      <div className="form-leads__filters">
        <label>Bairro<input type="search" value={search} onChange={e => setSearch(e.target.value)} /></label>
        <label>Campanha<select value={campaign} onChange={e => setCampaign(e.target.value)}><option value="">Todas</option>{campaigns.map(c => <option key={c}>{c}</option>)}</select></label>
      </div>
      {loading ? <p role="status">Consultando leads e CRM…</p> : report.isError ? <p role="alert">Não foi possível carregar os leads. Tente atualizar.</p> : <>
        <div className="form-leads__summary"><strong className="num">{totals.contratos} {realContracts === null ? (totals.contratos === 1 ? "lead com contrato confirmado" : "leads com contrato confirmado") : (totals.contratos === 1 ? "contrato assinado" : "contratos assinados")} de {totals.leads} leads</strong>{realContracts !== null && <strong className="num">Valor informado: {money(filtered.reduce((sum, r) => sum + (r.valorReal ?? 0), 0))}</strong>}</div>
        {realContracts === null && <p role="status">Consulta de contratos detalhados indisponível no CRM. A contagem vem das etapas; valor e data de assinatura não informados.</p>}
        {totals.semLeitura > 0 && <p>{totals.semLeitura} leads sem leitura das etapas do CRM.</p>}
        {!filtered.length ? <p>Nenhum lead encontrado.</p> : <>
          <div className="form-leads__header" aria-hidden><span>Bairro</span><span>Campanha</span><span>Leads</span><span>Contratos</span><span>Valor real</span><span>Data de assinatura</span></div>
          {filtered.map(r => <article key={`${r.bairro}|${r.campaign}`} className="form-leads__row">
            <div><h2>{r.bairro}</h2></div>
            <div><span className="form-leads__mobile-label">Campanha</span>{r.campaign}</div>
            <div className="num"><span className="form-leads__mobile-label">Leads</span>{r.leads}{r.semLeitura > 0 && <p>{r.semLeitura} sem leitura do CRM</p>}</div>
            <div className="num"><span className="form-leads__mobile-label">Contratos</span><strong>{r.contratos}</strong>{realContracts === null && r.leads - r.semLeitura > 0 && <p>{Math.round((r.contratos / (r.leads - r.semLeitura)) * 100)}% dos lidos</p>}</div>
            <div className="num"><span className="form-leads__mobile-label">Valor real</span>{realContracts === null ? "Não informado" : <><strong>{money(r.valorReal ?? 0)}</strong>{(r.semValor ?? 0) > 0 && <p>{r.semValor} contrato(s) sem valor informado</p>}</>}</div>
            <div className="num"><span className="form-leads__mobile-label">Data de assinatura</span>{r.assinaturas?.length ? r.assinaturas.map((c, index) => <p key={c.id}>Contrato {index + 1}: {c.closed_at ? <time dateTime={c.closed_at}>{new Date(c.closed_at).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}</time> : "Não informada"}<br />{c.total === null ? "Valor não informado" : money(c.total)}</p>) : realContracts === null ? "Não informada" : "—"}</div>
          </article>)}
        </>}
      </>}
    </section>
  </BewildAdminShell>;
}
