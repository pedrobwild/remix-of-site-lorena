import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { RefreshCw } from "lucide-react";
import BewildAdminShell from "@/components/admin/BewildAdminShell";
import { Button } from "@/guia/components/ui/button";
import { getLeadValueReport } from "@/lib/leadValueReport.functions";
import { SERVICE_VARIANT_LABELS } from "@/lib/buttonClickReport";
import "@/styles/form-leads.css";

const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });

export default function LeadValuesPage() {
  const fetchReport = useServerFn(getLeadValueReport);
  const report = useQuery({ queryKey: ["lead-values-crm"], queryFn: () => fetchReport(), refetchInterval: 60_000 });
  const rows = report.data?.rows ?? [];
  const total = rows.reduce((s, r) => s + r.total, 0);
  const contracts = rows.reduce((s, r) => s + r.contracts, 0);
  return <BewildAdminShell active="valorleads" title="Valor dos leads no CRM" actions={<Button variant="outline" className="min-h-11" disabled={report.isFetching} onClick={() => void report.refetch()}><RefreshCw aria-hidden />Atualizar</Button>}>
    <section className="form-leads" aria-label="Valor real dos leads por variante e origem">
      <p className="text-sm text-muted-foreground mb-4">Valor real dos contratos fechados que o CRM devolve para cada lead. Contrato sem valor no CRM aparece como "sem valor informado"; nenhum número é estimado.</p>
      {report.isPending ? <p role="status">Consultando leads e contratos no CRM…</p>
        : report.isError ? <p role="alert">Não foi possível carregar os leads. Tente atualizar.</p>
        : !report.data.available ? <p role="alert">O CRM não respondeu. Os valores ficam indisponíveis até uma leitura válida — não foram tratados como zero.</p>
        : !rows.length ? <p>Nenhum lead encontrado.</p>
        : <>
          <p className="num mb-4">{contracts} contratos no CRM · {money(total)} em valor real</p>
          <div className="grid gap-4">
            {rows.map(row => <article key={row.variant + row.origin} className="border-b border-border pb-4 min-w-0">
              <h3 className="font-semibold break-words">{row.origin}</h3>
              <p className="text-sm text-muted-foreground break-words">{SERVICE_VARIANT_LABELS[row.variant]}</p>
              <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2 num">
                <div><dt className="text-sm text-muted-foreground">leads</dt><dd>{row.leads}</dd></div>
                <div><dt className="text-sm text-muted-foreground">contratos</dt><dd>{row.contracts}</dd></div>
                <div><dt className="text-sm text-muted-foreground">valor real</dt><dd>{row.withValue ? money(row.total) : "—"}</dd></div>
                <div><dt className="text-sm text-muted-foreground">sem valor informado</dt><dd>{row.withoutValue}</dd></div>
              </dl>
            </article>)}
          </div>
        </>}
    </section>
  </BewildAdminShell>;
}
