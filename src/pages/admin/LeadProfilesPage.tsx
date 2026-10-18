import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import BewildAdminShell from "@/components/admin/BewildAdminShell";
import { Button } from "@/guia/components/ui/button";
import { getFormLeads } from "@/lib/formLeads.functions";
import { formatAreaM2 } from "@/lib/formatArea";
import "@/styles/form-leads.css";

const PAGE_SIZE = 25;
const NI = "Não informado";
const date = (iso: string) => new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(iso));

export default function LeadProfilesPage() {
  const fetchLeads = useServerFn(getFormLeads);
  const report = useQuery({ queryKey: ["form-leads-crm"], queryFn: () => fetchLeads(), refetchInterval: 60_000 });
  const [search, setSearch] = useState("");
  const [finalidade, setFinalidade] = useState("");
  const [chaves, setChaves] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const rows = report.data?.rows;
  const filtered = useMemo(() => (rows ?? []).filter(row =>
    (!search || `${row.name} ${row.bairro ?? ""}`.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR")))
    && (!finalidade || (row.objetivo ?? NI) === finalidade) && (!chaves || (row.chaves ?? NI) === chaves) && (!status || row.status === status)
  ), [rows, search, finalidade, chaves, status]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const options = (pick: (r: NonNullable<typeof rows>[number]) => string) => [...new Set((rows ?? []).map(pick))].sort();
  function change(setter: (v: string) => void, v: string) { setter(v); setPage(0); }
  return <BewildAdminShell active="perfilleads" title="Perfil dos leads" actions={<Button variant="outline" className="min-h-11" disabled={report.isFetching} onClick={() => void report.refetch()}><RefreshCw aria-hidden />Atualizar</Button>}>
    <section className="form-leads" aria-label="Perfil do imóvel de cada lead">
      <div className="form-leads__filters">
        <label>Nome ou bairro<input type="search" value={search} onChange={e => change(setSearch, e.target.value)} /></label>
        <label>Finalidade<select value={finalidade} onChange={e => change(setFinalidade, e.target.value)}><option value="">Todas</option>{options(r => r.objetivo ?? NI).map(v => <option key={v}>{v}</option>)}</select></label>
        <label>Situação das chaves<select value={chaves} onChange={e => change(setChaves, e.target.value)}><option value="">Todas</option>{options(r => r.chaves ?? NI).map(v => <option key={v}>{v}</option>)}</select></label>
        <label>Status no CRM<select value={status} onChange={e => change(setStatus, e.target.value)}><option value="">Todos</option>{options(r => r.status).map(v => <option key={v}>{v}</option>)}</select></label>
      </div>
      {report.isPending ? <p role="status">Consultando leads e CRM…</p> : report.isError ? <p role="alert">Não foi possível carregar os leads. Tente atualizar.</p> : <>
        <div className="form-leads__summary"><strong>{filtered.length} leads</strong><span>Dados como o cliente preencheu; campos vazios aparecem como “{NI}”.</span></div>
        {!filtered.length ? <p>Nenhum lead encontrado.</p> : <>
          <div className="form-leads__header" aria-hidden><span>Lead / data</span><span>Finalidade</span><span>Bairro / metragem</span><span>Chaves / status no CRM</span></div>
          {filtered.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE).map(row => <article key={row.id} className="form-leads__row">
            <div><h2>{row.name}</h2><time dateTime={row.createdAt}>{date(row.createdAt)}</time><p>{row.origin}</p></div>
            <div><span className="form-leads__mobile-label">Finalidade</span>{row.objetivo ?? NI}</div>
            <div><span className="form-leads__mobile-label">Bairro / metragem</span>{row.bairro ?? NI}<p className="num">{row.areaM2 != null ? `${formatAreaM2(row.areaM2)}` : `Metragem: ${NI}`}</p></div>
            <div><span className="form-leads__mobile-label">Chaves / status no CRM</span>{row.chaves ?? NI}<p><strong>{row.status}</strong></p></div>
          </article>)}
          <nav className="form-leads__pagination" aria-label="Paginação de leads"><Button variant="outline" size="icon" className="min-h-11 min-w-11" aria-label="Página anterior" disabled={current === 0} onClick={() => setPage(current - 1)}><ChevronLeft /></Button><span>Página {current + 1} de {pages}</span><Button variant="outline" size="icon" className="min-h-11 min-w-11" aria-label="Próxima página" disabled={current + 1 >= pages} onClick={() => setPage(current + 1)}><ChevronRight /></Button></nav>
        </>}
      </>}
    </section>
  </BewildAdminShell>;
}
