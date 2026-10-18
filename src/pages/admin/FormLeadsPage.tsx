import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import BewildAdminShell from "@/components/admin/BewildAdminShell";
import { Button } from "@/guia/components/ui/button";
import { getFormLeads } from "@/lib/formLeads.functions";
import { SERVICE_VARIANT_LABELS } from "@/lib/buttonClickReport";
import "@/styles/form-leads.css";

const PAGE_SIZE = 25;
const date = (iso: string) => new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

export default function FormLeadsPage() {
  const fetchLeads = useServerFn(getFormLeads);
  const report = useQuery({ queryKey: ["form-leads-crm"], queryFn: () => fetchLeads(), refetchInterval: 60_000 });
  const [search, setSearch] = useState("");
  const [variant, setVariant] = useState("");
  const [origin, setOrigin] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [until, setUntil] = useState("");
  const [page, setPage] = useState(0);
  const rows = report.data?.rows;
  const filtered = useMemo(() => (rows ?? []).filter(row => {
    const day = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(row.createdAt));
    return (!search || `${row.name} ${row.campaign ?? ""}`.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR"))) && (!variant || row.variant === variant) && (!origin || row.origin === origin) && (!status || row.status === status) && (!from || day >= from) && (!until || day <= until);
  }), [rows, search, variant, origin, status, from, until]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const options = (field: "origin" | "status") => [...new Set((rows ?? []).map(row => row[field]))].sort();
  function change(setter: (value: string) => void, value: string) { setter(value); setPage(0); }
  return <BewildAdminShell active="formulario" title="Leads do formulário" actions={<Button variant="outline" className="min-h-11" disabled={report.isFetching} onClick={() => void report.refetch()}><RefreshCw aria-hidden />Atualizar</Button>}>
    <section className="form-leads" aria-label="Leads de orçamento">
      <div className="form-leads__filters">
        <label>Nome ou campanha<input type="search" value={search} onChange={e => change(setSearch, e.target.value)} /></label>
        <label>Variante<select value={variant} onChange={e => change(setVariant, e.target.value)}><option value="">Todas</option>{Object.entries(SERVICE_VARIANT_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label>Origem<select value={origin} onChange={e => change(setOrigin, e.target.value)}><option value="">Todas</option>{options("origin").map(value => <option key={value}>{value}</option>)}</select></label>
        <label>Status no CRM<select value={status} onChange={e => change(setStatus, e.target.value)}><option value="">Todos</option>{options("status").map(value => <option key={value}>{value}</option>)}</select></label>
        <label>De<input type="date" value={from} onChange={e => change(setFrom, e.target.value)} /></label>
        <label>Até<input type="date" value={until} onChange={e => change(setUntil, e.target.value)} /></label>
      </div>
      {report.isPending ? <p role="status">Consultando leads e CRM…</p> : report.isError ? <p role="alert">Não foi possível carregar os leads. Tente atualizar.</p> : <>
        <div className="form-leads__summary"><strong>{filtered.length} leads</strong>{report.data && <span>Atualizado em {date(report.data.checkedAt)}</span>}</div>
        {!filtered.length ? <p>Nenhum lead encontrado.</p> : <>
          <div className="form-leads__header" aria-hidden><span>Lead / data</span><span>Variante</span><span>Origem / campanha</span><span>Status no CRM</span></div>
          {filtered.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE).map(row => <article key={row.id} className="form-leads__row">
            <div><h2>{row.name}</h2><time dateTime={row.createdAt}>{date(row.createdAt)}</time>{row.objetivo && <p>{row.objetivo}</p>}</div>
            <div><span className="form-leads__mobile-label">Variante</span>{SERVICE_VARIANT_LABELS[row.variant]}</div>
            <div><span className="form-leads__mobile-label">Origem / campanha</span>{row.origin}{row.campaign && <p>{row.campaign}</p>}</div>
            <div><span className="form-leads__mobile-label">Status no CRM</span><strong>{row.status}</strong></div>
          </article>)}
          <nav className="form-leads__pagination" aria-label="Paginação de leads"><Button variant="outline" size="icon" className="min-h-11 min-w-11" title="Página anterior" aria-label="Página anterior" disabled={current === 0} onClick={() => setPage(current - 1)}><ChevronLeft /></Button><span>Página {current + 1} de {pages}</span><Button variant="outline" size="icon" className="min-h-11 min-w-11" title="Próxima página" aria-label="Próxima página" disabled={current + 1 >= pages} onClick={() => setPage(current + 1)}><ChevronRight /></Button></nav>
        </>}
      </>}
    </section>
  </BewildAdminShell>;
}