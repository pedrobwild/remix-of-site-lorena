import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LEAD_STATUSES, leadFormOrFilter, type LeadStatus } from "@/lib/adminLeads";
import { LEAD_STATUS_LABEL } from "@/lib/crmStage";
import { collectRequestPages, groupRequestsByNeighborhood, neighborhoodKey, requestNeighborhood, selectBudgetRequests, type BudgetRequest } from "@/lib/budgetRequests";
import { LeadCrmStatus, fmtCrmDateTime } from "@/components/admin/LeadCrmStatus";
import "@/styles/budget-requests.css";

async function loadRequests() {
  const rows = await collectRequestPages<BudgetRequest>((from, to) => supabase.from("leads")
    .select("id,name,location,status,created_at,form_path,landing_path,crm_stage_name,crm_won,crm_lost,crm_deal_count")
    .or(leadFormOrFilter(["/orcamento"]))
    .order("created_at", { ascending: false }).order("id", { ascending: false }).range(from, to));
  return selectBudgetRequests(rows);
}

export default function BudgetRequestsPanel() {
  const [bairro, setBairro] = useState("all");
  const [status, setStatus] = useState<"all" | LeadStatus>("all");
  const { data, isPending, isError, isFetching, refetch } = useQuery({ queryKey: ["admin", "budget-requests"], queryFn: loadRequests });
  const rows = data ?? [];
  const neighborhoods = useMemo(() => groupRequestsByNeighborhood(data ?? []), [data]);
  const filtered = rows.filter((row) => (bairro === "all" || neighborhoodKey(row.location) === bairro) && (status === "all" || row.status === status));
  const groups = groupRequestsByNeighborhood(filtered);

  return <section className="bw-requests" aria-label="Pedidos de orçamento">
    <div className="bw-requests__head">
      <h2>Orçamentos · /orcamento</h2>
      <button type="button" className="bw-admin__btn" onClick={() => void refetch()} disabled={isFetching} aria-label="Atualizar pedidos"><RefreshCw aria-hidden />Atualizar</button>
    </div>
    <div className="bw-requests__filters">
      <label>Bairro<select value={bairro} onChange={(event) => setBairro(event.target.value)}><option value="all">Todos os bairros</option>{neighborhoods.map((group) => <option key={group.key} value={group.key}>{group.name}</option>)}</select></label>
      <label>Status<select value={status} onChange={(event) => setStatus(event.target.value as "all" | LeadStatus)}><option value="all">Todos os status</option>{LEAD_STATUSES.map((value) => <option key={value} value={value}>{LEAD_STATUS_LABEL[value]}</option>)}</select></label>
    </div>
    {isPending ? <p className="bw-admin__empty" role="status">Carregando pedidos…</p> : isError ? <div role="alert"><p>Não foi possível carregar os pedidos.</p><button type="button" className="bw-admin__btn" onClick={() => void refetch()}>Tentar novamente</button></div> : <>
      <p className="bw-requests__total" role="status"><strong>{filtered.length.toLocaleString("pt-BR")}</strong> pedidos{filtered.length !== rows.length ? ` de ${rows.length.toLocaleString("pt-BR")}` : ""}</p>
      {filtered.length === 0 ? <p className="bw-admin__empty">{rows.length === 0 ? "Nenhum pedido recebido pelo /orcamento ainda." : "Nenhum pedido com estes filtros."}</p> : <>
        <h3>Pedidos por bairro e status</h3>
        <div className="bw-requests__neighborhoods">{groups.map((group) => <article key={group.key} className="bw-requests__neighborhood">
          <h4>{group.name}<span className="num">{group.total}</span></h4>
          <dl>{LEAD_STATUSES.map((value) => <div key={value}><dt>{LEAD_STATUS_LABEL[value]}</dt><dd className="num">{group[value]}</dd></div>)}</dl>
        </article>)}</div>
        <h3>Pedidos recebidos</h3>
        <ul className="bw-requests__list">{filtered.map((row) => <li key={row.id}>
          <div><strong>{row.name || "Sem nome"}</strong><p>{requestNeighborhood(row.location)}</p></div>
          <LeadCrmStatus lead={row} />
          <time dateTime={row.created_at}>{fmtCrmDateTime(row.created_at)}</time>
        </li>)}</ul>
      </>}
    </>}
  </section>;
}